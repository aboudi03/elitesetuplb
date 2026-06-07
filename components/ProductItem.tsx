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

import { sanitize } from "@/lib/sanitize";
import type { CatalogViewMode } from "@/app/_zustand/catalogViewStore";

const ProductItem = ({
  product,
  viewMode = "grid",
}: {
  product: Product;
  color?: string;
  viewMode?: CatalogViewMode;
}) => {
  const isListView = viewMode === "list";

  return (
    <div
      className={`flex h-full w-full min-w-0 rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] p-3 transition hover:-translate-y-1 hover:border-[var(--site-accent)] ${
        isListView ? "flex-col gap-4 sm:flex-row sm:items-stretch" : "flex-col"
      }`}
    >
      <Link
        href={`/product/${product.slug || product.id}`}
        className={`group relative flex items-center justify-center overflow-hidden rounded-md border border-[var(--site-border)] bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--site-panel)_92%,white_8%),color-mix(in_srgb,var(--site-panel-soft)_94%,transparent)_58%,color-mix(in_srgb,var(--site-panel-soft)_86%,var(--site-text)_14%)_100%)] p-2 shadow-[inset_0_1px_0_color-mix(in_srgb,white_35%,transparent)] sm:p-3 ${
          isListView
            ? "aspect-[5/4] sm:min-h-[220px] sm:w-[260px] sm:shrink-0"
            : "aspect-[5/4]"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,white_12%,transparent),transparent_42%,color-mix(in_srgb,var(--site-accent-soft)_18%,transparent))]" />
        <Image
          src={
            product.mainImage
              ? `/${product.mainImage}`
              : "/product_placeholder.jpg"
          }
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className="relative z-10 scale-[1.06] object-contain p-3 transition duration-300 group-hover:scale-[1.1] sm:p-4"
          alt={sanitize(product?.title || product.model) || "Product image"}
        />
      </Link>
      <div className={`flex min-w-0 flex-1 ${isListView ? "flex-col justify-between" : "flex-col"}`}>
        <div>
          <Link
            href={`/product/${product.slug || product.id}`}
            className={`line-clamp-2 text-sm font-black uppercase text-[var(--site-text)] hover:text-[var(--site-accent)] ${
              isListView ? "sm:text-base" : "mt-3 min-h-10"
            }`}
          >
            {sanitize(product.title || product.model)}
          </Link>
          <p className={`font-black text-[var(--site-accent)] ${isListView ? "mt-3 text-lg" : "mt-2 text-base"}`}>
            ${product.price.toFixed(2)}
          </p>
          {isListView ? (
            <p className="mt-3 text-sm leading-6 text-[var(--site-muted)]">
              Browse this product page for specs, gallery images, and checkout details.
            </p>
          ) : null}
        </div>

        <Link
          href={`/product/${product?.slug || product.id}`}
          className={`theme-button flex h-10 items-center justify-center rounded-md px-3 text-xs font-black uppercase shadow-sm focus:outline-none focus:ring-2 ${
            isListView ? "mt-4 w-full sm:mt-6 sm:w-fit sm:min-w-[180px]" : "mt-3 w-full"
          }`}
        >
          <p>View product</p>
        </Link>
      </div>
    </div>
  );
};

export default ProductItem;
