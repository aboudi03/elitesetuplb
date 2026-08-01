"use client";

import { useProductStore } from "@/app/_zustand/store";
import apiClient from "@/lib/api";
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
      <section className="mx-auto max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-10">
        <div className="mb-8 border-b border-[var(--site-border)] pb-6">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--site-accent)]">
            Bundle savings
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Deals</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--site-muted)]">
            Shop curated product bundles at one special price.
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel)] p-8 text-center text-[var(--site-muted)]">
            Loading deals...
          </div>
        ) : activeDeals.length === 0 ? (
          <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel)] p-8 text-center">
            <h2 className="text-2xl font-bold">No active deals right now</h2>
            <p className="mt-2 text-[var(--site-muted)]">Check back soon for new bundles.</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {activeDeals.map((deal) => {
              const products = deal.products.map((item) => item.product).filter(isProduct);
              const originalPrice =
                deal.originalPrice ||
                products.reduce((sum, product) => sum + Number(product.price || 0), 0);
              const savings = Math.max(0, originalPrice - deal.specialPrice);

              return (
                <article
                  key={deal.id}
                  className="rounded-[1.5rem] border border-[var(--site-border)] bg-[var(--site-panel)] p-5 shadow-sm"
                >
                  <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
                    <div className="grid grid-cols-2 gap-2">
                      {products.slice(0, 4).map((product) => (
                        <Link
                          href={`/product/${encodeURIComponent(product.slug || product.id)}`}
                          key={product.id}
                          className="relative aspect-square overflow-hidden rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel-soft)]"
                        >
                          <Image
                            src={product.mainImage ? `/${product.mainImage}` : "/product_placeholder.webp"}
                            alt={sanitize(getProductTitle(product))}
                            fill
                            sizes="110px"
                            className="object-contain p-3"
                          />
                        </Link>
                      ))}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--site-muted)]">
                        {products.length} product bundle
                      </p>
                      <h2 className="mt-2 text-2xl font-black">{sanitize(deal.title)}</h2>
                      {deal.description ? (
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--site-muted)]">
                          {sanitize(deal.description)}
                        </p>
                      ) : null}

                      <div className="mt-5 flex flex-wrap items-end gap-3">
                        <span className="text-3xl font-black text-[var(--site-accent)]">
                          ${deal.specialPrice.toFixed(2)}
                        </span>
                        <span className="pb-1 text-sm text-[var(--site-muted)] line-through">
                          ${originalPrice.toFixed(2)}
                        </span>
                        {savings > 0 ? (
                          <span className="mb-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700">
                            Save ${savings.toFixed(2)}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {products.map((product) => (
                          <Link
                            href={`/product/${encodeURIComponent(product.slug || product.id)}`}
                            key={product.id}
                            className="rounded-full border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 py-1 text-xs font-semibold text-[var(--site-muted)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
                          >
                            {sanitize(getProductTitle(product))}
                          </Link>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => addDealToCart(deal)}
                        className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--site-accent)] px-6 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-[var(--site-accent-strong)] sm:w-auto"
                      >
                        <HiOutlineShoppingBag className="h-5 w-5" />
                        Add deal to cart
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};

export default DealsPage;
