"use client";

// *********************
// Role of the component: Product item component 
// Name of the component: ProductItem.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <ProductItem product={product} color={color} />
// Input parameters: { product: Product; color: string; }
// Output: Product item component that contains product image, title, link to the single product page, price, button...
// *********************

import Image from "next/image";
import React from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { HiOutlineShoppingBag } from "react-icons/hi2";
import { useSession } from "next-auth/react";

import { sanitize } from "@/lib/sanitize";
import type { CatalogViewMode } from "@/app/_zustand/catalogViewStore";
import { useProductStore } from "@/app/_zustand/store";
import { trackCartAdd } from "@/lib/cartTracking";

const PUBLIC_ORDER_LIMIT = 10;

const ProductItem = ({
  product,
  viewMode = "grid",
  quickAddEnabled = false,
}: {
  product: Product;
  color?: string;
  viewMode?: CatalogViewMode;
  quickAddEnabled?: boolean;
}) => {
  const { data: session } = useSession();
  const cartState = useProductStore();
  const addToCart =
    typeof cartState?.addToCart === "function" ? cartState.addToCart : () => undefined;
  const calculateTotals =
    typeof cartState?.calculateTotals === "function"
      ? cartState.calculateTotals
      : () => undefined;
  const products = Array.isArray(cartState?.products) ? cartState.products : [];
  const isListView = viewMode === "list";
  const productDescription = sanitize(product.description || "").trim();
  const displayTitle = product.title || product.model || "Product";
  const displayImage = product.mainImage || "/product_placeholder.webp";
  const cartItemId = `${product.id}::default`;

  const handleQuickAdd = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (product.inStock <= 0) {
      toast.error("This product is currently unavailable.");
      return;
    }

    const existingQuantityForProduct = products
      .filter((item) => item.id === product.id)
      .reduce((sum, item) => sum + item.amount, 0);

    if (existingQuantityForProduct + 1 > PUBLIC_ORDER_LIMIT) {
      toast.error("Maximum online order is 10. Please contact support for larger quantities.");
      return;
    }

    if (existingQuantityForProduct + 1 > product.inStock) {
      toast.error("Requested quantity is not available right now.");
      return;
    }

    addToCart({
      cartItemId,
      id: product.id.toString(),
      title: displayTitle,
      price: product.price,
      taxRate: product.taxRate || 0,
      image: displayImage,
      amount: 1,
      stock: product.inStock,
    });
    calculateTotals();
    await trackCartAdd({
      productId: product.id,
      productTitle: displayTitle,
      quantity: 1,
      userId: (session?.user as { id?: string } | undefined)?.id,
    });
    toast.success("Product added to the cart");
  };

  return (
    <div
      className={`flex h-full w-full min-w-0 rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] p-3 transition hover:-translate-y-1 hover:border-[var(--site-accent)] ${
        isListView ? "flex-row items-start gap-3 sm:items-stretch sm:gap-4" : "flex-col"
      }`}
    >
      <Link
        href={`/product/${product.slug || product.id}`}
        className={`group relative flex items-center justify-center overflow-hidden rounded-md border border-[var(--site-border)] bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--site-panel)_92%,white_8%),color-mix(in_srgb,var(--site-panel-soft)_94%,transparent)_58%,color-mix(in_srgb,var(--site-panel-soft)_86%,var(--site-text)_14%)_100%)] p-2 shadow-[inset_0_1px_0_color-mix(in_srgb,white_35%,transparent)] sm:p-3 ${
          isListView
            ? "h-24 w-24 shrink-0 self-start sm:min-h-[220px] sm:w-[260px]"
            : "aspect-[5/4]"
        }`}
      >
        {quickAddEnabled ? (
          <button
            type="button"
            onClick={handleQuickAdd}
            className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-panel)]/95 text-[var(--site-text)] shadow-sm backdrop-blur transition hover:scale-105 hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
            aria-label={`Add ${sanitize(displayTitle)} to cart`}
          >
            <HiOutlineShoppingBag className="h-5 w-5" />
          </button>
        ) : null}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,white_12%,transparent),transparent_42%,color-mix(in_srgb,var(--site-accent-soft)_18%,transparent))]" />
        <Image
          src={
            product.mainImage
              ? `/${product.mainImage}`
              : "/product_placeholder.webp"
          }
          fill
          sizes={isListView ? "(max-width: 640px) 96px, 260px" : "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"}
          className={`relative z-10 scale-[1.06] object-contain transition duration-300 group-hover:scale-[1.1] ${
            isListView ? "p-2 sm:p-4" : "p-3 sm:p-4"
          }`}
          alt={sanitize(product?.title || product.model) || "Product image"}
        />
      </Link>
      <div className={`flex min-w-0 flex-1 ${isListView ? "flex-col justify-between self-stretch" : "flex-col"}`}>
        <div>
          <Link
            href={`/product/${product.slug || product.id}`}
            className={`line-clamp-2 text-sm font-black uppercase text-[var(--site-text)] hover:text-[var(--site-accent)] ${
              isListView ? "text-sm sm:text-base" : "mt-3 min-h-10"
            }`}
          >
            {sanitize(product.title || product.model)}
          </Link>
          <p className={`font-black text-[var(--site-accent)] ${isListView ? "mt-2 text-base sm:mt-3 sm:text-lg" : "mt-2 text-base"}`}>
            ${product.price.toFixed(2)}
          </p>
          {isListView ? (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--site-muted)] sm:mt-3 sm:line-clamp-3 sm:text-sm sm:leading-6">
              {productDescription || "No description available for this product yet."}
            </p>
          ) : null}
        </div>

        <Link
          href={`/product/${product?.slug || product.id}`}
          className={`theme-button flex h-10 items-center justify-center rounded-md px-3 text-xs font-black uppercase shadow-sm focus:outline-none focus:ring-2 ${
            isListView ? "mt-3 w-full sm:mt-6 sm:w-fit sm:min-w-[180px]" : "mt-3 w-full"
          }`}
        >
          <p>View product</p>
        </Link>
      </div>
    </div>
  );
};

export default ProductItem;
