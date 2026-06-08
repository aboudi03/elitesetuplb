const prisma = require("../utills/db");
const { asyncHandler, AppError } = require("../utills/errorHandler");

const MAX_PRODUCTS_PER_BRAND = 5;

function normalizeText(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const normalizedValue = String(value).trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizeBoolean(value, defaultValue = true) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();
    if (["true", "1", "yes", "enabled"].includes(normalizedValue)) {
      return true;
    }

    if (["false", "0", "no", "disabled"].includes(normalizedValue)) {
      return false;
    }
  }

  return defaultValue;
}

function normalizeSortOrder(value, fallback = 0) {
  const parsedValue = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function normalizeProductIds(productIds) {
  if (!Array.isArray(productIds)) {
    return [];
  }

  return productIds
    .map((productId) => normalizeText(productId))
    .filter(Boolean)
    .slice(0, MAX_PRODUCTS_PER_BRAND);
}

async function validateFeaturedProducts(productIds) {
  if (productIds.length > MAX_PRODUCTS_PER_BRAND) {
    throw new AppError(`A brand can only contain up to ${MAX_PRODUCTS_PER_BRAND} products`, 400);
  }

  const uniqueProductIds = [...new Set(productIds)];

  if (uniqueProductIds.length !== productIds.length) {
    throw new AppError("Each selected product must be unique within the brand set", 400);
  }

  if (uniqueProductIds.length === 0) {
    return [];
  }

  const featuredProducts = await prisma.product.findMany({
    where: {
      id: {
        in: uniqueProductIds,
      },
      featured: true,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (featuredProducts.length !== uniqueProductIds.length) {
    throw new AppError(
      "All assigned products must be marked as featured and enabled on the storefront",
      400
    );
  }

  return uniqueProductIds;
}

function getBrandInclude() {
  return {
    products: {
      orderBy: {
        sortOrder: "asc",
      },
      include: {
        product: {
          include: {
            category: {
              select: {
                name: true,
              },
            },
            merchant: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    },
  };
}

const getFeaturedBrands = asyncHandler(async (req, res) => {
  const mode = normalizeText(req.query.mode);

  const brands = await prisma.featuredBrand.findMany({
    where: mode === "admin" ? {} : { isActive: true },
    include: getBrandInclude(),
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const serializedBrands = brands
    .map((brand) => ({
      ...brand,
      products: brand.products
        .filter((item) => item.product && (mode === "admin" || item.product.isActive))
        .map((item) => ({
          id: item.id,
          sortOrder: item.sortOrder,
          productId: item.productId,
          product: item.product,
        })),
    }))
    .filter((brand) => mode === "admin" || brand.products.length > 0);

  return res.status(200).json(serializedBrands);
});

const createFeaturedBrand = asyncHandler(async (req, res) => {
  const title = normalizeText(req.body.title);
  const logo = normalizeText(req.body.logo);
  const isActive = normalizeBoolean(req.body.isActive, true);
  const sortOrder = normalizeSortOrder(req.body.sortOrder, 0);
  const productIds = await validateFeaturedProducts(normalizeProductIds(req.body.productIds));

  if (!title) {
    throw new AppError("Brand title is required", 400);
  }

  if (!logo) {
    throw new AppError("Brand logo is required", 400);
  }

  const createdBrand = await prisma.featuredBrand.create({
    data: {
      title,
      logo,
      isActive,
      sortOrder,
      products: {
        create: productIds.map((productId, index) => ({
          productId,
          sortOrder: index,
        })),
      },
    },
    include: getBrandInclude(),
  });

  return res.status(201).json(createdBrand);
});

const updateFeaturedBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new AppError("Featured brand ID is required", 400);
  }

  const existingBrand = await prisma.featuredBrand.findUnique({
    where: { id },
    include: {
      products: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!existingBrand) {
    throw new AppError("Featured brand not found", 404);
  }

  const title = normalizeText(req.body.title) || existingBrand.title;
  const logo = normalizeText(req.body.logo) || existingBrand.logo;
  const isActive =
    req.body.isActive === undefined
      ? existingBrand.isActive
      : normalizeBoolean(req.body.isActive, existingBrand.isActive);
  const sortOrder =
    req.body.sortOrder === undefined
      ? existingBrand.sortOrder
      : normalizeSortOrder(req.body.sortOrder, existingBrand.sortOrder);
  const productIds =
    req.body.productIds === undefined
      ? existingBrand.products.map((item) => item.productId)
      : await validateFeaturedProducts(normalizeProductIds(req.body.productIds));

  const updatedBrand = await prisma.$transaction(async (tx) => {
    await tx.featuredBrand.update({
      where: { id },
      data: {
        title,
        logo,
        isActive,
        sortOrder,
      },
    });

    await tx.featuredBrandProduct.deleteMany({
      where: {
        featuredBrandId: id,
      },
    });

    if (productIds.length > 0) {
      await tx.featuredBrandProduct.createMany({
        data: productIds.map((productId, index) => ({
          featuredBrandId: id,
          productId,
          sortOrder: index,
        })),
      });
    }

    return tx.featuredBrand.findUnique({
      where: { id },
      include: getBrandInclude(),
    });
  });

  return res.status(200).json(updatedBrand);
});

const deleteFeaturedBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new AppError("Featured brand ID is required", 400);
  }

  await prisma.featuredBrand.delete({
    where: { id },
  });

  return res.status(204).send();
});

module.exports = {
  getFeaturedBrands,
  createFeaturedBrand,
  updateFeaturedBrand,
  deleteFeaturedBrand,
};
