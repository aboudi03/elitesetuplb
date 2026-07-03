const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { validateOrderData, ValidationError } = require('../utills/validation');
const { createOrderUpdateNotification } = require('../utills/notificationHelpers');
const { getStatusWithGroup, ensureDefaultOrderStatuses } = require('../utills/orderStatus');
const { ensureDefaultDeliveryZones } = require('../utills/deliveryZones');

function normalizeStatusCode(status) {
  return status === 'canceled' ? 'cancelled' : status;
}

function parsePositiveInteger(value, fallback, { min = 1, max = 200 } = {}) {
  const parsedValue = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return Math.min(Math.max(parsedValue, min), max);
}

function parseOptionalNumber(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function parseOptionalDate(value, { endOfDay = false } = {}) {
  if (!value || typeof value !== "string") {
    return undefined;
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return undefined;
  }

  const dateValue = new Date(
    endOfDay ? `${normalizedValue}T23:59:59.999Z` : `${normalizedValue}T00:00:00.000Z`
  );

  return Number.isNaN(dateValue.getTime()) ? undefined : dateValue;
}

async function resolveDeliveryZone(deliveryZoneId) {
  await ensureDefaultDeliveryZones(prisma);

  const normalizedId =
    typeof deliveryZoneId === "string" && deliveryZoneId.trim().length > 0
      ? deliveryZoneId.trim()
      : "";

  if (normalizedId) {
    const selectedZone = await prisma.deliveryZone.findFirst({
      where: {
        id: normalizedId,
        isActive: true,
      },
    });

    if (selectedZone) {
      return selectedZone;
    }
  }

  return prisma.deliveryZone.findFirst({
    where: {
      code: "standard-lebanon",
      isActive: true,
    },
  });
}

function buildOrderSearchConditions(searchValue) {
  if (!searchValue || typeof searchValue !== "string") {
    return [];
  }

  const normalizedSearchValue = searchValue.trim();

  if (!normalizedSearchValue) {
    return [];
  }

  const searchConditions = [
    {
      id: {
        contains: normalizedSearchValue,
      },
    },
    {
      name: {
        contains: normalizedSearchValue,
      },
    },
    {
      lastname: {
        contains: normalizedSearchValue,
      },
    },
    {
      email: {
        contains: normalizedSearchValue,
      },
    },
    {
      phone: {
        contains: normalizedSearchValue,
      },
    },
    {
      city: {
        contains: normalizedSearchValue,
      },
    },
  ];

  const numericSearchValue = Number.parseInt(normalizedSearchValue, 10);

  if (Number.isFinite(numericSearchValue)) {
    searchConditions.push({
      orderNumber: numericSearchValue,
    });
  }

  return searchConditions;
}

function getOrderSort(sortBy, sortDirection) {
  const normalizedDirection = sortDirection === "asc" ? "asc" : "desc";

  switch (sortBy) {
    case "orderNumber":
      return [{ orderNumber: normalizedDirection }, { dateTime: "desc" }];
    case "customer":
      return [{ name: normalizedDirection }, { lastname: normalizedDirection }];
    case "status":
      return [{ status: normalizedDirection }, { dateTime: "desc" }];
    case "total":
      return [{ total: normalizedDirection }, { dateTime: "desc" }];
    case "city":
      return [{ city: normalizedDirection }, { dateTime: "desc" }];
    case "date":
    default:
      return [{ dateTime: normalizedDirection }];
  }
}

async function resolveStatusInfo(status) {
  const normalizedStatus = normalizeStatusCode(status);
  const statusInfo = await getStatusWithGroup(prisma, normalizedStatus);

  if (statusInfo) {
    return statusInfo;
  }

  return {
    status: {
      code: normalizedStatus || 'unknown',
      name: normalizedStatus || 'Unknown',
      groupCode: 'preparation',
    },
    group: {
      code: 'preparation',
      name: 'Preparation',
      isCompletedGroup: false,
    },
  };
}

async function createCustomerOrder(request, response) {
  try {
    console.log("=== ORDER CREATION REQUEST ===");
    console.log("Request body:", JSON.stringify(request.body, null, 2));
    
    // Validate request body
    if (!request.body || typeof request.body !== 'object') {
      console.log("❌ Invalid request body");
      return response.status(400).json({ 
        error: "Invalid request body",
        details: "Request body must be a valid JSON object"
      });
    }

    // Server-side validation
    const validation = validateOrderData(request.body);
    console.log("Validation result:", validation);
    
    if (!validation.isValid) {
      console.log("❌ Validation failed:", validation.errors);
      return response.status(400).json({
        error: "Validation failed",
        details: validation.errors
      });
    }

    const validatedData = validation.validatedData;
    console.log("✅ Validation passed, validated data:", validatedData);
    validatedData.status = normalizeStatusCode(validatedData.status);

    // Additional business logic validation
    if (validatedData.total < 0.01) {
      console.log("❌ Invalid total amount");
      return response.status(400).json({
        error: "Invalid order total",
        details: [{ field: 'total', message: 'Order total must be at least $0.01' }]
      });
    }

    // Check for duplicate orders (same email and total within last 1 minute) - less strict
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
    const duplicateOrder = await prisma.customer_order.findFirst({
      where: {
        email: validatedData.email,
        total: validatedData.total,
        dateTime: {
          gte: oneMinuteAgo
        }
      }
    });

    if (duplicateOrder) {
      console.log("❌ Duplicate order detected (same email, amount, within 1 minute)");
      return response.status(409).json({
        error: "Duplicate order detected",
        details: "An identical order was just created. Please wait a moment before creating another order with the same details."
      });
    }

    console.log("Creating order in database...");
    await ensureDefaultOrderStatuses(prisma);
    const nextStatusInfo = await getStatusWithGroup(prisma, validatedData.status);
    const deliveryZone = await resolveDeliveryZone(request.body.deliveryZoneId);
    const deliveryFee = Number(deliveryZone?.fee || 5);
    const grandTotal = Number(validatedData.total || 0) + deliveryFee;

    // Create the order with validated data
    const corder = await prisma.$transaction(async (tx) => {
      const latestOrder = await tx.customer_order.findFirst({
        where: {
          orderNumber: {
            not: null,
          },
        },
        orderBy: {
          orderNumber: 'desc',
        },
        select: {
          orderNumber: true,
        },
      });
      const nextOrderNumber = (latestOrder?.orderNumber || 0) + 1;

      const createdOrder = await tx.customer_order.create({
        data: {
          orderNumber: nextOrderNumber,
          name: validatedData.name,
          lastname: validatedData.lastname,
          phone: validatedData.phone,
          email: validatedData.email,
          company: validatedData.company,
          adress: validatedData.adress,
          apartment: validatedData.apartment,
          postalCode: "",
          status: validatedData.status,
          city: deliveryZone?.city || validatedData.city,
          country: deliveryZone?.country || "Lebanon",
          deliveryZoneId: deliveryZone?.id || null,
          deliveryFee,
          grandTotal,
          orderNotice: validatedData.orderNotice,
          total: validatedData.total,
          dateTime: new Date()
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          customerOrderId: createdOrder.id,
          previousStatus: null,
          newStatus: validatedData.status,
          previousGroupCode: null,
          newGroupCode: nextStatusInfo?.group.code || "preparation",
          note: "Order created",
          changedBy: request.body.userId || null,
        },
      });

      return createdOrder;
    });

    console.log("✅ Order created successfully:", corder);
    console.log("Order ID:", corder.id);

    // Create notification for the user if they have an account
    try {
      let user = null;
      
      // First, try to use userId if provided (from logged-in user)
      if (request.body.userId) {
        console.log(`🔍 Using provided userId: ${request.body.userId}`);
        user = await prisma.user.findUnique({
          where: { id: request.body.userId }
        });
        if (user) {
          console.log(`✅ Found user by ID: ${user.email}`);
        } else {
          console.log(`❌ User not found with ID: ${request.body.userId}`);
        }
      }
      
      // Fallback: search by email if no userId or user not found
      if (!user) {
        console.log(`🔍 Searching user by email: ${validatedData.email}`);
        user = await prisma.user.findUnique({
          where: { email: validatedData.email }
        });
        if (user) {
          console.log(`✅ Found user by email: ${user.email}`);
        }
      }
      
      if (user) {
        await createOrderUpdateNotification(
          user.id,
          'confirmed',
          corder.id,
          validatedData.total,
          corder.orderNumber
        );
        console.log(`📧 Order confirmation notification sent to user: ${user.email}`);
      } else {
        console.log(`ℹ️  No user account found for email: ${validatedData.email} - notification skipped`);
      }
    } catch (notificationError) {
      console.error('❌ Failed to create order notification:', notificationError);
      // Don't fail the order if notification fails
    }

    // Log successful order creation (for monitoring)
    console.log(`Order created successfully: ID ${corder.id}, Email: ${validatedData.email}, Total: $${validatedData.total}`);

    const responseData = {
      id: corder.id,
      message: "Order created successfully",
      orderNumber: corder.orderNumber
    };
    
    console.log("Sending response:", responseData);
    return response.status(201).json(responseData);

  } catch (error) {
    console.error("❌ Error creating order:", error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return response.status(409).json({ 
        error: "Order conflict",
        details: "An order with this information already exists"
      });
    }

    // Handle validation errors
    if (error instanceof ValidationError) {
      return response.status(400).json({
        error: "Validation failed",
        details: [{ field: error.field, message: error.message }]
      });
    }

    // Generic error response
    return response.status(500).json({ 
      error: "Internal server error",
      details: "Failed to create order. Please try again later."
    });
  }
}

async function updateCustomerOrder(request, response) {
  try {
    const { id } = request.params;
    
    // Validate ID format
    if (!id || typeof id !== 'string') {
      return response.status(400).json({
        error: "Invalid order ID",
        details: "Order ID must be provided"
      });
    }

    // Validate request body
    if (!request.body || typeof request.body !== 'object') {
      return response.status(400).json({ 
        error: "Invalid request body",
        details: "Request body must be a valid JSON object"
      });
    }

    // Server-side validation for update data
    const validation = validateOrderData(request.body);
    
    if (!validation.isValid) {
      return response.status(400).json({
        error: "Validation failed",
        details: validation.errors
      });
    }

    const validatedData = validation.validatedData;
    validatedData.status = normalizeStatusCode(validatedData.status);

    const existingOrder = await prisma.customer_order.findUnique({
      where: {
        id: id,
      },
    });

    if (!existingOrder) {
      return response.status(404).json({ 
        error: "Order not found",
        details: "The specified order does not exist"
      });
    }

    await ensureDefaultOrderStatuses(prisma);

    const previousStatusInfo = await resolveStatusInfo(existingOrder.status);
    const nextStatusInfo = await getStatusWithGroup(prisma, validatedData.status);

    if (!nextStatusInfo) {
      return response.status(400).json({
        error: "Invalid order status",
        details: `Status '${validatedData.status}' is not configured`,
      });
    }

    const statusChanged = existingOrder.status !== validatedData.status;
    const enteringCompleted =
      statusChanged &&
      !previousStatusInfo.group.isCompletedGroup &&
      nextStatusInfo.group.isCompletedGroup;
    const leavingCompleted =
      statusChanged &&
      previousStatusInfo.group.isCompletedGroup &&
      !nextStatusInfo.group.isCompletedGroup;
    const deliveryZone = await resolveDeliveryZone(request.body.deliveryZoneId || existingOrder.deliveryZoneId);
    const deliveryFee = Number(deliveryZone?.fee ?? existingOrder.deliveryFee ?? 5);
    const grandTotal = Number(validatedData.total || 0) + deliveryFee;

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const orderUpdate = await tx.customer_order.update({
        where: {
          id: existingOrder.id,
        },
        data: {
          name: validatedData.name,
          lastname: validatedData.lastname,
          phone: validatedData.phone,
          email: validatedData.email,
          company: validatedData.company,
          adress: validatedData.adress,
          apartment: validatedData.apartment,
          postalCode: "",
          status: validatedData.status,
          city: deliveryZone?.city || validatedData.city,
          country: deliveryZone?.country || existingOrder.country || "Lebanon",
          deliveryZoneId: deliveryZone?.id || existingOrder.deliveryZoneId || null,
          deliveryFee,
          grandTotal,
          orderNotice: validatedData.orderNotice,
          total: validatedData.total,
        },
      });

      if (statusChanged) {
        await tx.orderStatusHistory.create({
          data: {
            customerOrderId: existingOrder.id,
            previousStatus: existingOrder.status,
            newStatus: validatedData.status,
            previousGroupCode: previousStatusInfo.group.code,
            newGroupCode: nextStatusInfo.group.code,
            note: request.body.statusNote || null,
            changedBy: request.body.changedBy || null,
          },
        });
      }

      if (enteringCompleted || leavingCompleted) {
        const orderProducts = await tx.customer_order_product.findMany({
          where: { customerOrderId: existingOrder.id },
        });

        for (const orderProduct of orderProducts) {
          const product = await tx.product.findUnique({
            where: { id: orderProduct.productId },
          });

          if (!product) {
            continue;
          }

          const quantityChange = enteringCompleted
            ? -orderProduct.quantity
            : orderProduct.quantity;
          const newStock = product.inStock + quantityChange;

          if (newStock < 0) {
            const stockError = new Error(
              `Not enough stock to complete order for ${product.title}`
            );
            stockError.statusCode = 409;
            throw stockError;
          }

          await tx.product.update({
            where: { id: product.id },
            data: { inStock: newStock },
          });

          await tx.productStockHistory.create({
            data: {
              productId: product.id,
              customerOrderId: existingOrder.id,
              orderProductId: orderProduct.id,
              previousStock: product.inStock,
              quantityChange,
              newStock,
              reason: enteringCompleted
                ? `Order entered completed group via ${validatedData.status}`
                : `Order left completed group via ${validatedData.status}`,
            },
          });
        }
      }

      return orderUpdate;
    });

    // Create notification for status update if status changed
    if (existingOrder.status !== validatedData.status) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: validatedData.email }
        });
        
        if (user) {
          await createOrderUpdateNotification(
            user.id,
            validatedData.status,
            updatedOrder.id,
            validatedData.total,
            updatedOrder.orderNumber
          );
          console.log(`📧 Status update notification sent to user: ${user.email} - Status: ${validatedData.status}`);
        }
      } catch (notificationError) {
        console.error('❌ Failed to create status update notification:', notificationError);
      }
    }

    console.log(`Order updated successfully: ID ${updatedOrder.id}`);

    const [statusHistory, stockHistory] = await Promise.all([
      prisma.orderStatusHistory.findMany({
        where: { customerOrderId: updatedOrder.id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.productStockHistory.findMany({
        where: { customerOrderId: updatedOrder.id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return response.status(200).json({
      ...updatedOrder,
      statusHistory,
      stockHistory,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    
    if (error.statusCode) {
      return response.status(error.statusCode).json({
        error: "Order update failed",
        details: error.message,
      });
    }
    
    if (error.code === 'P2025') {
      return response.status(404).json({ 
        error: "Order not found",
        details: "The specified order does not exist"
      });
    }

    if (error instanceof ValidationError) {
      return response.status(400).json({
        error: "Validation failed",
        details: [{ field: error.field, message: error.message }]
      });
    }

    return response.status(500).json({ 
      error: "Internal server error",
      details: "Failed to update order. Please try again later."
    });
  }
}

async function deleteCustomerOrder(request, response) {
  try {
    const { id } = request.params;
    
    if (!id || typeof id !== 'string') {
      return response.status(400).json({
        error: "Invalid order ID",
        details: "Order ID must be provided"
      });
    }

    const existingOrder = await prisma.customer_order.findUnique({
      where: { id: id },
    });

    if (!existingOrder) {
      return response.status(404).json({ 
        error: "Order not found",
        details: "The specified order does not exist"
      });
    }

    await prisma.customer_order.delete({
      where: {
        id: id,
      },
    });

    console.log(`Order deleted successfully: ID ${id}`);
    return response.status(204).send();
  } catch (error) {
    console.error("Error deleting order:", error);
    
    if (error.code === 'P2025') {
      return response.status(404).json({ 
        error: "Order not found",
        details: "The specified order does not exist"
      });
    }

    return response.status(500).json({ 
      error: "Internal server error",
      details: "Failed to delete order. Please try again later."
    });
  }
}

async function getCustomerOrder(request, response) {
  try {
    const { id } = request.params;
    
    if (!id || typeof id !== 'string') {
      return response.status(400).json({
        error: "Invalid order ID",
        details: "Order ID must be provided"
      });
    }

    const [order, statusHistory, stockHistory] = await Promise.all([
      prisma.customer_order.findUnique({
        where: {
          id: id,
        },
      }),
      prisma.orderStatusHistory.findMany({
        where: { customerOrderId: id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.productStockHistory.findMany({
        where: { customerOrderId: id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    
    if (!order) {
      return response.status(404).json({ 
        error: "Order not found",
        details: "The specified order does not exist"
      });
    }
    
    return response.status(200).json({
      ...order,
      statusHistory,
      stockHistory,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return response.status(500).json({ 
      error: "Internal server error",
      details: "Failed to fetch order. Please try again later."
    });
  }
}

async function getAllOrders(request, response) {
  try {
    await ensureDefaultOrderStatuses(prisma);
    const page = parsePositiveInteger(request.query.page, 1);
    const limit = parsePositiveInteger(request.query.limit, 100);
    const offset = (page - 1) * limit;

    const search = typeof request.query.search === "string" ? request.query.search.trim() : "";
    const status = typeof request.query.status === "string" ? normalizeStatusCode(request.query.status.trim()) : "";
    const statusGroup = typeof request.query.statusGroup === "string" ? request.query.statusGroup.trim() : "";
    const minTotal = parseOptionalNumber(request.query.minTotal);
    const maxTotal = parseOptionalNumber(request.query.maxTotal);
    const dateFrom = parseOptionalDate(request.query.dateFrom);
    const dateTo = parseOptionalDate(request.query.dateTo, { endOfDay: true });
    const sortBy = typeof request.query.sortBy === "string" ? request.query.sortBy.trim() : "date";
    const sortDirection = request.query.sortDirection === "asc" ? "asc" : "desc";

    let statusCodesForGroup = [];

    if (statusGroup) {
      const statusesInGroup = await prisma.orderStatus.findMany({
        where: {
          groupCode: statusGroup,
          isActive: true,
        },
        select: {
          code: true,
        },
      });

      statusCodesForGroup = statusesInGroup.map((item) => item.code);
    }

    const whereClause = {};
    const searchConditions = buildOrderSearchConditions(search);

    if (searchConditions.length > 0) {
      whereClause.OR = searchConditions;
    }

    if (status) {
      whereClause.status = status;
    } else if (statusGroup) {
      whereClause.status = {
        in: statusCodesForGroup,
      };
    }

    if (minTotal !== undefined || maxTotal !== undefined) {
      whereClause.total = {};

      if (minTotal !== undefined) {
        whereClause.total.gte = minTotal;
      }

      if (maxTotal !== undefined) {
        whereClause.total.lte = maxTotal;
      }
    }

    if (dateFrom || dateTo) {
      whereClause.dateTime = {};

      if (dateFrom) {
        whereClause.dateTime.gte = dateFrom;
      }

      if (dateTo) {
        whereClause.dateTime.lte = dateTo;
      }
    }

    if (statusGroup && statusCodesForGroup.length === 0) {
      return response.json({
        orders: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    const [orders, totalCount] = await Promise.all([
      prisma.customer_order.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        orderBy: getOrderSort(sortBy, sortDirection),
      }),
      prisma.customer_order.count({
        where: whereClause,
      })
    ]);

    const orderIds = orders.map((order) => order.id);
    const history = orderIds.length
      ? await prisma.orderStatusHistory.findMany({
          where: {
            customerOrderId: {
              in: orderIds,
            },
          },
          select: {
            customerOrderId: true,
            newStatus: true,
          },
        })
      : [];

    const historyCountsByOrderId = history.reduce((accumulator, item) => {
      const currentCounts = accumulator[item.customerOrderId] || {
        failedHistoryCount: 0,
        cancelledHistoryCount: 0,
      };

      if (item.newStatus === "failed") {
        currentCounts.failedHistoryCount += 1;
      }

      if (item.newStatus === "cancelled") {
        currentCounts.cancelledHistoryCount += 1;
      }

      accumulator[item.customerOrderId] = currentCounts;
      return accumulator;
    }, {});

    return response.json({
      orders: orders.map((order) => ({
        ...order,
        ...(historyCountsByOrderId[order.id] || {
          failedHistoryCount: 0,
          cancelledHistoryCount: 0,
        }),
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return response.status(500).json({ 
      error: "Internal server error",
      details: "Failed to fetch orders. Please try again later."
    });
  }
}

async function getOrderStatusHistory(request, response) {
  try {
    const history = await prisma.orderStatusHistory.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 200,
    });

    const orderIds = [...new Set(history.map((item) => item.customerOrderId))];
    const orders = await prisma.customer_order.findMany({
      where: {
        id: {
          in: orderIds,
        },
      },
      select: {
        id: true,
        orderNumber: true,
        name: true,
        lastname: true,
        email: true,
      },
    });
    const ordersById = new Map(orders.map((order) => [order.id, order]));

    return response.status(200).json(
      history.map((item) => ({
        ...item,
        order: ordersById.get(item.customerOrderId) || null,
      }))
    );
  } catch (error) {
    console.error("Error fetching order status history:", error);
    return response.status(500).json({
      error: "Internal server error",
      details: "Failed to fetch order status history."
    });
  }
}

async function getProductStockHistory(request, response) {
  try {
    const history = await prisma.productStockHistory.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 200,
    });

    const productIds = [...new Set(history.map((item) => item.productId))];
    const orderIds = history
      .map((item) => item.customerOrderId)
      .filter(Boolean);

    const [products, orders] = await Promise.all([
      prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
        },
        select: {
          id: true,
          title: true,
          mainImage: true,
          slug: true,
        },
      }),
      prisma.customer_order.findMany({
        where: {
          id: {
            in: [...new Set(orderIds)],
          },
        },
        select: {
          id: true,
          orderNumber: true,
          name: true,
          lastname: true,
        },
      }),
    ]);

    const productsById = new Map(products.map((product) => [product.id, product]));
    const ordersById = new Map(orders.map((order) => [order.id, order]));

    return response.status(200).json(
      history.map((item) => ({
        ...item,
        product: productsById.get(item.productId) || null,
        order: item.customerOrderId ? ordersById.get(item.customerOrderId) || null : null,
      }))
    );
  } catch (error) {
    console.error("Error fetching product stock history:", error);
    return response.status(500).json({
      error: "Internal server error",
      details: "Failed to fetch product stock history."
    });
  }
}

module.exports = {
  createCustomerOrder,
  updateCustomerOrder,
  deleteCustomerOrder,
  getCustomerOrder,
  getAllOrders,
  getOrderStatusHistory,
  getProductStockHistory,
};
