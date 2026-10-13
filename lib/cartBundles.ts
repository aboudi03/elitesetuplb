import type { ProductInCart } from "@/app/_zustand/store";

export type CartBundleGroup = {
  type: "bundle";
  key: string;
  dealId: string;
  title: string;
  // Number of bundles; every item in a bundle shares the same amount.
  amount: number;
  // Price of one bundle (the deal price split across its items).
  unitPrice: number;
  items: ProductInCart[];
};

export type CartItemGroup = {
  type: "item";
  key: string;
  item: ProductInCart;
};

export type CartGroup = CartBundleGroup | CartItemGroup;

// Groups cart lines so bundle items render and behave as one unit, keeping the
// order in which things were added.
export function groupCartItems(products: ProductInCart[]): CartGroup[] {
  const groups: CartGroup[] = [];
  const bundlesByDeal = new Map<string, CartBundleGroup>();

  for (const product of products) {
    if (!product.dealId) {
      groups.push({ type: "item", key: product.cartItemId, item: product });
      continue;
    }

    const existing = bundlesByDeal.get(product.dealId);
    if (existing) {
      existing.items.push(product);
      existing.unitPrice += product.price;
      continue;
    }

    const bundle: CartBundleGroup = {
      type: "bundle",
      key: `deal:${product.dealId}`,
      dealId: product.dealId,
      title: product.dealTitle || "Bundle",
      amount: product.amount,
      unitPrice: product.price,
      items: [product],
    };
    bundlesByDeal.set(product.dealId, bundle);
    groups.push(bundle);
  }

  for (const bundle of bundlesByDeal.values()) {
    bundle.unitPrice = Math.round(bundle.unitPrice * 100) / 100;
  }

  return groups;
}

// The product name without the "<deal title> - " prefix deal items are stored with.
export function getBundleItemName(item: ProductInCart) {
  const prefix = item.dealTitle ? `${item.dealTitle} - ` : "";
  return prefix && item.title.startsWith(prefix) ? item.title.slice(prefix.length) : item.title;
}

// What the server needs to price and validate the order.
export function toOrderItems(products: ProductInCart[]) {
  return products.map((product) => ({
    productId: product.id,
    quantity: product.amount,
    dealId: product.dealId,
    selectedColor: product.selectedColor,
    selectedSize: product.selectedSize,
  }));
}
