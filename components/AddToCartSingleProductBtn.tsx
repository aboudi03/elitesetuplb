// *********************
// Role of the component: Button for adding product to the cart on the single product page
// Name of the component: AddToCartSingleProductBtn.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <AddToCartSingleProductBtn product={product} quantityCount={quantityCount}  />
// Input parameters: SingleProductBtnProps interface
// Output: Button with adding to cart functionality
// *********************
"use client";



import React from "react";
import { useProductStore } from "@/app/_zustand/store";
import toast from "react-hot-toast";
import { trackCartAdd } from "@/lib/cartTracking";
import { useSession } from "next-auth/react";

const PUBLIC_ORDER_LIMIT = 10;

const AddToCartSingleProductBtn = ({
  product,
  quantityCount,
  selectedColor,
  selectedSize,
}: SingleProductBtnProps) => {
  const { data: session } = useSession();
  const cartState = useProductStore();
  const addToCart =
    typeof cartState?.addToCart === "function" ? cartState.addToCart : () => undefined;
  const calculateTotals =
    typeof cartState?.calculateTotals === "function"
      ? cartState.calculateTotals
      : () => undefined;
  const products = Array.isArray(cartState?.products) ? cartState.products : [];
  const cartItemId = `${product.id}::${selectedColor || "default"}::${selectedSize || "default"}`;
  const displayTitle = product.title || product.model || "Product";
  const displayImage = product.mainImage || "/product_placeholder.webp";

  const handleAddToCart = async () => {
    const existingQuantityForProduct = products
      .filter((item) => item.id === product.id)
      .reduce((sum, item) => sum + item.amount, 0);

    if (existingQuantityForProduct + quantityCount > PUBLIC_ORDER_LIMIT) {
      toast.error("Maximum online order is 10. Please contact support for larger quantities.");
      return;
    }

    if (existingQuantityForProduct + quantityCount > product.inStock) {
      toast.error("Requested quantity is not available right now.");
      return;
    }

    addToCart({
      cartItemId,
      id: product?.id.toString(),
      title: displayTitle,
      price: product?.price,
      taxRate: product?.taxRate || 0,
      image: displayImage,
      selectedColor,
      selectedSize,
      amount: quantityCount,
      stock: product?.inStock,
    });
    calculateTotals();
    await trackCartAdd({
      productId: product.id,
      productTitle: displayTitle,
      quantity: quantityCount,
      userId: (session?.user as { id?: string } | undefined)?.id,
    });
    toast.success("Product added to the cart");
  };
  return (
    <button
      onClick={handleAddToCart}
      className="btn h-10 min-h-10 w-40 border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 text-sm font-bold uppercase text-[var(--site-text)] transition-all ease-in hover:border-[var(--site-accent)] hover:text-[var(--site-accent)] max-[500px]:w-full"
    >
      Add to cart
    </button>
  );
};

export default AddToCartSingleProductBtn;
