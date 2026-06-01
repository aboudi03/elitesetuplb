const prisma = require("../utills/db");
const { asyncHandler } = require("../utills/errorHandler");
const { ensureDefaultOrderStatuses } = require("../utills/orderStatus");

const getOrderStatuses = asyncHandler(async (req, res) => {
  await ensureDefaultOrderStatuses(prisma);

  const [groups, statuses] = await Promise.all([
    prisma.orderStatusGroup.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.orderStatus.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  return res.status(200).json({ groups, statuses });
});

module.exports = {
  getOrderStatuses,
};
