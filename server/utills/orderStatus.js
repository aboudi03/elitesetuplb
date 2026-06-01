const DEFAULT_STATUS_GROUPS = [
  {
    code: "preparation",
    name: "Preparation",
    description: "Orders that are new, pending, or being prepared.",
    isCompletedGroup: false,
    sortOrder: 0,
  },
  {
    code: "completed",
    name: "Completed",
    description: "Orders that should count as sold and reduce stock.",
    isCompletedGroup: true,
    sortOrder: 1,
  },
  {
    code: "failed",
    name: "Failed",
    description: "Orders that failed, were cancelled, or cannot be fulfilled.",
    isCompletedGroup: false,
    sortOrder: 2,
  },
];

const DEFAULT_STATUSES = [
  { code: "pending", name: "Pending", groupCode: "preparation", sortOrder: 0 },
  { code: "processing", name: "Processing", groupCode: "preparation", sortOrder: 1 },
  { code: "preparing", name: "Preparing", groupCode: "preparation", sortOrder: 2 },
  { code: "completed", name: "Completed", groupCode: "completed", sortOrder: 3 },
  { code: "delivered", name: "Delivered", groupCode: "completed", sortOrder: 4 },
  { code: "failed", name: "Failed", groupCode: "failed", sortOrder: 5 },
  { code: "missing", name: "Missing", groupCode: "failed", sortOrder: 6 },
  { code: "cancelled", name: "Cancelled", groupCode: "failed", sortOrder: 7 },
];

async function ensureDefaultOrderStatuses(prisma) {
  for (const group of DEFAULT_STATUS_GROUPS) {
    await prisma.orderStatusGroup.upsert({
      where: { code: group.code },
      update: group,
      create: group,
    });
  }

  for (const status of DEFAULT_STATUSES) {
    await prisma.orderStatus.upsert({
      where: { code: status.code },
      update: status,
      create: status,
    });
  }
}

async function getStatusWithGroup(prisma, statusCode) {
  await ensureDefaultOrderStatuses(prisma);

  const status = await prisma.orderStatus.findUnique({
    where: { code: statusCode },
  });

  if (!status || !status.isActive) {
    return null;
  }

  const group = await prisma.orderStatusGroup.findUnique({
    where: { code: status.groupCode },
  });

  if (!group) {
    return null;
  }

  return { status, group };
}

module.exports = {
  DEFAULT_STATUS_GROUPS,
  DEFAULT_STATUSES,
  ensureDefaultOrderStatuses,
  getStatusWithGroup,
};
