const prisma = require("../utills/db");
const { asyncHandler, AppError } = require("../utills/errorHandler");
const { getCurrentProductPrice } = require("../utills/orderPricing");

function normalizeText(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeBoolean(value, defaultValue = true) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["true", "1", "yes", "enabled", "active"].includes(value.toLowerCase());
  }
  return defaultValue;
}

function normalizeNumber(value, defaultValue = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function normalizeDate(value) {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function resolveUniqueSlug({ providedSlug, title, dealIdToExclude = null }) {
  const baseSlug = slugify(providedSlug || title || "deal") || "deal";
  let candidate = baseSlug;
  let suffix = 1;

  while (true) {
    const existingDeal = await prisma.deal.findFirst({
      where: {
        slug: candidate,
        ...(dealIdToExclude ? { id: { not: dealIdToExclude } } : {}),
      },
      select: { id: true },
    });

    if (!existingDeal) {
      return candidate;
    }

    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }
}

function getDealInclude() {
  return {
    products: {
      orderBy: { sortOrder: "asc" },
      include: {
        product: {
          include: {
            category: {
              select: { name: true },
            },
          },
        },
      },
    },
  };
}

// Savings are measured against what the items cost separately today.
function serializeDeal(deal) {
  const products = (deal.products || []).map((item) => item.product).filter(Boolean);
  const originalPrice = Number(
    products.reduce((sum, product) => sum + getCurrentProductPrice(product), 0).toFixed(2)
  );

  return {
    ...deal,
    products: (deal.products || []).map((item) => ({
      id: item.id,
      productId: item.productId,
      sortOrder: item.sortOrder,
      product: item.product,
    })),
    originalPrice,
    savings: Math.max(0, originalPrice - Number(deal.specialPrice || 0)),
  };
}

async function validateDealPayload(body, existingDeal = null) {
  const title = normalizeText(body.title ?? existingDeal?.title);
  if (!title) {
    throw new AppError("Deal title is required", 400);
  }

  const specialPrice = normalizeNumber(body.specialPrice ?? existingDeal?.specialPrice, 0);
  if (specialPrice <= 0) {
    throw new AppError("Special price must be greater than 0", 400);
  }

  const productIds = Array.isArray(body.productIds)
    ? body.productIds.map((value) => String(value).trim()).filter(Boolean)
    : existingDeal?.products?.map((item) => item.productId) || [];
  const uniqueProductIds = [...new Set(productIds)];

  if (uniqueProductIds.length < 2) {
    throw new AppError("Choose at least 2 products for a deal", 400);
  }

  if (uniqueProductIds.length !== productIds.length) {
    throw new AppError("A product can only be added to a deal once", 400);
  }

  const products = await prisma.product.findMany({
    where: { id: { in: uniqueProductIds } },
    select: { id: true },
  });

  if (products.length !== uniqueProductIds.length) {
    throw new AppError("One or more selected products do not exist", 400);
  }

  const startsAt = body.startsAt === undefined ? existingDeal?.startsAt || null : normalizeDate(body.startsAt);
  const endsAt = body.endsAt === undefined ? existingDeal?.endsAt || null : normalizeDate(body.endsAt);

  if (startsAt && endsAt && startsAt > endsAt) {
    throw new AppError("Deal start date must be before the end date", 400);
  }

  return {
    title,
    slug: await resolveUniqueSlug({
      providedSlug: body.slug,
      title,
      dealIdToExclude: existingDeal?.id || null,
    }),
    description: body.description === undefined ? existingDeal?.description || null : normalizeText(body.description),
    specialPrice,
    isActive:
      body.isActive === undefined
        ? existingDeal?.isActive ?? true
        : normalizeBoolean(body.isActive, true),
    startsAt,
    endsAt,
    sortOrder: Number.parseInt(String(body.sortOrder ?? existingDeal?.sortOrder ?? 0), 10) || 0,
    productIds: uniqueProductIds,
  };
}

const getAllDeals = asyncHandler(async (request, response) => {
  const mode = normalizeText(request.query.mode) || "public";
  const now = new Date();
  const where =
    mode === "admin"
      ? {}
      : {
          isActive: true,
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
            { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
          ],
          products: {
            some: {
              product: {
                isActive: true,
              },
            },
          },
        };

  const deals = await prisma.deal.findMany({
    where,
    include: getDealInclude(),
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });

  return response.json(deals.map(serializeDeal));
});

const getDealById = asyncHandler(async (request, response) => {
  const { id } = request.params;

  const deal = await prisma.deal.findUnique({
    where: { id },
    include: getDealInclude(),
  });

  if (!deal) {
    throw new AppError("Deal not found", 404);
  }

  return response.json(serializeDeal(deal));
});

const createDeal = asyncHandler(async (request, response) => {
  const dealData = await validateDealPayload(request.body || {});

  const deal = await prisma.$transaction(async (tx) =>
    tx.deal.create({
      data: {
        slug: dealData.slug,
        title: dealData.title,
        description: dealData.description,
        specialPrice: dealData.specialPrice,
        isActive: dealData.isActive,
        startsAt: dealData.startsAt,
        endsAt: dealData.endsAt,
        sortOrder: dealData.sortOrder,
        products: {
          create: dealData.productIds.map((productId, index) => ({
            productId,
            sortOrder: index + 1,
          })),
        },
      },
      include: getDealInclude(),
    })
  );

  return response.status(201).json(serializeDeal(deal));
});

const updateDeal = asyncHandler(async (request, response) => {
  const { id } = request.params;
  const existingDeal = await prisma.deal.findUnique({
    where: { id },
    include: { products: true },
  });

  if (!existingDeal) {
    throw new AppError("Deal not found", 404);
  }

  const dealData = await validateDealPayload(request.body || {}, existingDeal);

  const deal = await prisma.$transaction(async (tx) => {
    await tx.dealProduct.deleteMany({ where: { dealId: id } });

    return tx.deal.update({
      where: { id },
      data: {
        slug: dealData.slug,
        title: dealData.title,
        description: dealData.description,
        specialPrice: dealData.specialPrice,
        isActive: dealData.isActive,
        startsAt: dealData.startsAt,
        endsAt: dealData.endsAt,
        sortOrder: dealData.sortOrder,
        products: {
          create: dealData.productIds.map((productId, index) => ({
            productId,
            sortOrder: index + 1,
          })),
        },
      },
      include: getDealInclude(),
    });
  });

  return response.json(serializeDeal(deal));
});

const deleteDeal = asyncHandler(async (request, response) => {
  const { id } = request.params;

  await prisma.deal.delete({
    where: { id },
  });

  return response.status(204).send();
});

module.exports = {
  getAllDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
};
