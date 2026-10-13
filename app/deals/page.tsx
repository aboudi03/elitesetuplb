"use client";

import { useProductStore } from "@/app/_zustand/store";
import apiClient from "@/lib/api";
import { getEffectiveProductPrice } from "@/lib/productPrice";
import { sanitize } from "@/lib/sanitize";
import {
  buildAnalyticsItem,
  trackAddToCartItemsEvent,
} from "@/lib/analytics";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { HiOutlineShoppingBag } from "react-icons/hi2";

function getProductTitle(product: Product) {
  return product.title || product.model || "Product";
}

function getProductImage(product: Product) {
  return product.mainImage || "product_placeholder.webp";
}

function isProduct(product: Product | null | undefined): product is Product {
  return Boolean(product);
}

function allocateDealPrices(products: Product[], specialPrice: number) {
  const originalTotal = products.reduce((sum, product) => sum + Number(product.price || 0), 0);

  if (products.length === 0) return [];

  if (originalTotal <= 0) {
    const equalShare = Number((specialPrice / products.length).toFixed(2));
    return products.map((_product, index) =>
      index === products.length - 1
        ? Number((specialPrice - equalShare * (products.length - 1)).toFixed(2))
        : equalShare
    );
  }

  let runningTotal = 0;
  return products.map((product, index) => {
    if (index === products.length - 1) {
      return Number((specialPrice - runningTotal).toFixed(2));
    }

    const allocatedPrice = Number(((product.price / originalTotal) * specialPrice).toFixed(2));
    runningTotal += allocatedPrice;
    return allocatedPrice;
  });
}

const SLIDE_INTERVAL_MS = 3500;

function getProductHref(product: Product) {
  return `/product/${encodeURIComponent(product.slug || product.id)}`;
}

function getProductImageSrc(product: Product) {
  return product.mainImage ? `/${product.mainImage}` : "/product_placeholder.webp";
}

