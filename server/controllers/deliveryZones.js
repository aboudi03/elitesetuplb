const prisma = require("../utills/db");
const { asyncHandler } = require("../utills/errorHandler");
const { ensureDefaultDeliveryZones } = require("../utills/deliveryZones");

const getDeliveryZones = asyncHandler(async (request, response) => {
  await ensureDefaultDeliveryZones(prisma);

  const zones = await prisma.deliveryZone.findMany({
    where: {
      isActive: true,
    },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });

  return response.status(200).json({ zones });
});

module.exports = {
  getDeliveryZones,
};
