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

const AddToCartSingleProductBtn = ({ product, quantityCount } : SingleProductBtnProps) => {
  const { data: session } = useSession();
  const { addToCart, calculateTotals, products } = useProductStore();

  const handleAddToCart = async () => {
    const existingQuantity = products.find((item) => item.id === product.id)?.amount || 0;
    if (existingQuantity + quantityCount > product.inStock) {
      toast.error(`Only ${product.inStock} left in stock`);
      return;
    }

    addToCart({
      id: product?.id.toString(),
      title: product?.title,
      price: product?.price,
      taxRate: product?.taxRate || 0,
      image: product?.mainImage,
      amount: quantityCount,
      stock: product?.inStock,
    });
    calculateTotals();
    await trackCartAdd({
      productId: product.id,
      productTitle: product.title,
      quantity: quantityCount,
      userId: (session?.user as { id?: string } | undefined)?.id,
    });
    toast.success("Product added to the cart");
  };
  return (
    <button
      onClick={handleAddToCart}
      className="btn w-[200px] border border-[var(--site-border)] bg-[var(--site-panel-soft)] text-lg font-bold uppercase text-[var(--site-text)] transition-all ease-in hover:scale-105 hover:border-[var(--site-accent)] hover:text-[var(--site-accent)] max-[500px]:w-full"
    >
      Add to cart
    </button>
  );
};

export default AddToCartSingleProductBtn;
