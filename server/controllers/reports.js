const prisma = require("../utills/db");
const { asyncHandler } = require("../utills/errorHandler");

function parseDate(value, { endOfDay = false } = {}) {
  if (!value || typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) return undefined;

  const date = new Date(
    endOfDay ? `${normalized}T23:59:59.999Z` : `${normalized}T00:00:00.000Z`
  );

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function buildOrderWhere(query) {
  const dateFrom = parseDate(query.dateFrom);
  const dateTo = parseDate(query.dateTo, { endOfDay: true });
  const status = typeof query.status === "string" ? query.status.trim() : "";
  const where = {};

  if (dateFrom || dateTo) {
    where.dateTime = {};

    if (dateFrom) {
      where.dateTime.gte = dateFrom;
    }

    if (dateTo) {
      where.dateTime.lte = dateTo;
    }
  }

  if (status && status !== "all") {
    where.status = status;
  }

  return where;
}

function toCurrency(value) {
  return Number(Number(value || 0).toFixed(2));
}

function getDateKey(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toISOString().slice(0, 10);
}

const getSalesProfitReport = asyncHandler(async (request, response) => {
  const orderWhere = buildOrderWhere(request.query);

  const [orders, orderProducts, stockedProducts] = await Promise.all([
    prisma.customer_order.findMany({
      where: orderWhere,
      orderBy: {
        dateTime: "desc",
      },
      select: {
        id: true,
        orderNumber: true,
        dateTime: true,
        status: true,
        total: true,
        name: true,
        lastname: true,
      },
    }),
    prisma.customer_order_product.findMany({
      where: {
        customerOrder: orderWhere,
      },
      include: {
        customerOrder: {
          select: {
            id: true,
            orderNumber: true,
            dateTime: true,
            status: true,
            total: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
            model: true,
            sku: true,
            price: true,
            cost: true,
            manufacturer: true,
            categoryId: true,
            category: {
              select: {
                name: true,
              },
            },
            merchantId: true,
            merchant: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        inStock: {
          gt: 0,
        },
      },
      select: {
        id: true,
        title: true,
        model: true,
        sku: true,
        price: true,
        cost: true,
        inStock: true,
        manufacturer: true,
        categoryId: true,
        category: {
          select: {
            name: true,
          },
        },
        merchantId: true,
        merchant: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const realOrderProducts = orderProducts.filter((item) => item.product?.id);
  const realOrderIds = new Set(
    realOrderProducts
      .map((item) => item.customerOrder?.id)
      .filter(Boolean)
  );
  const realOrders = orders.filter((order) => realOrderIds.has(order.id));

  const revenue = realOrderProducts.reduce(
    (sum, item) => sum + Number(item.product?.price || 0) * Number(item.quantity || 0),
    0
  );
  const orderCount = realOrders.length;
  const itemCount = realOrderProducts.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const cogs = realOrderProducts.reduce(
    (sum, item) => sum + Number(item.product?.cost || 0) * Number(item.quantity || 0),
    0
  );
  const grossProfit = revenue - cogs;
  const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  const dailyMap = new Map();
  for (const order of realOrders) {
    const dateKey = getDateKey(order.dateTime);
    const current = dailyMap.get(dateKey) || {
      date: dateKey,
      orders: 0,
      revenue: 0,
    };

    current.orders += 1;
    dailyMap.set(dateKey, current);
  }

  const costByOrderDate = new Map();
  const revenueByOrderDate = new Map();
  for (const item of realOrderProducts) {
    const dateKey = getDateKey(item.customerOrder?.dateTime);
    const quantity = Number(item.quantity || 0);
    revenueByOrderDate.set(
      dateKey,
      (revenueByOrderDate.get(dateKey) || 0) + Number(item.product?.price || 0) * quantity
    );
    costByOrderDate.set(
      dateKey,
      (costByOrderDate.get(dateKey) || 0) +
        Number(item.product?.cost || 0) * quantity
    );
  }

  const daily = Array.from(dailyMap.values())
    .map((item) => {
      const dailyCogs = costByOrderDate.get(item.date) || 0;
      const dailyRevenue = revenueByOrderDate.get(item.date) || 0;
      return {
        ...item,
        revenue: toCurrency(dailyRevenue),
        cogs: toCurrency(dailyCogs),
        profit: toCurrency(dailyRevenue - dailyCogs),
      };
    })
    .sort((first, second) => second.date.localeCompare(first.date));

  const productMap = new Map();
  for (const item of realOrderProducts) {
    const productId = item.product.id;
    const current = productMap.get(productId) || {
      productId,
      title: item.product.title || item.product.model || "Untitled product",
      sku: item.product?.sku || "",
      manufacturer: item.product?.manufacturer || "",
      categoryId: item.product?.categoryId || "",
      categoryName: item.product?.category?.name || "Uncategorized",
      merchantId: item.product?.merchantId || "",
      merchantName: item.product?.merchant?.name || "No merchant",
      quantity: 0,
      unitCost: Number(item.product?.cost || 0),
      unitPrice: Number(item.product?.price || 0),
      estimatedRevenue: 0,
      cogs: 0,
    };

    const quantity = Number(item.quantity || 0);
    current.quantity += quantity;
    current.estimatedRevenue += Number(item.product?.price || 0) * quantity;
    current.cogs += Number(item.product?.cost || 0) * quantity;
    productMap.set(productId, current);
  }

  const products = Array.from(productMap.values())
    .map((item) => ({
      ...item,
      unitCost: toCurrency(item.unitCost),
      unitPrice: toCurrency(item.unitPrice),
      estimatedRevenue: toCurrency(item.estimatedRevenue),
      cogs: toCurrency(item.cogs),
      estimatedProfit: toCurrency(item.estimatedRevenue - item.cogs),
    }))
    .sort((first, second) => second.cogs - first.cogs);

  const expectedProducts = stockedProducts
    .map((product) => {
      const quantity = Number(product.inStock || 0);
      const unitPrice = Number(product.price || 0);
      const unitCost = Number(product.cost || 0);
      const expectedRevenue = unitPrice * quantity;
      const expectedCogs = unitCost * quantity;

      return {
        productId: product.id,
        title: product.title || product.model || "Untitled product",
        sku: product.sku || "",
        manufacturer: product.manufacturer || "",
        categoryId: product.categoryId || "",
        categoryName: product.category?.name || "Uncategorized",
        merchantId: product.merchantId || "",
        merchantName: product.merchant?.name || "No merchant",
        quantity,
        unitCost: toCurrency(unitCost),
        unitPrice: toCurrency(unitPrice),
        expectedRevenue: toCurrency(expectedRevenue),
        expectedCogs: toCurrency(expectedCogs),
        expectedProfit: toCurrency(expectedRevenue - expectedCogs),
      };
    })
    .sort((first, second) => second.expectedProfit - first.expectedProfit);

  const expectedRevenue = expectedProducts.reduce(
    (sum, product) => sum + Number(product.expectedRevenue || 0),
    0
  );
  const expectedCogs = expectedProducts.reduce(
    (sum, product) => sum + Number(product.expectedCogs || 0),
    0
  );
  const expectedProfit = expectedRevenue - expectedCogs;

  return response.status(200).json({
    summary: {
      orderCount,
      itemCount,
      revenue: toCurrency(revenue),
      cogs: toCurrency(cogs),
      grossProfit: toCurrency(grossProfit),
      margin: toCurrency(margin),
      averageOrderValue: toCurrency(orderCount > 0 ? revenue / orderCount : 0),
    },
    expected: {
      revenue: toCurrency(expectedRevenue),
      cogs: toCurrency(expectedCogs),
      profit: toCurrency(expectedProfit),
      itemCount: expectedProducts.reduce((sum, product) => sum + Number(product.quantity || 0), 0),
      products: expectedProducts,
    },
    daily,
    products,
    orders: realOrders.map((order) => ({
      ...order,
      total: toCurrency(order.total),
    })),
  });
});

module.exports = {
  getSalesProfitReport,
};
