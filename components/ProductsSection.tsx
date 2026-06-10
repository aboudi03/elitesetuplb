// *********************
// Role of the component: products section intended to be on the home page
// Name of the component: ProductsSection.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <ProductsSection slug={slug} />
// Input parameters: no input parameters
// Output: products grid
// *********************

import React from "react";
import Heading from "./Heading";
import FeaturedBrandShowcase from "./FeaturedBrandShowcase";
import LazyProductShelf from "./LazyProductShelf";

const ProductsSection = async ({
  products = [],
  featuredBrands = [],
}: {
  products?: Product[];
  featuredBrands?: FeaturedBrand[];
}) => {
  return (
    <>
      <section className="bg-[var(--site-bg)] px-4 pb-16 pt-4 sm:px-6 lg:px-8">
      <div className="max-w-screen-2xl mx-auto">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-sm font-bold uppercase text-[var(--site-accent)]">Our picks</p>
            <Heading title="Trusted gear for your setup" />
          </div>
        </div>
        <LazyProductShelf
          products={products}
          gridClassName="grid snap-x snap-mandatory grid-flow-col auto-cols-[minmax(0,86%)] gap-4 overflow-x-auto px-1 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid-flow-row sm:auto-cols-auto sm:overflow-visible sm:px-0 sm:pb-0 sm:snap-none sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
          itemClassName="shrink-0 snap-start"
        />
        {products.length === 0 ? (
          <div className="col-span-full rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] py-12 text-center text-[var(--site-muted)]">
            <p>No products available at the moment.</p>
          </div>
        ) : null}
      </div>
      </section>
      <FeaturedBrandShowcase brands={featuredBrands} />
    </>
  );
};

export default ProductsSection;