function DealSlideshow({ products, savings }: { products: Product[]; savings: number }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isPaused || prefersReducedMotion || products.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % products.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [isPaused, products.length]);

  const activeProduct = products[activeIndex];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {/* Product photos have white backgrounds, so the stage stays white in every theme */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] border border-[var(--site-border)] bg-[#fff]">

        {products.map((product, index) => (
          <Link
            key={product.id}
            href={getProductHref(product)}
            aria-hidden={index !== activeIndex}
            tabIndex={index === activeIndex ? 0 : -1}
            className={`absolute inset-0 transition-all duration-700 ease-out ${
              index === activeIndex
                ? "scale-100 opacity-100"
                : "pointer-events-none scale-95 opacity-0"
            }`}
          >
            <Image
              src={getProductImageSrc(product)}
              alt={sanitize(getProductTitle(product))}
              fill
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="object-contain p-8 pb-16 sm:p-10 sm:pb-16"
              priority={index === 0}
            />
          </Link>
        ))}

        {savings > 0 ? (
          <span className="absolute left-4 top-4 rounded-full bg-[var(--site-accent)] px-4 py-1.5 text-sm font-black uppercase tracking-wide text-white shadow-lg">
            Save ${savings.toFixed(2)}
          </span>
        ) : null}

        <span className="absolute right-4 top-4 rounded-full bg-black/75 px-3 py-1 text-xs font-bold text-white backdrop-blur">
          {activeIndex + 1} / {products.length}
        </span>

        {activeProduct ? (
          <p className="absolute inset-x-4 bottom-4 truncate rounded-xl bg-white/85 px-3 py-2 text-center text-sm font-bold text-neutral-900 shadow-sm backdrop-blur">
            {sanitize(getProductTitle(activeProduct))}
          </p>
        ) : null}
      </div>

      <div className="mt-3 flex justify-center gap-2">
        {products.map((product, index) => (
          <button
            key={product.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Show ${getProductTitle(product)}`}
            aria-pressed={index === activeIndex}
            className={`relative h-16 w-20 overflow-hidden rounded-xl border-2 bg-[#fff] shadow-sm transition ${
              index === activeIndex
                ? "border-[var(--site-accent)]"
                : "border-[var(--site-border)] opacity-60 hover:opacity-100"
            }`}
          >
            <Image
              src={getProductImageSrc(product)}
              alt=""
              fill
              sizes="120px"
              className="object-contain p-1.5"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function DealCard({ deal, onAddToCart }: { deal: Deal; onAddToCart: (deal: Deal) => void }) {
  const products = deal.products.map((item) => item.product).filter(isProduct);
  const originalPrice = products.reduce(
    (sum, product) => sum + getEffectiveProductPrice(product),
    0
  );
  const savings = Math.max(0, originalPrice - deal.specialPrice);
  const savingsPercent = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;

  return (
    <article className="flex min-w-0 flex-col rounded-[1.75rem] border border-[var(--site-border)] bg-[var(--site-panel)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.08)] transition hover:border-[var(--site-accent)] sm:p-5">
      <DealSlideshow products={products} savings={savings} />

      <div className="mt-5 flex flex-1 flex-col px-1">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--site-accent)]">
          {products.length}-item bundle
        </p>
        <h2 className="mt-2 text-2xl font-black leading-tight sm:text-[1.7rem]">
          {sanitize(deal.title)}
        </h2>

        <ul className="mt-5 divide-y divide-[var(--site-border)] rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel-soft)]">
          {products.map((product) => (
            <li key={product.id} className="flex items-center gap-3 px-4 py-3">
              <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--site-accent)]" />
              <Link
                href={getProductHref(product)}
                className="min-w-0 flex-1 truncate text-sm font-semibold transition hover:text-[var(--site-accent)]"
              >
                {sanitize(getProductTitle(product))}
              </Link>
              <span className="shrink-0 text-sm font-semibold text-[var(--site-muted)]">
                ${getEffectiveProductPrice(product).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--site-muted)]">
                Bundle price
              </p>
              <div className="mt-1 flex items-end gap-3">
                <span className="text-4xl font-black leading-none text-[var(--site-accent)]">
                  ${deal.specialPrice.toFixed(2)}
                </span>
                {savings > 0 ? (
                  <span className="pb-1 text-base font-semibold text-[var(--site-muted)] line-through">
                    ${originalPrice.toFixed(2)}
                  </span>
                ) : null}
              </div>
            </div>
            {savings > 0 ? (
              <span className="rounded-full bg-[var(--site-accent-soft)] px-3 py-1.5 text-sm font-black text-[var(--site-accent)]">
                {savingsPercent}% less than separately
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => onAddToCart(deal)}
            className="mt-5 inline-flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-full bg-[var(--site-accent)] px-6 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_12px_30px_rgba(220,16,30,0.3)] transition hover:-translate-y-0.5 hover:bg-[var(--site-accent-strong)]"
          >
            <HiOutlineShoppingBag className="h-5 w-5" />
            Add bundle to cart
          </button>

          <p className="mt-3 text-center text-xs font-semibold text-[var(--site-muted)]">
            Delivery all over Lebanon · Cash on delivery
          </p>
        </div>
      </div>
    </article>
  );
}

const DealsPage = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const cartState = useProductStore();
  const addToCart =
    typeof cartState?.addToCart === "function" ? cartState.addToCart : () => undefined;
  const calculateTotals =
    typeof cartState?.calculateTotals === "function"
      ? cartState.calculateTotals
      : () => undefined;

  useEffect(() => {
    const loadDeals = async () => {
      setIsLoading(true);

      try {
        const response = await apiClient.get("/api/deals", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.details || data?.error || "Failed to load deals");
        }

        setDeals(Array.isArray(data) ? data : []);
      } catch (error: any) {
        toast.error(error?.message || "Failed to load deals");
      } finally {
        setIsLoading(false);
      }
    };

    loadDeals();
  }, []);

  const activeDeals = useMemo(
    () =>
      deals.filter(
        (deal) =>
          deal.products.length >= 2 &&
          deal.products.every((item) => item.product?.isActive && item.product.inStock > 0)
      ),
    [deals]
  );

  const addDealToCart = (deal: Deal) => {
    const products = deal.products.map((item) => item.product).filter(isProduct);

    if (products.length < 2) {
      toast.error("This deal is missing products.");
      return;
    }

    const unavailableProduct = products.find((product) => !product.isActive || product.inStock <= 0);
    if (unavailableProduct) {
      toast.error(`${getProductTitle(unavailableProduct)} is currently unavailable.`);
      return;
    }

    const allocatedPrices = allocateDealPrices(products, deal.specialPrice);

    products.forEach((product, index) => {
      addToCart({
        cartItemId: `deal:${deal.id}:${product.id}`,
        id: product.id,
        sku: product.sku || undefined,
        title: `${deal.title} - ${getProductTitle(product)}`,
        price: allocatedPrices[index],
        taxRate: product.taxRate || 0,
        image: getProductImage(product),
        amount: 1,
        stock: product.inStock,
      });
    });

    calculateTotals();
    trackAddToCartItemsEvent({
      value: deal.specialPrice,
      items: products.map((product, index) =>
        buildAnalyticsItem({
          id: product.id,
          title: `${deal.title} - ${getProductTitle(product)}`,
          model: product.model,
          sku: product.sku,
          price: allocatedPrices[index],
          manufacturer: product.manufacturer,
          categoryName: product.category?.name,
        })
      ),
    });
    toast.success("Deal added to cart");
  };

  return (
    <main className="bg-[var(--site-bg)] text-[var(--site-text)]">
      <section className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 lg:px-10">
        <div className="relative mb-10 overflow-hidden rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-panel)] px-6 py-10 sm:px-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--site-accent)] opacity-15 blur-3xl" />
          <p className="relative text-sm font-black uppercase tracking-[0.2em] text-[var(--site-accent)]">
            Bundle savings
          </p>
          <h1 className="relative mt-3 text-4xl font-black tracking-tight sm:text-6xl">Deals</h1>
          <p className="relative mt-4 max-w-2xl text-base leading-7 text-[var(--site-muted)]">
            Gear that goes together, for one lower price. Add a bundle and every item lands in
            your cart at the bundle price.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {[0, 1].map((key) => (
              <div
                key={key}
                className="h-[640px] animate-pulse rounded-[1.75rem] border border-[var(--site-border)] bg-[var(--site-panel)]"
              />
            ))}
          </div>
        ) : activeDeals.length === 0 ? (
          <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel)] p-8 text-center">
            <h2 className="text-2xl font-bold">No active deals right now</h2>
            <p className="mt-2 text-[var(--site-muted)]">Check back soon for new bundles.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {activeDeals.map((deal) => (
              <DealCard key={deal.id} deal={deal} onAddToCart={addDealToCart} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default DealsPage;
