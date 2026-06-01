const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date) => {
  const result = startOfDay(date);
  result.setDate(result.getDate() + 1);
  return result;
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date, amount) => new Date(date.getFullYear(), date.getMonth() + amount, 1);

const getTrend = (currentValue, previousValue) => {
  if (previousValue === 0) {
    return {
      value: currentValue > 0 ? 100 : 0,
      direction: currentValue > 0 ? "up" : "neutral",
    };
  }

  const rawValue = ((currentValue - previousValue) / previousValue) * 100;
  return {
    value: Math.abs(Number(rawValue.toFixed(1))),
    direction: rawValue > 0 ? "up" : rawValue < 0 ? "down" : "neutral",
  };
};

async function getDashboardMetrics(request, response) {
  try {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const nextMonthStart = addMonths(currentMonthStart, 1);
    const previousMonthStart = addMonths(currentMonthStart, -1);
    const todayStart = startOfDay(now);
    const tomorrowStart = endOfDay(now);
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const [
      currentMonthProducts,
      previousMonthProducts,
      currentMonthUsers,
      previousMonthUsers,
      currentMonthOrders,
      previousMonthOrders,
      todayCartAdds,
      yesterdayCartAdds,
    ] = await Promise.all([
      prisma.product.count({
        where: { createdAt: { gte: currentMonthStart, lt: nextMonthStart } },
      }),
      prisma.product.count({
        where: { createdAt: { gte: previousMonthStart, lt: currentMonthStart } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: currentMonthStart, lt: nextMonthStart } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: previousMonthStart, lt: currentMonthStart } },
      }),
      prisma.customer_order.count({
        where: { dateTime: { gte: currentMonthStart, lt: nextMonthStart } },
      }),
      prisma.customer_order.count({
        where: { dateTime: { gte: previousMonthStart, lt: currentMonthStart } },
      }),
      prisma.cartEvent.aggregate({
        where: {
          eventType: "ADD",
          createdAt: { gte: todayStart, lt: tomorrowStart },
        },
        _sum: { quantity: true },
      }),
      prisma.cartEvent.aggregate({
        where: {
          eventType: "ADD",
          createdAt: { gte: yesterdayStart, lt: todayStart },
        },
        _sum: { quantity: true },
      }),
    ]);

    const todayCartAddsCount = todayCartAdds._sum.quantity || 0;
    const yesterdayCartAddsCount = yesterdayCartAdds._sum.quantity || 0;

    return response.status(200).json({
      metrics: [
        {
          key: "new-products",
          label: "New Products",
          value: currentMonthProducts,
          comparisonLabel: "vs last month",
          trend: getTrend(currentMonthProducts, previousMonthProducts),
        },
        {
          key: "new-users",
          label: "New Users",
          value: currentMonthUsers,
          comparisonLabel: "vs last month",
          trend: getTrend(currentMonthUsers, previousMonthUsers),
        },
        {
          key: "new-orders",
          label: "Orders This Month",
          value: currentMonthOrders,
          comparisonLabel: "vs last month",
          trend: getTrend(currentMonthOrders, previousMonthOrders),
        },
        {
          key: "cart-adds",
          label: "Cart Adds Today",
          value: todayCartAddsCount,
          comparisonLabel: "vs yesterday",
          trend: getTrend(todayCartAddsCount, yesterdayCartAddsCount),
        },
      ],
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return response.status(500).json({
      error: "Failed to load dashboard metrics",
    });
  }
}

module.exports = {
  getDashboardMetrics,
};
