import type { ProductInCart } from "@/app/_zustand/store";

export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  item_variant?: string;
  price: number;
  quantity: number;
  google_business_vertical: "retail";
};

type ProductAnalyticsInput = Pick<
  Product,
  "id" | "title" | "model" | "price" | "manufacturer"
> & {
  quantity?: number;
  selectedColor?: string;
  selectedSize?: string;
  categoryName?: string | null;
};

type CheckoutAnalyticsPayload = {
  currency?: string;
  value: number;
  items: AnalyticsItem[];
};

type PurchaseAnalyticsPayload = CheckoutAnalyticsPayload & {
  transactionId: string;
  tax?: number;
  shipping?: number;
  metaValue?: number;
};

export const GOOGLE_ANALYTICS_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";
export const GOOGLE_ADS_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || "";
export const googleTagId = GOOGLE_ANALYTICS_ID || GOOGLE_ADS_ID;
export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "";

const GOOGLE_ADS_ADD_TO_CART_LABEL =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ADD_TO_CART_LABEL?.trim() || "";
const GOOGLE_ADS_BEGIN_CHECKOUT_LABEL =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_BEGIN_CHECKOUT_LABEL?.trim() || "";
const GOOGLE_ADS_PURCHASE_LABEL =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL?.trim() || "";

const DEFAULT_CURRENCY =
  process.env.NEXT_PUBLIC_STORE_CURRENCY?.trim().toUpperCase() || "USD";

const canTrack = () => typeof window !== "undefined" && typeof window.gtag === "function";
const canTrackMeta = () =>
  typeof window !== "undefined" && typeof window.fbq === "function";

const toMetaContents = (items: AnalyticsItem[]) =>
  items.map((item) => ({
    id: item.item_id,
    quantity: item.quantity,
    item_price: item.price,
  }));

const sendMetaEvent = (
  eventName: "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase",
  {
    currency,
    value,
    items,
  }: {
    currency: string;
    value: number;
    items: AnalyticsItem[];
  },
  eventId?: string
) => {
  if (!META_PIXEL_ID || !canTrackMeta()) {
    return;
  }

  const firstItem = items[0];
  const parameters = {
    content_ids: items.map((item) => item.item_id),
    content_name: items.length === 1 ? firstItem?.item_name : undefined,
    content_type: "product",
    contents: toMetaContents(items),
    currency,
    value,
  };

  if (eventId) {
    window.fbq!("track", eventName, parameters, { eventID: eventId });
    return;
  }

  window.fbq!("track", eventName, parameters);
};

const sendGoogleAdsConversion = ({
  label,
  value,
  currency,
  transactionId,
}: {
  label: string;
  value: number;
  currency: string;
  transactionId?: string;
}) => {
  if (!GOOGLE_ADS_ID || !label || !canTrack()) {
    return;
  }

  const payload: Record<string, string | number> = {
    send_to: `${GOOGLE_ADS_ID}/${label}`,
    value,
    currency,
  };

  if (transactionId) {
    payload.transaction_id = transactionId;
  }

  window.gtag!("event", "conversion", payload);
};

export const buildAnalyticsItem = ({
  id,
  title,
  model,
  price,
  manufacturer,
  quantity = 1,
  selectedColor,
  selectedSize,
  categoryName,
}: ProductAnalyticsInput): AnalyticsItem => {
  const variantParts = [selectedColor, selectedSize].filter(Boolean);

  return {
    item_id: id,
    item_name: title || model || "Product",
    item_brand: manufacturer || undefined,
    item_category: categoryName || undefined,
    item_variant: variantParts.length > 0 ? variantParts.join(" / ") : undefined,
    price,
    quantity,
    google_business_vertical: "retail",
  };
};

export const buildCartAnalyticsItems = (products: ProductInCart[]) =>
  products.map((product) =>
    buildAnalyticsItem({
      id: product.id,
      title: product.title,
      model: product.title,
      price: product.price,
      quantity: product.amount,
      selectedColor: product.selectedColor,
      selectedSize: product.selectedSize,
    })
  );

const sendEcommerceEvent = (
  eventName: "add_to_cart" | "begin_checkout" | "purchase",
  payload: Record<string, unknown>
) => {
  if (!canTrack()) {
    return;
  }

  window.gtag!("event", eventName, payload);
};

export const trackAddToCartEvent = ({
  currency = DEFAULT_CURRENCY,
  value,
  item,
}: {
  currency?: string;
  value: number;
  item: AnalyticsItem;
}) => {
  trackAddToCartItemsEvent({
    currency,
    value,
    items: [item],
  });
};

export const trackAddToCartItemsEvent = ({
  currency = DEFAULT_CURRENCY,
  value,
  items,
}: CheckoutAnalyticsPayload) => {
  sendEcommerceEvent("add_to_cart", {
    currency,
    value,
    items,
  });

  sendGoogleAdsConversion({
    label: GOOGLE_ADS_ADD_TO_CART_LABEL,
    value,
    currency,
  });

  sendMetaEvent("AddToCart", { currency, value, items });
};

export const trackBeginCheckoutEvent = ({
  currency = DEFAULT_CURRENCY,
  value,
  items,
}: CheckoutAnalyticsPayload) => {
  sendEcommerceEvent("begin_checkout", {
    currency,
    value,
    items,
  });

  sendGoogleAdsConversion({
    label: GOOGLE_ADS_BEGIN_CHECKOUT_LABEL,
    value,
    currency,
  });

  sendMetaEvent("InitiateCheckout", { currency, value, items });
};

export const trackPurchaseEvent = ({
  currency = DEFAULT_CURRENCY,
  transactionId,
  value,
  tax,
  shipping,
  metaValue,
  items,
}: PurchaseAnalyticsPayload) => {
  const metaEventId = `purchase_${transactionId}`;

  sendEcommerceEvent("purchase", {
    transaction_id: transactionId,
    value,
    tax,
    shipping,
    currency,
    items,
  });

  sendGoogleAdsConversion({
    label: GOOGLE_ADS_PURCHASE_LABEL,
    value,
    currency,
    transactionId,
  });

  sendMetaEvent(
    "Purchase",
    { currency, value: metaValue ?? value, items },
    metaEventId
  );

  return metaEventId;
};

export const trackViewContentEvent = ({
  currency = DEFAULT_CURRENCY,
  value,
  item,
}: {
  currency?: string;
  value: number;
  item: AnalyticsItem;
}) => {
  sendMetaEvent("ViewContent", {
    currency,
    value,
    items: [item],
  });
};

const getCookie = (name: string) => {
  if (typeof document === "undefined") {
    return undefined;
  }

  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : undefined;
};

export const sendMetaPurchaseServerEvent = async ({
  orderId,
  eventId,
  currency = DEFAULT_CURRENCY,
  value,
  items,
}: {
  orderId: string;
  eventId: string;
  currency?: string;
  value: number;
  items: AnalyticsItem[];
}) => {
  if (!META_PIXEL_ID || typeof window === "undefined") {
    return;
  }

  try {
    const response = await fetch("/api/meta-conversions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId,
        eventId,
        currency,
        value,
        contents: toMetaContents(items),
        fbp: getCookie("_fbp"),
        fbc: getCookie("_fbc"),
        eventSourceUrl: window.location.href,
      }),
    });

    if (!response.ok) {
      console.error("Meta Conversions API event was not accepted", response.status);
    }
  } catch (error) {
    console.error("Failed to send Meta Conversions API event", error);
  }
};
