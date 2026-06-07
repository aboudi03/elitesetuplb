import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ProductInCart = {
  cartItemId: string;
  id: string;
  title: string;
  price: number;
  taxRate?: number;
  image: string;
  selectedColor?: string;
  selectedSize?: string;
  amount: number;
  stock?: number;
};

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
          state.products = state.products.filter(
            (product: ProductInCart) => product.cartItemId !== cartItemId
          );
          return { products: state.products };
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
          } else {
            state.products.map((product) => {
              if (product.cartItemId === cartItem.cartItemId) {
                product.amount = amount;
              }
            });
          }

          return { products: [...state.products] };
        });
      },
    }),
    {
      name: "products-storage",
      version: 2,
      migrate: (persistedState: any) => {
        if (!persistedState?.products) {
          return persistedState;
        }

        return {
          ...persistedState,
          products: persistedState.products.map((product: ProductInCart & { cartItemId?: string }) => ({
            ...product,
            cartItemId:
              product.cartItemId ||
                `${product.id}::${product.selectedColor || "default"}::${product.selectedSize || "default"}`,
          })),
        };
      },
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : createNoopStorage()
      ),
    }
  )
);
