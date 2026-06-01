import apiClient from "./api";

const CART_SESSION_STORAGE_KEY = "gearforge-cart-session-id";

const createSessionId = () =>
  `cart_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const getCartSessionId = () => {
  if (typeof window === "undefined") {
    return "server-cart-session";
  }

  const existingId = window.localStorage.getItem(CART_SESSION_STORAGE_KEY);
  if (existingId) {
    return existingId;
  }

  const newId = createSessionId();
  window.localStorage.setItem(CART_SESSION_STORAGE_KEY, newId);
  return newId;
};

export const trackCartAdd = async ({
  productId,
  productTitle,
  quantity,
  userId,
}: {
  productId: string;
  productTitle: string;
  quantity: number;
  userId?: string;
}) => {
  try {
    await apiClient.post("/api/cart-events", {
      productId,
      productTitle,
      quantity,
      userId: userId || null,
      sessionId: getCartSessionId(),
      eventType: "ADD",
    });
  } catch (error) {
    console.error("Failed to track cart add", error);
  }
};
