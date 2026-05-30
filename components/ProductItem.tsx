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
    <div className="flex h-full w-full min-w-0 flex-col rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] p-4 transition hover:-translate-y-1 hover:border-[var(--site-accent)]">
      <Link href={`/product/${product.slug}`} className="flex aspect-square items-center justify-center rounded-md bg-[var(--site-panel-soft)] p-4">
        <Image
          src={
            product.mainImage
              ? `/${product.mainImage}`
              : "/product_placeholder.jpg"
          }
          width="0"
          height="0"
          sizes="100vw"
          className="h-full max-h-[260px] w-auto object-contain"
          alt={sanitize(product?.title) || "Product image"}
        />
      </Link>
      <Link
        href={`/product/${product.slug}`}
        className="mt-4 line-clamp-2 min-h-14 text-base font-black uppercase text-[var(--site-text)] hover:text-[var(--site-accent)]"
      >
        {sanitize(product.title)}
      </Link>
      <p className="mt-2 text-lg font-black text-[var(--site-accent)]">
        ${product.price}
      </p>

  
      <Link
        href={`/product/${product?.slug}`}
        className="theme-button mt-4 flex h-11 w-full items-center justify-center rounded-md px-4 text-sm font-black uppercase shadow-sm focus:outline-none focus:ring-2"
      >
        <p>View product</p>
      </Link>
    </div>
  );
};

export default ProductItem;
