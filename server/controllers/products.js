const prisma = require("../utills/db"); // ✅ Use shared connection with SSL
const { asyncHandler, handleServerError, AppError } = require("../utills/errorHandler");

// Security: Define whitelists for allowed filter types and operators
const ALLOWED_FILTER_TYPES = ['price', 'rating', 'category', 'inStock', 'outOfStock'];
const ALLOWED_OPERATORS = ['gte', 'lte', 'gt', 'lt', 'equals', 'contains'];
const ALLOWED_SORT_VALUES = ['defaultSort', 'titleAsc', 'titleDesc', 'lowPrice', 'highPrice'];
const FEATURED_PRODUCTS_LIMIT = 14;
const ADMIN_PRODUCT_SORT_FIELDS = new Set([
  "updatedAt",
  "createdAt",
  "title",
  "model",
  "sku",
  "price",
  "cost",
  "inStock",
  "featuredSortOrder",
  "merchant",
  "category",
  "isActive",
  "featured",
]);

function normalizeText(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeNumber(value, defaultValue = 0) {
  if (value === undefined || value === null || value === "") return defaultValue;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function normalizeInteger(value, defaultValue = 0) {
  if (value === undefined || value === null || value === "") return defaultValue;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function resolveUniqueSlug({ providedSlug, title, model, sku, productIdToExclude = null }) {
  const baseSource =
    normalizeText(providedSlug) ||
    normalizeText(model) ||
    normalizeText(sku) ||
    normalizeText(title) ||
    "product";
  const baseSlug = slugify(baseSource) || "product";

  let candidate = baseSlug;
  let suffix = 1;

  while (true) {
    const existingProduct = await prisma.product.findFirst({
      where: {
        slug: candidate,
        ...(productIdToExclude ? { id: { not: productIdToExclude } } : {}),
      },
      select: { id: true },
    });

    if (!existingProduct) {
      return candidate;
    }

    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }
}

function normalizeBoolean(value, defaultValue = true) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.toLowerCase() === "true" || value.toLowerCase() === "enabled";
  }
  return defaultValue;
}

function normalizeNullableBooleanQuery(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalizedValue = String(value).trim().toLowerCase();

  if (["true", "1", "yes", "enabled", "featured"].includes(normalizedValue)) {
    return true;
  }

  if (["false", "0", "no", "disabled", "standard"].includes(normalizedValue)) {
    return false;
  }

  return undefined;
}

function parsePositiveInteger(value, fallback, { min = 1, max = 250 } = {}) {
  const parsedValue = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return Math.min(Math.max(parsedValue, min), max);
}

function parseOptionalNumber(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function buildAdminProductWhereClause(query) {
  const search = normalizeText(query.search);
  const categoryId = normalizeText(query.categoryId);
  const merchantId = normalizeText(query.merchantId);
  const featured = normalizeNullableBooleanQuery(query.featured);
  const isActive = normalizeNullableBooleanQuery(query.isActive);
  const minPrice = parseOptionalNumber(query.minPrice);
  const maxPrice = parseOptionalNumber(query.maxPrice);
  const stockStatus = normalizeText(query.stockStatus)?.toLowerCase();

  const whereClause = {};

  if (search) {
    whereClause.OR = [
      { title: { contains: search } },
      { model: { contains: search } },
      { sku: { contains: search } },
      { manufacturer: { contains: search } },
      { slug: { contains: search } },
      { category: { name: { contains: search } } },
      { merchant: { name: { contains: search } } },
    ];
  }

  if (categoryId) {
    whereClause.categoryId = categoryId;
  }

  if (merchantId) {
    whereClause.merchantId = merchantId;
  }

  if (featured !== undefined) {
    whereClause.featured = featured;
  }

  if (isActive !== undefined) {
    whereClause.isActive = isActive;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    whereClause.price = {};

    if (minPrice !== undefined) {
      whereClause.price.gte = minPrice;
    }

    if (maxPrice !== undefined) {
      whereClause.price.lte = maxPrice;
    }
  }

  if (stockStatus === "in") {
    whereClause.inStock = { gt: 0 };
  } else if (stockStatus === "out") {
    whereClause.inStock = { lte: 0 };
  } else if (stockStatus === "low") {
    whereClause.inStock = { gt: 0, lte: 5 };
  }

  return whereClause;
}

function getAdminProductOrderBy(sortBy, sortDirection) {
  const normalizedSortBy = ADMIN_PRODUCT_SORT_FIELDS.has(sortBy) ? sortBy : "updatedAt";
  const normalizedDirection = sortDirection === "asc" ? "asc" : "desc";

  switch (normalizedSortBy) {
    case "merchant":
      return [{ merchant: { name: normalizedDirection } }, { updatedAt: "desc" }];
    case "category":
      return [{ category: { name: normalizedDirection } }, { updatedAt: "desc" }];
    case "featuredSortOrder":
      return [
        { featured: "desc" },
        { featuredSortOrder: normalizedDirection },
        { updatedAt: "desc" },
      ];
    default:
      return [{ [normalizedSortBy]: normalizedDirection }, { updatedAt: "desc" }];
  }
}

// Security: Input validation functions
function validateFilterType(filterType) {
  return ALLOWED_FILTER_TYPES.includes(filterType);
}

function validateOperator(operator) {
  return ALLOWED_OPERATORS.includes(operator);
}

function validateSortValue(sortValue) {
  return ALLOWED_SORT_VALUES.includes(sortValue);
}

function validateAndSanitizeFilterValue(filterType, filterValue) {
  switch (filterType) {
    case 'price':
    case 'rating':
    case 'inStock':
    case 'outOfStock':
      const numValue = Number(filterValue);
      return isNaN(numValue) ? null : numValue;
    case 'category':
      return typeof filterValue === 'string' && filterValue.trim().length > 0 
        ? filterValue.trim() 
        : null;
    default:
      return null;
  }
}

async function ensureFeaturedSlotOrThrow(nextFeaturedValue, productIdToExclude = null) {
  if (!nextFeaturedValue) return;

  const featuredProductsCount = await prisma.product.count({
    where: {
      featured: true,
      ...(productIdToExclude ? { id: { not: productIdToExclude } } : {}),
    },
  });

  if (featuredProductsCount >= FEATURED_PRODUCTS_LIMIT) {
    throw new AppError(
      "Featured limit reached. Unselect one featured product to add this one.",
      400
    );
  }
}

async function getNextFeaturedSortOrder(tx) {
  const featuredProduct = await tx.product.findFirst({
    where: {
      featured: true,
    },
    orderBy: {
      featuredSortOrder: "desc",
    },
    select: {
      featuredSortOrder: true,
    },
  });

  return (featuredProduct?.featuredSortOrder || 0) + 1;
}

async function ensureFeaturedSortOrders(tx) {
  const featuredProductsWithoutOrder = await tx.product.findMany({
    where: {
      featured: true,
      featuredSortOrder: null,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
    },
  });

  if (featuredProductsWithoutOrder.length === 0) {
    return;
  }

  let nextFeaturedSortOrder = await getNextFeaturedSortOrder(tx);

  await Promise.all(
    featuredProductsWithoutOrder.map((product, index) =>
      tx.product.update({
        where: { id: product.id },
        data: {
          featuredSortOrder: nextFeaturedSortOrder + index,
        },
      })
    )
  );
}

async function compactFeaturedSortOrders(tx) {
  await ensureFeaturedSortOrders(tx);

  const featuredProducts = await tx.product.findMany({
    where: {
      featured: true,
    },
    orderBy: [
      { featuredSortOrder: "asc" },
      { updatedAt: "desc" },
    ],
    select: {
      id: true,
    },
  });

  await Promise.all(
    featuredProducts.map((product, index) =>
      tx.product.update({
        where: { id: product.id },
        data: {
          featuredSortOrder: index + 1,
        },
      })
    )
  );
}

// Security: Safe filter object builder
function buildSafeFilterObject(filterArray) {
  const filterObj = {};
  
  for (const item of filterArray) {
    // Validate filter type
    if (!validateFilterType(item.filterType)) {
      console.warn(`Invalid filter type: ${item.filterType}`);
      continue;
    }
    
    // Validate operator
    if (!validateOperator(item.filterOperator)) {
      console.warn(`Invalid operator: ${item.filterOperator}`);
      continue;
    }
    
    // Validate and sanitize filter value
    const sanitizedValue = validateAndSanitizeFilterValue(item.filterType, item.filterValue);
    if (sanitizedValue === null) {
      console.warn(`Invalid filter value for ${item.filterType}: ${item.filterValue}`);
      continue;
    }
    
    // Build safe filter object
    filterObj[item.filterType] = {
      [item.filterOperator]: sanitizedValue,
    };
  }
  
  return filterObj;
}

const getAllProducts = asyncHandler(async (request, response) => {
  const mode = request.query.mode || "";
  const featuredOnly = normalizeBoolean(request.query.featured, false);
  const includePagination = normalizeBoolean(request.query.includePagination, false);
  const pageSize = featuredOnly && !includePagination ? FEATURED_PRODUCTS_LIMIT : 12;
  
  // checking if we are on the admin products page because we don't want storefront filtering behaviour there
  if(mode === "admin"){
    await prisma.$transaction(async (tx) => {
      await ensureFeaturedSortOrders(tx);
    });

    const includeAdminPagination = normalizeBoolean(request.query.includePagination, false);
    const page = parsePositiveInteger(request.query.page, 1);
    const limit = parsePositiveInteger(request.query.limit, 100);
    const whereClause = buildAdminProductWhereClause(request.query);
    const orderBy = getAdminProductOrderBy(
      normalizeText(request.query.sortBy) || "updatedAt",
      normalizeText(request.query.sortDirection) || "desc"
    );

    const queryOptions = {
      where: whereClause,
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
      orderBy,
    };

    if (!includeAdminPagination) {
      const adminProducts = await prisma.product.findMany(queryOptions);
      return response.json(adminProducts);
    }

    const skip = (page - 1) * limit;
    const [adminProducts, totalCount] = await Promise.all([
      prisma.product.findMany({
        ...queryOptions,
        skip,
        take: limit,
      }),
      prisma.product.count({
        where: whereClause,
      }),
    ]);

    return response.json({
      products: adminProducts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } else {
    if (featuredOnly) {
      await prisma.$transaction(async (tx) => {
        await ensureFeaturedSortOrders(tx);
      });
    }

    const dividerLocation = request.url.indexOf("?");
    let filterObj = {};
    let sortObj = {};
    let sortByValue = "defaultSort";

    // getting current page with validation
    const page = Number(request.query.page);
    const validatedPage = (page && page > 0) ? page : 1;

    if (dividerLocation !== -1) {
      const queryArray = request.url
        .substring(dividerLocation + 1, request.url.length)
        .split("&");

      let filterType;
      let filterArray = [];

      for (let i = 0; i < queryArray.length; i++) {
        // Security: Use more robust parsing with validation
        const queryParam = queryArray[i];
        
        // Extract filter type safely
        if (queryParam.includes("filters")) {
          if (queryParam.includes("price")) {
            filterType = "price";
          } else if (queryParam.includes("rating")) {
            filterType = "rating";
          } else if (queryParam.includes("category")) {
            filterType = "category";
          } else if (queryParam.includes("inStock")) {
            filterType = "inStock";
          } else if (queryParam.includes("outOfStock")) {
            filterType = "outOfStock";
          } else {
            // Skip unknown filter types
            continue;
          }
        }

        if (queryParam.includes("sort")) {
          // Security: Validate sort value
          const extractedSortValue = queryParam.substring(queryParam.indexOf("=") + 1);
          if (validateSortValue(extractedSortValue)) {
            sortByValue = extractedSortValue;
          }
        }

        // Security: Extract filter parameters safely
        if (queryParam.includes("filters") && filterType) {
          let filterValue;
          
          // Extract filter value based on type
          if (filterType === "category") {
            filterValue = queryParam.substring(queryParam.indexOf("=") + 1);
          } else {
            const numValue = Number(queryParam.substring(queryParam.indexOf("=") + 1));
            filterValue = isNaN(numValue) ? null : numValue;
          }

          // Extract operator safely
          const operatorStart = queryParam.indexOf("$") + 1;
          const operatorEnd = queryParam.indexOf("=") - 1;
          
          if (operatorStart > 0 && operatorEnd > operatorStart) {
            const filterOperator = queryParam.substring(operatorStart, operatorEnd);
            
            // Only add to filter array if all values are valid
            if (filterValue !== null && filterOperator) {
              filterArray.push({ 
                filterType, 
                filterOperator, 
                filterValue 
              });
            }
          }
        }
      }
      
      // Security: Build filter object using safe function
      filterObj = buildSafeFilterObject(filterArray);
    }

    let whereClause = { ...filterObj, isActive: true };

    // Security: Handle category filter separately with validation
    if (filterObj.category && filterObj.category.equals) {
      delete whereClause.category;
    }

    // Security: Build sort object safely
    switch (sortByValue) {
      case "defaultSort":
        sortObj = {};
        break;
      case "titleAsc":
        sortObj = { title: "asc" };
        break;
      case "titleDesc":
        sortObj = { title: "desc" };
        break;
      case "lowPrice":
        sortObj = { price: "asc" };
        break;
      case "highPrice":
        sortObj = { price: "desc" };
        break;
      default:
        sortObj = {};
    }

    let products;
    let totalCount = 0;

    const baseWhereClause = featuredOnly
      ? { ...whereClause, featured: true }
      : whereClause;

    if (Object.keys(filterObj).length === 0) {
      const queryWhere = featuredOnly ? { isActive: true, featured: true } : { isActive: true };
      const [productRows, productCount] = await Promise.all([
        prisma.product.findMany({
          skip: (validatedPage - 1) * pageSize,
          take: pageSize,
          where: queryWhere,
          include: {
            category: {
              select: {
                name: true,
              },
            },
          },
          orderBy:
            Object.keys(sortObj).length > 0
              ? sortObj
              : featuredOnly
                ? [{ featuredSortOrder: "asc" }, { createdAt: "desc" }]
                : undefined,
        }),
        includePagination ? prisma.product.count({ where: queryWhere }) : Promise.resolve(0),
      ]);

      products = productRows;
      totalCount = productCount;
    } else {
      // Security: Handle category filter with proper validation
      if (filterObj.category && filterObj.category.equals) {
        const queryWhere = {
          ...baseWhereClause,
          category: {
            name: {
              equals: filterObj.category.equals,
            },
          },
        };

        const [productRows, productCount] = await Promise.all([
          prisma.product.findMany({
            skip: (validatedPage - 1) * pageSize,
            take: pageSize,
            include: {
              category: {
                select: {
                  name: true,
                },
              },
            },
            where: queryWhere,
            orderBy:
              Object.keys(sortObj).length > 0
                ? sortObj
                : featuredOnly
                  ? [{ featuredSortOrder: "asc" }, { createdAt: "desc" }]
                  : undefined,
          }),
          includePagination ? prisma.product.count({ where: queryWhere }) : Promise.resolve(0),
        ]);

        products = productRows;
        totalCount = productCount;
      } else {
        const [productRows, productCount] = await Promise.all([
          prisma.product.findMany({
            skip: (validatedPage - 1) * pageSize,
            take: pageSize,
            include: {
              category: {
                select: {
                  name: true,
                },
              },
            },
            where: baseWhereClause,
            orderBy:
              Object.keys(sortObj).length > 0
                ? sortObj
                : featuredOnly
                  ? [{ featuredSortOrder: "asc" }, { createdAt: "desc" }]
                  : undefined,
          }),
          includePagination ? prisma.product.count({ where: baseWhereClause }) : Promise.resolve(0),
        ]);

        products = productRows;
        totalCount = productCount;
      }
    }

    if (!includePagination) {
      return response.json(products);
    }

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return response.json({
      products,
      pagination: {
        page: Math.min(validatedPage, totalPages),
        pageSize,
        totalCount,
        totalPages,
      },
    });
  }
});

const getAllProductsOld = asyncHandler(async (request, response) => {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
    },
    include: {
      category: {
        select: {
          name: true,
        },
      },
    },
  });
  response.status(200).json(products);
});

const createProduct = asyncHandler(async (request, response) => {
  const {
    id,
    merchantId,
    slug,
    title,
    model,
    sku,
    mainImage,
    price,
    cost,
    taxRate = 0,
    description,
    manufacturer,
    colors,
    sizes,
    categoryId,
    inStock,
    isActive = true,
    featured = false,
  } = request.body;

  const normalizedModel = normalizeText(model);
  if (!normalizedModel) {
    throw new AppError("Missing required field: model", 400);
  }

  await ensureFeaturedSlotOrThrow(normalizeBoolean(featured, false));
  const resolvedSlug = await resolveUniqueSlug({
    providedSlug: slug,
    title,
    model: normalizedModel,
    sku,
  });

  const nextFeaturedValue = normalizeBoolean(featured, false);
  const product = await prisma.$transaction(async (tx) => {
    const featuredSortOrder = nextFeaturedValue
      ? await getNextFeaturedSortOrder(tx)
      : null;

    return tx.product.create({
      data: {
        ...(id ? { id } : {}),
        merchantId: normalizeText(merchantId),
        slug: resolvedSlug,
        title: normalizeText(title),
        model: normalizedModel,
        sku: normalizeText(sku),
        mainImage: normalizeText(mainImage),
        price: normalizeNumber(price, 0),
        cost: normalizeNumber(cost, 0),
        taxRate: normalizeNumber(taxRate, 0),
        rating: 5,
        description: normalizeText(description),
        manufacturer: normalizeText(manufacturer),
        colors: normalizeText(colors),
        sizes: normalizeText(sizes),
        categoryId: normalizeText(categoryId),
        inStock: Math.max(0, normalizeInteger(inStock, 0)),
        isActive: normalizeBoolean(isActive, true),
        featured: nextFeaturedValue,
        featuredSortOrder,
      },
    });
  });
  return response.status(201).json(product);
});

// Method for updating existing product
const updateProduct = asyncHandler(async (request, response) => {
  const { id } = request.params;
  const {
    merchantId,
    slug,
    title,
    model,
    sku,
    mainImage,
    price,
    cost,
    taxRate,
    rating,
    description,
    manufacturer,
    colors,
    sizes,
    categoryId,
    inStock,
    isActive,
    featured,
  } = request.body;

  // Basic validation
  if (!id) {
    throw new AppError("Product ID is required", 400);
  }

  // Finding a product by id
  const existingProduct = await prisma.product.findUnique({
    where: {
      id,
    },
  });

  if (!existingProduct) {
    throw new AppError("Product not found", 404);
  }

  const nextFeaturedValue =
    featured === undefined
      ? existingProduct.featured
      : normalizeBoolean(featured, existingProduct.featured);

  if (nextFeaturedValue && !existingProduct.featured) {
    await ensureFeaturedSlotOrThrow(true, id);
  }

  const nextModel = model === undefined ? existingProduct.model : normalizeText(model);
  if (!nextModel) {
    throw new AppError("Model is required", 400);
  }

  const nextSlug =
    slug === undefined
      ? existingProduct.slug ||
        (await resolveUniqueSlug({
          title: title === undefined ? existingProduct.title : title,
          model: nextModel,
          sku: sku === undefined ? existingProduct.sku : sku,
          productIdToExclude: id,
        }))
      : await resolveUniqueSlug({
          providedSlug: slug,
          title: title === undefined ? existingProduct.title : title,
          model: nextModel,
          sku: sku === undefined ? existingProduct.sku : sku,
          productIdToExclude: id,
        });

  // Updating found product
  const updatedProduct = await prisma.$transaction(async (tx) => {
    let featuredSortOrder = existingProduct.featuredSortOrder;

    if (nextFeaturedValue && !existingProduct.featured) {
      featuredSortOrder = await getNextFeaturedSortOrder(tx);
    }

    if (!nextFeaturedValue) {
      featuredSortOrder = null;
    }

    const nextProduct = await tx.product.update({
      where: {
        id,
      },
      data: {
        merchantId: merchantId === undefined ? existingProduct.merchantId : normalizeText(merchantId),
        title: title === undefined ? existingProduct.title : normalizeText(title),
        model: nextModel,
        sku: sku === undefined ? existingProduct.sku : normalizeText(sku),
        mainImage: mainImage === undefined ? existingProduct.mainImage : normalizeText(mainImage),
        slug: nextSlug,
        price: price === undefined ? existingProduct.price : normalizeNumber(price, existingProduct.price),
        cost: cost === undefined ? existingProduct.cost : normalizeNumber(cost, existingProduct.cost),
        taxRate: taxRate === undefined ? existingProduct.taxRate : normalizeNumber(taxRate, existingProduct.taxRate),
        rating: rating === undefined ? existingProduct.rating : normalizeInteger(rating, existingProduct.rating),
        description: description === undefined ? existingProduct.description : normalizeText(description),
        manufacturer: manufacturer === undefined ? existingProduct.manufacturer : normalizeText(manufacturer),
        colors: colors === undefined ? existingProduct.colors : normalizeText(colors),
        sizes: sizes === undefined ? existingProduct.sizes : normalizeText(sizes),
        categoryId: categoryId === undefined ? existingProduct.categoryId : normalizeText(categoryId),
        inStock: inStock === undefined ? existingProduct.inStock : Math.max(0, normalizeInteger(inStock, existingProduct.inStock)),
        isActive: isActive === undefined ? existingProduct.isActive : normalizeBoolean(isActive, existingProduct.isActive),
        featured: nextFeaturedValue,
        featuredSortOrder,
      },
    });

    if (!nextFeaturedValue && existingProduct.featured) {
      await compactFeaturedSortOrders(tx);
      return tx.product.findUnique({
        where: { id },
      });
    }

    return nextProduct;
  });

  return response.status(200).json(updatedProduct);
});

const updateFeaturedProductOrder = asyncHandler(async (request, response) => {
  const { productIds } = request.body;

  if (!Array.isArray(productIds)) {
    throw new AppError("Featured product order is required", 400);
  }

  if (productIds.length > FEATURED_PRODUCTS_LIMIT) {
    throw new AppError(`Featured products cannot exceed ${FEATURED_PRODUCTS_LIMIT}`, 400);
  }

  const uniqueIds = [...new Set(productIds.map((value) => String(value).trim()).filter(Boolean))];

  if (uniqueIds.length !== productIds.length) {
    throw new AppError("Featured product order contains duplicate entries", 400);
  }

  const featuredProducts = await prisma.product.findMany({
    where: {
      id: {
        in: uniqueIds,
      },
      featured: true,
    },
    select: {
      id: true,
    },
  });

  if (featuredProducts.length !== uniqueIds.length) {
    throw new AppError("Only featured products can be reordered", 400);
  }

  await prisma.$transaction(async (tx) => {
    await Promise.all(
      uniqueIds.map((productId, index) =>
        tx.product.update({
          where: { id: productId },
          data: {
            featuredSortOrder: index + 1,
          },
        })
      )
    );

    await tx.product.updateMany({
      where: {
        featured: true,
        id: {
          notIn: uniqueIds,
        },
      },
      data: {
        featured: false,
        featuredSortOrder: null,
      },
    });
  });

  const orderedFeaturedProducts = await prisma.product.findMany({
    where: {
      featured: true,
    },
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
    orderBy: [
      { featuredSortOrder: "asc" },
      { updatedAt: "desc" },
    ],
  });

  return response.status(200).json(orderedFeaturedProducts);
});

// Method for deleting a product
const deleteProduct = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("Product ID is required", 400);
  }

  await prisma.image.deleteMany({
    where: {
      productID: id,
    },
  });

  await prisma.product.delete({
    where: {
      id,
    },
  });
  return response.status(204).send();
});

const searchProducts = asyncHandler(async (request, response) => {
  const { query } = request.query;
  
  if (!query) {
    throw new AppError("Query parameter is required", 400);
  }

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        {
          title: {
            contains: query,
          },
        },
        {
          model: {
            contains: query,
          },
        },
        {
          sku: {
            contains: query,
          },
        },
        {
          description: {
            contains: query,
          },
        },
      ],
    },
  });

  return response.json(products);
});

const getProductById = asyncHandler(async (request, response) => {
  const { id } = request.params;
  
  if (!id) {
    throw new AppError("Product ID is required", 400);
  }

  const product = await prisma.product.findUnique({
    where: {
      id: id,
    },
    include: {
      category: true,
      merchant: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  
  return response.status(200).json(product);
});

module.exports = {
  getAllProducts,
  createProduct,
  updateProduct,
  updateFeaturedProductOrder,
  deleteProduct,
  searchProducts,
  getProductById,
};
