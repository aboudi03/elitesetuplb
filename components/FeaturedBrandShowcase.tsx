"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Heading from "./Heading";
import LazyProductShelf from "./LazyProductShelf";
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
                  <div className="flex aspect-square w-16 items-center justify-center rounded-2xl bg-white/90 p-3">
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
                </button>
              );
            })}
          </div>

          <div className="mb-5 flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-start">
            <div>
              <h3 className="text-2xl font-semibold text-[var(--site-text)]">
                {sanitize(activeBrand.title)}
              </h3>
            </div>
          </div>

          <LazyProductShelf
            products={activeBrand.products.map((item) => item.product)}
            gridClassName="grid snap-x snap-mandatory grid-flow-col auto-cols-[78vw] gap-4 overflow-x-auto px-1 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid-flow-row sm:auto-cols-auto sm:overflow-visible sm:px-0 sm:pb-0 sm:snap-none sm:grid-cols-2 xl:grid-cols-5"
            itemClassName="shrink-0 snap-start"
            scrollKey={`featured-brand-${activeBrand.id}`}
          />
        </div>
      </div>
    </section>
  );
}
