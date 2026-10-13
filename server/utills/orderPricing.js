const { AppError } = require("./errorHandler");

const MAX_ORDER_LINES = 50;
const MAX_LINE_QUANTITY = 100;

const roundMoney = (value) => Math.round(value * 100) / 100;

// What a product sells for right now: the sale price when one is set and lower
// than the regular price, otherwise the regular price.
function getCurrentProductPrice(product) {
  const regularPrice = Number(product.price || 0);
  const salePrice = Number(product.salePrice);

  return Number.isFinite(salePrice) && salePrice > 0 && salePrice < regularPrice
    ? salePrice
    : regularPrice;
}

function normalizeOptionalText(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeOrderItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new AppError("Your order has no items", 400);
  }

  if (rawItems.length > MAX_ORDER_LINES) {
    throw new AppError("Too many items in one order", 400);
  }

  return rawItems.map((item) => {
    const productId = typeof item?.productId === "string" ? item.productId.trim() : "";
    const quantity = Number(item?.quantity);

    if (!productId) {
      throw new AppError("Every order item needs a product", 400);
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_LINE_QUANTITY) {
      throw new AppError("Every order item needs a valid quantity", 400);
    }

    return {
      productId,
      quantity,
      dealId: normalizeOptionalText(item.dealId),
      selectedColor: normalizeOptionalText(item.selectedColor),
      selectedSize: normalizeOptionalText(item.selectedSize),
    };
  });
}

function isDealLive(deal, now) {
  if (!deal?.isActive) return false;
  if (deal.startsAt && new Date(deal.startsAt) > now) return false;
  if (deal.endsAt && new Date(deal.endsAt) < now) return false;
  return true;
}

// Prices an order from the database instead of trusting the browser.
// Bundle items must arrive complete: every product of the deal, each with the
// same quantity (the number of bundles), and nothing else under that deal.
async function priceOrderItems(db, rawItems) {
  const items = normalizeOrderItems(rawItems);
  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = await db.product.findMany({ where: { id: { in: productIds } } });
  const productsById = new Map(products.map((product) => [product.id, product]));

  for (const productId of productIds) {
    const product = productsById.get(productId);
    if (!product) {
      throw new AppError("One of the products in your cart no longer exists", 400);
    }
    if (!product.isActive) {
      throw new AppError(`${product.title} is currently unavailable`, 400);
    }
  }

  let total = 0;
  const itemsByDeal = new Map();

  for (const item of items) {
    if (item.dealId) {
      itemsByDeal.set(item.dealId, [...(itemsByDeal.get(item.dealId) || []), item]);
    } else {
      total += getCurrentProductPrice(productsById.get(item.productId)) * item.quantity;
    }
  }

  const now = new Date();
  for (const [dealId, dealItems] of itemsByDeal) {
    const deal = await db.deal.findUnique({
      where: { id: dealId },
      include: { products: { select: { productId: true } } },
    });

    if (!isDealLive(deal, now)) {
      throw new AppError("A bundle in your cart is no longer available", 400);
    }

    const dealProductIds = deal.products.map((entry) => entry.productId).sort();
    const orderedProductIds = dealItems.map((item) => item.productId).sort();
    const bundleCount = dealItems[0].quantity;
    const isComplete =
      dealProductIds.length === orderedProductIds.length &&
      dealProductIds.every((productId, index) => productId === orderedProductIds[index]) &&
      dealItems.every((item) => item.quantity === bundleCount);

    if (!isComplete) {
      throw new AppError(
        `"${deal.title}" must be ordered as a complete bundle. Remove the bundle and add it again.`,
        400
      );
    }

    total += Number(deal.specialPrice) * bundleCount;
  }

  return { items, total: roundMoney(total) };
}

async function getPreparationStatusCodes(db) {
  const statuses = await db.orderStatus.findMany({
    where: { groupCode: "preparation", isActive: true },
    select: { code: true },
  });

  return statuses.map((status) => status.code);
}

// Stock is only deducted when an order completes, so units in orders still being
// prepared count as reserved.
async function assertStockAvailable(db, items) {
  const requestedByProduct = new Map();
  for (const item of items) {
    requestedByProduct.set(
      item.productId,
      (requestedByProduct.get(item.productId) || 0) + item.quantity
    );
  }

  const reservingStatuses = await getPreparationStatusCodes(db);

  for (const [productId, requested] of requestedByProduct) {
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { title: true, inStock: true },
    });
    const reserved = await db.customer_order_product.aggregate({
      where: { productId, customerOrder: { status: { in: reservingStatuses } } },
      _sum: { quantity: true },
    });

    if (!product || product.inStock < (reserved._sum.quantity || 0) + requested) {
      throw new AppError(
        `Not enough stock for ${product?.title || "a product in your cart"} right now.`,
        409
      );
    }
  }
}

module.exports = {
  getCurrentProductPrice,
  priceOrderItems,
  assertStockAvailable,
};
