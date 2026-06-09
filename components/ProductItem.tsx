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
import { useRouter } from "next/navigation";
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
  mobileCardLinkEnabled = false,
}: {
  product: Product;
  color?: string;
  viewMode?: CatalogViewMode;
  quickAddEnabled?: boolean;
  mobileCardLinkEnabled?: boolean;
}) => {
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
  const isListView = viewMode === "list";
  const productDescription = sanitize(product.description || "").trim();
  const displayTitle = product.title || product.model || "Product";
  const displayImage = product.mainImage || "/product_placeholder.webp";
  const cartItemId = `${product.id}::default`;
  const productHref = `/product/${product.slug || product.id}`;

  const handleCardClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!mobileCardLinkEnabled || isListView) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest("a, button, input, select, textarea")) {
      return;
    }

    if (window.matchMedia("(max-width: 639px)").matches) {
      router.push(productHref);
    }
  };

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
      onClick={handleCardClick}
      className={`group/card flex h-full w-full min-w-0 overflow-hidden rounded-[1.6rem] text-left transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:scale-[1.02] ${
        isListView ? "flex-row items-start gap-3 p-3 sm:items-stretch sm:gap-4 sm:p-4" : "flex-col"
      } ${mobileCardLinkEnabled && !isListView ? "cursor-pointer sm:cursor-default" : ""}`}
    >
      <Link
        href={productHref}
        className={`group/media relative flex items-center justify-center overflow-hidden ${
          isListView
            ? "h-24 w-24 shrink-0 self-start sm:min-h-[220px] sm:w-[260px]"
            : "aspect-[4/3] min-h-[300px]"
        }`}
      >
        {quickAddEnabled ? (
          <button
            type="button"
            onClick={handleQuickAdd}
            className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--site-border)] bg-[color-mix(in_srgb,var(--site-panel)_92%,white_8%)] text-[var(--site-text)] shadow-[0_10px_24px_rgba(15,23,42,0.10)] backdrop-blur transition duration-300 hover:scale-110 hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
            aria-label={`Add ${sanitize(displayTitle)} to cart`}
          >
            <HiOutlineShoppingBag className="h-5 w-5" />
          </button>
        ) : null}
        <Image
          src={
            product.mainImage
              ? `/${product.mainImage}`
              : "/product_placeholder.webp"
          }
          fill
          sizes={isListView ? "(max-width: 640px) 96px, 260px" : "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"}
          className={`relative z-10 scale-[1.03] object-contain transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:scale-[1.08] group-hover/media:scale-[1.2] ${
            isListView ? "p-2 sm:p-4" : "p-0 sm:p-1"
          }`}
          alt={sanitize(product?.title || product.model) || "Product image"}
        />
      </Link>
      <div className={`flex min-w-0 flex-1 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isListView ? "flex-col justify-between self-stretch" : "relative mt-4 flex-col rounded-[1.4rem] border border-transparent bg-[linear-gradient(180deg,color-mix(in_srgb,var(--site-panel)_94%,white_6%)_0%,color-mix(in_srgb,var(--site-panel-soft)_92%,white_8%)_100%)] px-6 pb-[5.75rem] pt-6 shadow-[0_12px_32px_rgba(15,23,42,0.05)] group-hover/card:border-[rgba(225,29,46,0.34)] group-hover/card:shadow-[0_0_0_1px_rgba(225,29,46,0.22),0_18px_44px_rgba(225,29,46,0.16)]"}`}>
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-[color-mix(in_srgb,var(--site-muted)_88%,var(--site-text)_12%)]">
            {sanitize(product.manufacturer || product.category?.name || "Elite Setup")}
          </p>
          <Link
            href={productHref}
            className={`line-clamp-3 text-[var(--site-text)] transition hover:text-[var(--site-accent)] ${
              isListView ? "mt-2 text-sm font-semibold leading-5 sm:text-base sm:leading-6" : "mt-3 text-[1.06rem] font-medium leading-6 sm:text-[1.18rem]"
            }`}
          >
            {sanitize(product.title || product.model)}
          </Link>
          <p className={`font-black text-[var(--site-accent)] ${isListView ? "mt-3 text-base sm:text-lg" : "mt-4 text-[1.45rem]"}`}>
            ${product.price.toFixed(2)}
          </p>
          {!isListView ? (
            <p className="mt-1 text-sm text-[color-mix(in_srgb,var(--site-muted)_88%,var(--site-text)_12%)]">Including VAT</p>
          ) : null}
          {isListView ? (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--site-muted)] sm:mt-3 sm:line-clamp-3 sm:text-sm sm:leading-6">
              {productDescription || "No description available for this product yet."}
            </p>
          ) : null}
        </div>

        <Link
          href={productHref}
          className={`inline-flex items-center justify-center rounded-full border border-[color:rgba(15,23,42,0.12)] bg-transparent px-5 text-xs font-black uppercase tracking-[0.14em] text-[var(--site-text)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[var(--site-accent)] hover:bg-[var(--site-accent)] hover:text-white focus:outline-none focus:ring-2 ${
            isListView
              ? "mt-4 h-10 w-full sm:mt-6 sm:w-fit sm:min-w-[180px]"
              : mobileCardLinkEnabled
                ? "absolute inset-x-6 bottom-6 h-11 translate-y-0 opacity-100 sm:pointer-events-none sm:translate-y-3 sm:opacity-0 sm:group-hover/card:pointer-events-auto sm:group-hover/card:translate-y-0 sm:group-hover/card:opacity-100"
                : "pointer-events-none absolute inset-x-6 bottom-6 h-11 translate-y-3 opacity-0 group-hover/card:pointer-events-auto group-hover/card:translate-y-0 group-hover/card:opacity-100"
          }`}
        >
          <p>View product</p>
        </Link>
      </div>
    </div>
  );
};

export default ProductItem;
