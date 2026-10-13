import type { ProductInCart } from "@/app/_zustand/store";

export const calculateCartTax = (products: ProductInCart[]) =>
  products.reduce((sum, product) => {
    const rate = Number(product.taxRate || 0);
    return sum + product.price * product.amount * (rate / 100);
  }, 0);

export const calculateCartGrandTotal = (
  products: ProductInCart[],
  subtotal: number,
  deliveryFee = 5
) => {
  const shipping = subtotal === 0 ? 0 : deliveryFee;
  return Math.round((subtotal + calculateCartTax(products) + shipping) * 100) / 100;
};
