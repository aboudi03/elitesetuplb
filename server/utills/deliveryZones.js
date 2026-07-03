const DEFAULT_DELIVERY_ZONES = [
  {
    code: "standard-lebanon",
    country: "Lebanon",
    governorate: "Lebanon",
    city: "Lebanon",
    label: "All over Lebanon",
    fee: 5,
    sortOrder: 3,
  },
  {
    code: "inside-tripoli",
    country: "Lebanon",
    governorate: "North Lebanon",
    city: "Tripoli",
    label: "Tripoli",
    fee: 3,
    sortOrder: 1,
  },
  {
    code: "akkar",
    country: "Lebanon",
    governorate: "Akkar",
    city: "Akkar",
    label: "Akkar",
    fee: 4,
    sortOrder: 2,
  },
];

async function ensureDefaultDeliveryZones(prisma) {
  const activeCodes = DEFAULT_DELIVERY_ZONES.map((zone) => zone.code);

  for (const zone of DEFAULT_DELIVERY_ZONES) {
    await prisma.deliveryZone.upsert({
      where: { code: zone.code },
      update: {
        ...zone,
        isActive: true,
      },
      create: {
        ...zone,
        isActive: true,
      },
    });
  }

  await prisma.deliveryZone.updateMany({
    where: {
      code: {
        notIn: activeCodes,
      },
    },
    data: {
      isActive: false,
    },
  });
}

module.exports = {
  DEFAULT_DELIVERY_ZONES,
  ensureDefaultDeliveryZones,
};
