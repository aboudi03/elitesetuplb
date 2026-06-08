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
import ProductItem from "./ProductItem";
import Heading from "./Heading";
import FeaturedBrandShowcase from "./FeaturedBrandShowcase";

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
            <p className="text-sm font-bold uppercase text-[var(--site-accent)]">Featured drops</p>
            <Heading title="Featured gear" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
          {products.length > 0 ? (
            products.map((product: any) => (
              <ProductItem
                key={product.id}
                product={product}
                color="theme"
                quickAddEnabled
              />
            ))
          ) : (
            <div className="col-span-full rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] py-12 text-center text-[var(--site-muted)]">
              <p>No products available at the moment.</p>
            </div>
          )}
        </div>
      </div>
      </section>
      <FeaturedBrandShowcase brands={featuredBrands} />
    </>
  );
};

export default ProductsSection;
