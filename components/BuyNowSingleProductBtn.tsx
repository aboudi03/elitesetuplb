// *********************
// Role of the component: Buy Now button that adds product to the cart and redirects to the checkout page
// Name of the component: BuyNowSingleProductBtn.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <BuyNowSingleProductBtn product={product} quantityCount={quantityCount} />
// Input parameters: SingleProductBtnProps interface
// Output: Button with buy now functionality
// *********************

"use client";
import { useProductStore } from "@/app/_zustand/store";
import React from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { trackCartAdd } from "@/lib/cartTracking";
import { useSession } from "next-auth/react";
import { getEffectiveProductPrice } from "@/lib/productPrice";

const PUBLIC_ORDER_LIMIT = 10;

const BuyNowSingleProductBtn = ({
  product,
  quantityCount,
  selectedColor,
  selectedSize,
}: SingleProductBtnProps) => {
  const router = useRouter();
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
  const effectivePrice = getEffectiveProductPrice(product);

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
      price: effectivePrice,
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
    router.push("/checkout");
  };
  return (
    <button
      onClick={handleAddToCart}
      className="btn theme-button h-11 min-h-11 w-full border-0 px-4 text-sm font-bold uppercase transition-all ease-in sm:w-40"
    >
      Buy Now
    </button>
  );
};

export default BuyNowSingleProductBtn;
