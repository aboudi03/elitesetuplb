const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { asyncHandler, AppError } = require("../utills/errorHandler");

async function getPreparationStatusCodes(tx) {
  const statuses = await tx.orderStatus.findMany({
    where: {
      groupCode: "preparation",
      isActive: true,
    },
    select: {
      code: true,
    },
  });

  return statuses.map((status) => status.code);
}

const createOrderProduct = asyncHandler(async (request, response) => {
  const { customerOrderId, productId, quantity, selectedColor } = request.body;
  
  // Validate required fields
  if (!customerOrderId) {
    throw new AppError("Customer order ID is required", 400);
  }
  if (!productId) {
    throw new AppError("Product ID is required", 400);
  }
  if (!quantity || quantity <= 0) {
    throw new AppError("Valid quantity is required", 400);
  }

  // Verify that the customer order exists
  const existingOrder = await prisma.customer_order.findUnique({
    where: { id: customerOrderId }
  });

  if (!existingOrder) {
    throw new AppError("Customer order not found", 404);
  }

  const requestedQuantity = parseInt(quantity);

  // Stock is adjusted later when an order enters or leaves a completed status group.
  const orderProduct = await prisma.$transaction(async (tx) => {
    const existingProduct = await tx.product.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      throw new AppError("Product not found", 404);
    }

    if (!existingProduct.isActive) {
      throw new AppError(`${existingProduct.title} is currently unavailable`, 400);
    }

    const reservingStatuses = await getPreparationStatusCodes(tx);
    const existingOrderQuantity = await tx.customer_order_product.aggregate({
      where: {
        productId,
        customerOrder: {
          status: {
            in: reservingStatuses,
          },
        },
      },
      _sum: {
        quantity: true,
      },
    });

    const quantityAlreadyRequested = existingOrderQuantity._sum.quantity || 0;
    const nextRequestedTotal = quantityAlreadyRequested + requestedQuantity;

    if (existingProduct.inStock < nextRequestedTotal) {
      throw new AppError(
        "Requested quantity is not available right now.",
        409
      );
    }

    const createdOrderProduct = await tx.customer_order_product.create({
      data: {
        customerOrderId: customerOrderId,
        productId: productId,
        quantity: requestedQuantity,
        selectedColor:
          typeof selectedColor === "string" && selectedColor.trim().length > 0
            ? selectedColor.trim()
            : null,
      }
    });

    return createdOrderProduct;
  });

  return response.status(201).json(orderProduct);
});

const updateProductOrder = asyncHandler(async (request, response) => {
  const { id } = request.params;
  const { customerOrderId, productId, quantity, selectedColor } = request.body;

  if (!id) {
    throw new AppError("Order product ID is required", 400);
  }

  const existingOrder = await prisma.customer_order_product.findUnique({
    where: {
      id: id
    }
  });

  if (!existingOrder) {
    throw new AppError("Order product not found", 404);
  }

  // Validate quantity if provided
  if (quantity !== undefined && quantity <= 0) {
    throw new AppError("Quantity must be greater than 0", 400);
  }

  const updatedOrder = await prisma.$transaction(async (tx) => {
      const nextCustomerOrderId = customerOrderId || existingOrder.customerOrderId;
      const nextProductId = productId || existingOrder.productId;
      const nextQuantity = quantity !== undefined ? parseInt(quantity, 10) : existingOrder.quantity;

      const targetProduct = await tx.product.findUnique({
        where: { id: nextProductId },
      });

      if (!targetProduct) {
        throw new AppError("Product not found", 404);
      }

      if (!targetProduct.isActive) {
        throw new AppError(`${targetProduct.title} is currently unavailable`, 400);
      }

      const reservingStatuses = await getPreparationStatusCodes(tx);
      const siblingOrderQuantity = await tx.customer_order_product.aggregate({
        where: {
          productId: nextProductId,
          customerOrder: {
            status: {
              in: reservingStatuses,
            },
          },
          id: {
            not: existingOrder.id,
          },
        },
        _sum: {
          quantity: true,
        },
      });

      const quantityAlreadyRequested = siblingOrderQuantity._sum.quantity || 0;
      const nextRequestedTotal = quantityAlreadyRequested + nextQuantity;

      if (targetProduct.inStock < nextRequestedTotal) {
        throw new AppError("Requested quantity is not available right now.", 409);
      }

      return tx.customer_order_product.update({
        where: {
          id: existingOrder.id
        },
        data: {
          customerOrderId: nextCustomerOrderId,
          productId: nextProductId,
          quantity: nextQuantity,
          selectedColor:
            selectedColor === undefined
              ? existingOrder.selectedColor
              : typeof selectedColor === "string" && selectedColor.trim().length > 0
              ? selectedColor.trim()
              : null,
        }
      });
  });

  return response.json(updatedOrder);
});

const deleteProductOrder = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("Order product ID is required", 400);
  }

  const existingOrder = await prisma.customer_order_product.findUnique({
    where: { id }
  });

  if (!existingOrder) {
    throw new AppError("Order product not found", 404);
  }

  await prisma.customer_order_product.deleteMany({
    where: {
      customerOrderId: id
    }
  });
  return response.status(204).send();
});

const getProductOrder = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("Order ID is required", 400);
  }

  const order = await prisma.customer_order_product.findMany({
    where: {
      customerOrderId: id
    },
    include: {
      product: true
    }
  });
  
  if (!order || order.length === 0) {
    throw new AppError("Order not found", 404);
  }
  
  return response.status(200).json(order);
});

const getAllProductOrders = asyncHandler(async (request, response) => {
  const productOrders = await prisma.customer_order_product.findMany({
    select: {
      productId: true,
      quantity: true,
      selectedColor: true,
      customerOrder: {
        select: {
          id: true,
          name: true,
          lastname: true,
          phone: true,
          email: true,
          company: true,
          adress: true,
          apartment: true,
          postalCode: true,
          dateTime: true,
          status: true,
          total: true
        }
      }
    }
  });

  const ordersMap = new Map();

  for (const order of productOrders) {
    const { customerOrder, productId, quantity } = order;
    const { id, ...orderDetails } = customerOrder;

    const product = productId
      ? await prisma.product.findUnique({
          where: {
            id: productId
          },
          select: {
            id: true,
            title: true,
            model: true,
            mainImage: true,
            price: true,
            slug: true
          }
        })
      : null;

    const productSummary = product
      ? { ...product, title: product.title || product.model || "Deleted product" }
      : {
          id: null,
          title: "Deleted product",
          model: null,
          mainImage: null,
          price: 0,
          slug: null
        };

    if (ordersMap.has(id)) {
      ordersMap.get(id).products.push({ ...productSummary, quantity, selectedColor: order.selectedColor });
    } else {
      ordersMap.set(id, {
        customerOrderId: id,
        customerOrder: orderDetails,
        products: [{ ...productSummary, quantity, selectedColor: order.selectedColor }]
      });
    }
  }

  const groupedOrders = Array.from(ordersMap.values());

  return response.json(groupedOrders);
});

module.exports = { 
  createOrderProduct, 
  updateProductOrder, 
  deleteProductOrder, 
  getProductOrder,
  getAllProductOrders
};
