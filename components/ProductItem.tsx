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

const ProductItem = ({
  product,
}: {
  product: Product;
  color: string;
}) => {
  return (
    <div className="flex h-full w-full min-w-0 flex-col rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] p-3 transition hover:-translate-y-1 hover:border-[var(--site-accent)]">
      <Link href={`/product/${product.slug || product.id}`} className="flex aspect-square items-center justify-center rounded-md bg-[var(--site-panel-soft)] p-3">
        <Image
          src={
            product.mainImage
              ? `/${product.mainImage}`
              : "/product_placeholder.jpg"
          }
          width="0"
          height="0"
          sizes="100vw"
          className="h-full max-h-[220px] w-auto object-contain"
          alt={sanitize(product?.title || product.model) || "Product image"}
        />
      </Link>
      <Link
        href={`/product/${product.slug || product.id}`}
        className="mt-3 line-clamp-2 min-h-10 text-sm font-black uppercase text-[var(--site-text)] hover:text-[var(--site-accent)]"
      >
        {sanitize(product.title || product.model)}
      </Link>
      <p className="mt-2 text-base font-black text-[var(--site-accent)]">
        ${product.price.toFixed(2)}
      </p>

  
      <Link
        href={`/product/${product?.slug || product.id}`}
        className="theme-button mt-3 flex h-10 w-full items-center justify-center rounded-md px-3 text-xs font-black uppercase shadow-sm focus:outline-none focus:ring-2"
      >
        <p>View product</p>
      </Link>
    </div>
  );
};

export default ProductItem;
