"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Heading from "./Heading";
import ProductItem from "./ProductItem";
import { sanitize } from "@/lib/sanitize";

type FeaturedBrandShowcaseItem = {
  id: string;
  title: string;
  logo: string;
  products: Array<{
    id: string;
    sortOrder: number;
    productId: string;
    product: Product;
  }>;
};

export default function FeaturedBrandShowcase({
  brands,
}: {
  brands: FeaturedBrandShowcaseItem[];
}) {
  const availableBrands = useMemo(
    () => brands.filter((brand) => Array.isArray(brand.products) && brand.products.length > 0),
    [brands]
  );
  const [activeBrandId, setActiveBrandId] = useState(availableBrands[0]?.id || "");

  useEffect(() => {
    if (!availableBrands.some((brand) => brand.id === activeBrandId)) {
      setActiveBrandId(availableBrands[0]?.id || "");
    }
  }, [activeBrandId, availableBrands]);

  const activeBrand =
    availableBrands.find((brand) => brand.id === activeBrandId) || availableBrands[0];

  if (!activeBrand) {
    return null;
  }

  return (
    <section className="bg-[var(--site-bg)] px-4 pb-20 pt-2 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-screen-2xl">
        <div className="rounded-[2rem] border border-[var(--site-border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--site-panel)_88%,white_12%),color-mix(in_srgb,var(--site-panel-soft)_90%,var(--site-accent-soft)_10%))] p-5 shadow-[0_24px_90px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-[var(--site-accent)]">
                Brand Picks
              </p>
              <Heading title="Shop by featured brand" />
            </div>
            <p className="max-w-xl text-sm leading-6 text-[var(--site-muted)]">
              Tap a supplier or brand below to jump into a hand-picked set of featured products.
            </p>
          </div>

          <div className="mb-8 flex gap-3 overflow-x-auto pb-2">
            {availableBrands.map((brand) => {
              const isActive = brand.id === activeBrand.id;

              return (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() => setActiveBrandId(brand.id)}
                  className={`group min-w-[146px] rounded-[1.5rem] border px-4 py-4 text-left transition ${
                    isActive
                      ? "border-[var(--site-accent)] bg-[var(--site-panel)] shadow-lg"
                      : "border-[var(--site-border)] bg-[var(--site-panel)]/80 hover:border-[var(--site-accent)] hover:bg-[var(--site-panel)]"
                  }`}
                >
                  <div className="flex h-14 items-center justify-center rounded-2xl bg-white/90 p-3">
                    <Image
                      src={`/${brand.logo}`}
                      alt={sanitize(brand.title) || "Brand logo"}
                      width={120}
                      height={56}
                      className="h-10 w-auto object-contain"
                    />
                  </div>
                  <p
                    className={`mt-3 text-sm font-black uppercase tracking-[0.14em] ${
                      isActive ? "text-[var(--site-accent)]" : "text-[var(--site-text)]"
                    }`}
                  >
                    {sanitize(brand.title)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--site-muted)]">
                    {brand.products.length} featured products
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mb-5 flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--site-muted)]">
                Active brand
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-[var(--site-text)]">
                {sanitize(activeBrand.title)}
              </h3>
            </div>
            <div className="rounded-full border border-[var(--site-border)] bg-[var(--site-panel)] px-4 py-2 text-sm font-semibold text-[var(--site-muted)]">
              Curated set of {activeBrand.products.length}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {activeBrand.products.map((item) => (
              <ProductItem
                key={item.product.id}
                product={item.product}
                color="theme"
                quickAddEnabled
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
