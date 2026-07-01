const prisma = require("../utills/db");
const { asyncHandler, AppError } = require("../utills/errorHandler");

const BANNER_SCOPES = new Set(["ALL", "PRODUCTS", "CATEGORIES"]);

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

function normalizeDate(value) {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeIds(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
}

function getBannerInclude() {
  return {
    products: {
      include: {
        product: {
          select: {
            id: true,
            title: true,
            model: true,
            mainImage: true,
          },
        },
      },
    },
    categories: {
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
  };
}

function serializeBanner(banner) {
  return {
    ...banner,
    productIds: (banner.products || []).map((item) => item.productId),
    categoryIds: (banner.categories || []).map((item) => item.categoryId),
  };
}

async function validateBannerPayload(body, existingBanner = null) {
  const title = normalizeText(body.title ?? existingBanner?.title);
  const image = normalizeText(body.image ?? existingBanner?.image);
  const requestedScope = normalizeText(body.scopeType ?? existingBanner?.scopeType) || "ALL";
  const scopeType = requestedScope.toUpperCase();
  const productIds = normalizeIds(
    body.productIds === undefined
      ? existingBanner?.products?.map((item) => item.productId) || []
      : body.productIds
  );
  const categoryIds = normalizeIds(
    body.categoryIds === undefined
      ? existingBanner?.categories?.map((item) => item.categoryId) || []
      : body.categoryIds
  );

  if (!title) {
    throw new AppError("Banner title is required", 400);
  }

  if (!image) {
    throw new AppError("Banner image is required", 400);
  }

  if (!BANNER_SCOPES.has(scopeType)) {
    throw new AppError("Invalid banner scope", 400);
  }

  if (scopeType === "PRODUCTS" && productIds.length === 0) {
    throw new AppError("Choose at least one product for this banner", 400);
  }

  if (scopeType === "CATEGORIES" && categoryIds.length === 0) {
    throw new AppError("Choose at least one category for this banner", 400);
  }

  if (productIds.length > 0) {
    const productCount = await prisma.product.count({
      where: { id: { in: productIds } },
    });

    if (productCount !== productIds.length) {
      throw new AppError("One or more selected products do not exist", 400);
    }
  }

  if (categoryIds.length > 0) {
    const categoryCount = await prisma.category.count({
      where: { id: { in: categoryIds } },
    });

    if (categoryCount !== categoryIds.length) {
      throw new AppError("One or more selected categories do not exist", 400);
    }
  }

  const startsAt = body.startsAt === undefined ? existingBanner?.startsAt || null : normalizeDate(body.startsAt);
  const endsAt = body.endsAt === undefined ? existingBanner?.endsAt || null : normalizeDate(body.endsAt);

  if (startsAt && endsAt && startsAt > endsAt) {
    throw new AppError("Banner start date must be before the end date", 400);
  }

  return {
    title,
    image,
    altText: body.altText === undefined ? existingBanner?.altText || null : normalizeText(body.altText),
    scopeType,
    isActive:
      body.isActive === undefined
        ? existingBanner?.isActive ?? true
        : normalizeBoolean(body.isActive, true),
    startsAt,
    endsAt,
    sortOrder: Number.parseInt(String(body.sortOrder ?? existingBanner?.sortOrder ?? 0), 10) || 0,
    productIds: scopeType === "PRODUCTS" ? productIds : [],
    categoryIds: scopeType === "CATEGORIES" ? categoryIds : [],
  };
}

const getAllProductBanners = asyncHandler(async (request, response) => {
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
        };

  const banners = await prisma.productBanner.findMany({
    where,
    include: getBannerInclude(),
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });

  return response.json(banners.map(serializeBanner));
});

const getProductBannerById = asyncHandler(async (request, response) => {
  const { id } = request.params;
  const banner = await prisma.productBanner.findUnique({
    where: { id },
    include: getBannerInclude(),
  });

  if (!banner) {
    throw new AppError("Banner not found", 404);
  }

  return response.json(serializeBanner(banner));
});

const createProductBanner = asyncHandler(async (request, response) => {
  const bannerData = await validateBannerPayload(request.body || {});

  const banner = await prisma.productBanner.create({
    data: {
      title: bannerData.title,
      image: bannerData.image,
      altText: bannerData.altText,
      scopeType: bannerData.scopeType,
      isActive: bannerData.isActive,
      startsAt: bannerData.startsAt,
      endsAt: bannerData.endsAt,
      sortOrder: bannerData.sortOrder,
      products: {
        create: bannerData.productIds.map((productId) => ({ productId })),
      },
      categories: {
        create: bannerData.categoryIds.map((categoryId) => ({ categoryId })),
      },
    },
    include: getBannerInclude(),
  });

  return response.status(201).json(serializeBanner(banner));
});

const updateProductBanner = asyncHandler(async (request, response) => {
  const { id } = request.params;
  const existingBanner = await prisma.productBanner.findUnique({
    where: { id },
    include: {
      products: true,
      categories: true,
    },
  });

  if (!existingBanner) {
    throw new AppError("Banner not found", 404);
  }

  const bannerData = await validateBannerPayload(request.body || {}, existingBanner);

  const banner = await prisma.$transaction(async (tx) => {
    await tx.productBannerProduct.deleteMany({ where: { bannerId: id } });
    await tx.productBannerCategory.deleteMany({ where: { bannerId: id } });

    return tx.productBanner.update({
      where: { id },
      data: {
        title: bannerData.title,
        image: bannerData.image,
        altText: bannerData.altText,
        scopeType: bannerData.scopeType,
        isActive: bannerData.isActive,
        startsAt: bannerData.startsAt,
        endsAt: bannerData.endsAt,
        sortOrder: bannerData.sortOrder,
        products: {
          create: bannerData.productIds.map((productId) => ({ productId })),
        },
        categories: {
          create: bannerData.categoryIds.map((categoryId) => ({ categoryId })),
        },
      },
      include: getBannerInclude(),
    });
  });

  return response.json(serializeBanner(banner));
});

const deleteProductBanner = asyncHandler(async (request, response) => {
  const { id } = request.params;

  await prisma.productBanner.delete({
    where: { id },
  });

  return response.status(204).send();
});

module.exports = {
  getAllProductBanners,
  getProductBannerById,
  createProductBanner,
  updateProductBanner,
  deleteProductBanner,
};
