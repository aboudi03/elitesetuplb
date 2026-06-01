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

const BuyNowSingleProductBtn = ({
  product,
  quantityCount,
  selectedColor,
}: SingleProductBtnProps) => {
  const router = useRouter();
  const { data: session } = useSession();
  const { addToCart, calculateTotals, products } = useProductStore();
  const cartItemId = `${product.id}::${selectedColor || "default"}`;

  const handleAddToCart = async () => {
    const existingQuantityForProduct = products
      .filter((item) => item.id === product.id)
      .reduce((sum, item) => sum + item.amount, 0);

    if (existingQuantityForProduct + quantityCount > product.inStock) {
      toast.error(`Only ${product.inStock} left in stock`);
      return;
    }

    addToCart({
      cartItemId,
      id: product?.id.toString(),
      title: product?.title,
      price: product?.price,
      taxRate: product?.taxRate || 0,
      image: product?.mainImage,
      selectedColor,
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
    router.push("/checkout");
  };
  return (
    <button
      onClick={handleAddToCart}
      className="btn theme-button w-[200px] border-0 text-lg font-bold uppercase transition-all ease-in hover:scale-105 max-[500px]:w-full"
    >
      Buy Now
    </button>
  );
};

export default BuyNowSingleProductBtn;
