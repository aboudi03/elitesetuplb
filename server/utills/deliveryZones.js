const DEFAULT_DELIVERY_ZONES = [
  {
    code: "standard-lebanon",
    country: "Lebanon",
    governorate: "Lebanon",
    city: "Lebanon",
    label: "Standard Lebanon",
    fee: 5,
    sortOrder: 0,
  },
  {
    code: "inside-tripoli",
    country: "Lebanon",
    governorate: "North Lebanon",
    city: "Tripoli",
    label: "Inside Tripoli",
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
  {
    code: "beirut",
    country: "Lebanon",
    governorate: "Beirut",
    city: "Beirut",
    label: "Beirut",
    fee: 5,
    sortOrder: 10,
  },
  {
    code: "mount-lebanon",
    country: "Lebanon",
    governorate: "Mount Lebanon",
    city: "Mount Lebanon",
    label: "Mount Lebanon",
    fee: 5,
    sortOrder: 20,
  },
  {
    code: "north-lebanon",
    country: "Lebanon",
    governorate: "North Lebanon",
    city: "North Lebanon",
    label: "North Lebanon outside Tripoli",
    fee: 5,
    sortOrder: 30,
  },
  {
    code: "south-lebanon",
    country: "Lebanon",
    governorate: "South Lebanon",
    city: "South Lebanon",
    label: "South Lebanon",
    fee: 5,
    sortOrder: 40,
  },
  {
    code: "nabatieh",
    country: "Lebanon",
    governorate: "Nabatieh",
    city: "Nabatieh",
    label: "Nabatieh",
    fee: 5,
    sortOrder: 50,
  },
  {
    code: "beqaa",
    country: "Lebanon",
    governorate: "Beqaa",
    city: "Beqaa",
    label: "Beqaa",
    fee: 5,
    sortOrder: 60,
  },
  {
    code: "baalbek-hermel",
    country: "Lebanon",
    governorate: "Baalbek-Hermel",
    city: "Baalbek-Hermel",
    label: "Baalbek-Hermel",
    fee: 5,
    sortOrder: 70,
  },
];

async function ensureDefaultDeliveryZones(prisma) {
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
}

module.exports = {
  DEFAULT_DELIVERY_ZONES,
  ensureDefaultDeliveryZones,
};
