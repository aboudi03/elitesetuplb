import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ProductInCart = {
  cartItemId: string;
  id: string;
  sku?: string;
  title: string;
  price: number;
  taxRate?: number;
  image: string;
  selectedColor?: string;
  selectedSize?: string;
  amount: number;
  stock?: number;
  // Set on items added as part of a deal. Bundle items are only sold together,
  // so they are removed and re-quantified as one unit.
  dealId?: string;
  dealTitle?: string;
};

const DEAL_CART_ITEM_PREFIX = "deal:";

export type State = {
  products: ProductInCart[];
  allQuantity: number;
  total: number;
};

export type Actions = {
  addToCart: (newProduct: ProductInCart) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartAmount: (cartItemId: string, quantity: number) => void;
  calculateTotals: () => void;
  clearCart: () => void;
};

const createNoopStorage = () => ({
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
});

export const useProductStore = create<State & Actions>()(
  persist(
    (set) => ({
      products: [],
      allQuantity: 0,
      total: 0,
      addToCart: (newProduct) => {
        set((state) => {
          const cartItem = state.products.find(
            (item) => item.cartItemId === newProduct.cartItemId
          );
          if (!cartItem) {
            return { products: [...state.products, newProduct] };
          } else {
            state.products.map((product) => {
              if (product.cartItemId === cartItem.cartItemId) {
                product.amount += newProduct.amount;
                product.sku = product.sku || newProduct.sku;
              }
            });
          }
          return { products: [...state.products] };
        });
      },
      clearCart: () => {
        set((state: any) => {
          
          return {
            products: [],
            allQuantity: 0,
            total: 0,
          };
        });
      },
      removeFromCart: (cartItemId) => {
        set((state) => {
          const removedItem = state.products.find((item) => item.cartItemId === cartItemId);
          const products = state.products.filter((product: ProductInCart) =>
            removedItem?.dealId
              ? product.dealId !== removedItem.dealId
              : product.cartItemId !== cartItemId
          );
          return { products };
        });
      },

      calculateTotals: () => {
        set((state) => {
          let amount = 0;
          let total = 0;
          state.products.forEach((item) => {
            amount += item.amount;
            total += item.amount * item.price;
          });

          return {
            products: state.products,
            allQuantity: amount,
            total: total,
          };
        });
      },
      updateCartAmount: (cartItemId, amount) => {
        set((state) => {
          const cartItem = state.products.find((item) => item.cartItemId === cartItemId);

          if (!cartItem) {
            return { products: [...state.products] };
          }

          return {
            products: state.products.map((product) =>
              (cartItem.dealId ? product.dealId === cartItem.dealId : product.cartItemId === cartItemId)
                ? { ...product, amount }
                : product
            ),
          };
        });
      },
    }),
    {
      name: "products-storage",
      version: 3,
      migrate: (persistedState: any) => {
        if (!persistedState?.products) {
          return persistedState;
        }

        const products = persistedState.products.map(
          (product: ProductInCart & { cartItemId?: string }) => {
            const cartItemId =
              product.cartItemId ||
              `${product.id}::${product.selectedColor || "default"}::${product.selectedSize || "default"}`;
            // Deal items added before bundles were tracked: recover the deal id
            // from "deal:<dealId>:<productId>".
            const legacyDealId =
              !product.dealId && cartItemId.startsWith(DEAL_CART_ITEM_PREFIX)
                ? cartItemId.split(":")[1]
                : undefined;

            return {
              ...product,
              cartItemId,
              ...(legacyDealId
                ? { dealId: legacyDealId, dealTitle: product.title.split(" - ")[0] }
                : {}),
            };
          }
        );

        return { ...persistedState, products };
      },
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : createNoopStorage()
      ),
    }
  )
);
