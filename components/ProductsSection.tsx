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
import apiClient from "@/lib/api";
import FeaturedBrandShowcase from "./FeaturedBrandShowcase";

const ProductsSection = async () => {
  let products = [];
  let featuredBrands = [];
  
  try {
    const [productsResponse, featuredBrandsResponse] = await Promise.all([
      apiClient.get("/api/products?featured=true"),
      apiClient.get("/api/featured-brands"),
    ]);
    
    if (!productsResponse.ok) {
      console.error('Failed to fetch products:', productsResponse.statusText);
      products = [];
    } else {
      const result = await productsResponse.json();
      products = Array.isArray(result) ? result : [];
    }

    if (!featuredBrandsResponse.ok) {
      console.error("Failed to fetch featured brands:", featuredBrandsResponse.statusText);
      featuredBrands = [];
    } else {
      const result = await featuredBrandsResponse.json();
      featuredBrands = Array.isArray(result) ? result : [];
    }
  } catch (error) {
    console.error('Error fetching homepage product sections:', error);
    products = [];
    featuredBrands = [];
  }

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
