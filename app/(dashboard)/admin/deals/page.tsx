"use client";

import { DashboardSidebar } from "@/components";
import apiClient from "@/lib/api";
import { sanitize } from "@/lib/sanitize";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FaPen, FaTrash, FaXmark } from "react-icons/fa6";

type DealDraft = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  specialPrice: number;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  sortOrder: number;
  productIds: string[];
};

const emptyDealDraft: DealDraft = {
  title: "",
  slug: "",
  description: "",
  specialPrice: 0,
  isActive: true,
  startsAt: "",
  endsAt: "",
  sortOrder: 0,
  productIds: [],
};

const fieldClassName =
  "block w-full rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 py-3 text-base text-[var(--site-text)] shadow-sm outline-none transition focus:border-[var(--site-accent)] focus:ring-2 focus:ring-[var(--site-accent-soft)]";
const sectionClassName =
  "rounded-3xl border border-[var(--site-border)] bg-[var(--site-panel)] p-6 shadow-sm";

function toDateInputValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function buildDraftFromDeal(deal: Deal): DealDraft {
  return {
    id: deal.id,
    title: deal.title,
    slug: deal.slug,
    description: deal.description || "",
    specialPrice: deal.specialPrice,
    isActive: deal.isActive,
    startsAt: toDateInputValue(deal.startsAt),
    endsAt: toDateInputValue(deal.endsAt),
    sortOrder: deal.sortOrder || 0,
    productIds: deal.products.map((item) => item.productId),
  };
}

const AdminDealsPage = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [draft, setDraft] = useState<DealDraft>(emptyDealDraft);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const selectedProducts = useMemo(
    () => products.filter((product) => draft.productIds.includes(product.id)),
    [draft.productIds, products]
  );
  const originalPrice = selectedProducts.reduce((sum, product) => sum + product.price, 0);
  const savings = Math.max(0, originalPrice - Number(draft.specialPrice || 0));
  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return products;

    return products.filter((product) =>
      [product.title, product.model, product.sku, product.manufacturer]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [products, search]);

  const loadData = async () => {
    setIsLoading(true);

    try {
      const [dealsResponse, productsResponse] = await Promise.all([
        apiClient.get("/api/deals?mode=admin", { cache: "no-store" }),
        apiClient.get("/api/products?mode=admin", { cache: "no-store" }),
      ]);
      const [dealsData, productsData] = await Promise.all([
        dealsResponse.json(),
        productsResponse.json(),
      ]);

      if (!dealsResponse.ok) {
        throw new Error(dealsData?.details || dealsData?.error || "Failed to load deals");
      }

      if (!productsResponse.ok) {
        throw new Error(productsData?.details || productsData?.error || "Failed to load products");
      }

      setDeals(Array.isArray(dealsData) ? dealsData : []);
      setProducts(Array.isArray(productsData) ? productsData : productsData?.products || []);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load deals");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleProduct = (productId: string) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      productIds: currentDraft.productIds.includes(productId)
        ? currentDraft.productIds.filter((id) => id !== productId)
        : [...currentDraft.productIds, productId],
    }));
  };

  const resetForm = () => {
    setDraft(emptyDealDraft);
    setSearch("");
  };

  const saveDeal = async () => {
    if (!draft.title.trim()) {
      toast.error("Deal title is required");
      return;
    }

    if (draft.productIds.length < 2) {
      toast.error("Choose at least 2 products");
      return;
    }

    if (Number(draft.specialPrice) <= 0) {
      toast.error("Special price must be greater than 0");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        title: draft.title,
        slug: draft.slug || undefined,
        description: draft.description || null,
        specialPrice: Number(draft.specialPrice),
        isActive: draft.isActive,
        startsAt: draft.startsAt || null,
        endsAt: draft.endsAt || null,
        sortOrder: Number(draft.sortOrder) || 0,
        productIds: draft.productIds,
      };
      const response = draft.id
        ? await apiClient.put(`/api/deals/${draft.id}`, payload)
        : await apiClient.post("/api/deals", payload);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.details || responseData?.error || "Failed to save deal");
      }

      toast.success(draft.id ? "Deal updated" : "Deal created");
      resetForm();
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save deal");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteDeal = async (deal: Deal) => {
    if (!window.confirm(`Delete ${deal.title}?`)) return;

    try {
      const response = await apiClient.delete(`/api/deals/${deal.id}`);
      if (!response.ok) {
        const responseData = await response.json().catch(() => ({}));
        throw new Error(responseData?.details || responseData?.error || "Failed to delete deal");
      }

      toast.success("Deal deleted");
      if (draft.id === deal.id) {
        resetForm();
      }
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete deal");
    }
  };

  return (
    <div className="mx-auto flex max-w-screen-2xl justify-start gap-y-5 bg-[var(--site-bg)] text-[var(--site-text)] xl:h-full max-xl:flex-col">
      <DashboardSidebar />
      <div className="w-full xl:ml-5 max-xl:px-5">
        <div className="mb-8 rounded-[2rem] border border-[var(--site-border)] bg-[linear-gradient(135deg,var(--site-panel),var(--site-panel-soft))] px-6 py-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--site-muted)]">
            Promotions
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Deals</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--site-muted)]">
            Bundle two or more products and sell them together for one special price.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className={sectionClassName}>
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">{draft.id ? "Edit deal" : "Create deal"}</h2>
                <p className="mt-2 text-sm text-[var(--site-muted)]">
                  Pick at least 2 products, then set the price customers pay for the bundle.
                </p>
              </div>
              {draft.id ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 text-sm font-semibold"
                >
                  <FaXmark /> New deal
                </button>
              ) : null}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Title</span>
                <input
                  className={fieldClassName}
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Slug</span>
                <input
                  className={fieldClassName}
                  value={draft.slug}
                  placeholder="Auto-generated when empty"
                  onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Special price</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className={fieldClassName}
                  value={draft.specialPrice}
                  onChange={(event) =>
                    setDraft({ ...draft, specialPrice: Number(event.target.value) })
                  }
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Sort order</span>
                <input
                  type="number"
                  className={fieldClassName}
                  value={draft.sortOrder}
                  onChange={(event) => setDraft({ ...draft, sortOrder: Number(event.target.value) })}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Start date</span>
                <input
                  type="date"
                  className={fieldClassName}
                  value={draft.startsAt}
                  onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">End date</span>
                <input
                  type="date"
                  className={fieldClassName}
                  value={draft.endsAt}
                  onChange={(event) => setDraft({ ...draft, endsAt: event.target.value })}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Visibility</span>
                <select
                  className={fieldClassName}
                  value={draft.isActive ? "active" : "inactive"}
                  onChange={(event) =>
                    setDraft({ ...draft, isActive: event.target.value === "active" })
                  }
                >
                  <option value="active">Active - visible on deals page</option>
                  <option value="inactive">Inactive - hidden from customers</option>
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Description</span>
                <textarea
                  className={`${fieldClassName} min-h-28`}
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                />
              </label>
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] p-4">
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-[var(--site-muted)]">Selected</p>
                  <p className="mt-1 text-lg font-bold">{draft.productIds.length} products</p>
                </div>
                <div>
                  <p className="text-[var(--site-muted)]">Original total</p>
                  <p className="mt-1 text-lg font-bold">${originalPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[var(--site-muted)]">Savings</p>
                  <p className="mt-1 text-lg font-bold text-[var(--site-accent)]">${savings.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={saveDeal}
              disabled={isSaving}
              className="mt-6 inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-[var(--site-accent)] px-8 text-base font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--site-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : draft.id ? "Update deal" : "Create deal"}
            </button>
          </section>

          <section className={sectionClassName}>
            <div className="mb-5">
              <h2 className="text-2xl font-semibold">Products</h2>
              <input
                className={`${fieldClassName} mt-4`}
                value={search}
                placeholder="Search products..."
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="max-h-[640px] space-y-3 overflow-y-auto pr-1">
              {filteredProducts.map((product) => {
                const isSelected = draft.productIds.includes(product.id);

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => toggleProduct(product.id)}
                    className={`flex w-full items-center gap-4 rounded-2xl border p-3 text-left transition ${
                      isSelected
                        ? "border-[var(--site-accent)] bg-[var(--site-accent-soft)]"
                        : "border-[var(--site-border)] bg-[var(--site-panel-soft)] hover:border-[var(--site-accent)]"
                    }`}
                  >
                    <Image
                      src={product.mainImage ? `/${product.mainImage}` : "/product_placeholder.webp"}
                      alt={sanitize(product.title || product.model || "Product")}
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-xl object-contain"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {sanitize(product.title || product.model || "Untitled product")}
                      </span>
                      <span className="mt-1 block truncate text-sm text-[var(--site-muted)]">
                        {sanitize(product.model || "-")} {product.sku ? `| SKU: ${sanitize(product.sku)}` : ""}
                      </span>
                    </span>
                    <span className="font-bold text-[var(--site-accent)]">${product.price.toFixed(2)}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <section className={`${sectionClassName} mt-6`}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">Existing deals</h2>
              <p className="mt-2 text-sm text-[var(--site-muted)]">
                {isLoading ? "Loading deals..." : `${deals.length} deals configured`}
              </p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {deals.map((deal) => (
              <article
                key={deal.id}
                className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--site-muted)]">
                      {deal.isActive ? "Active" : "Inactive"}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold">{sanitize(deal.title)}</h3>
                    <p className="mt-2 text-sm text-[var(--site-muted)]">
                      {deal.products.length} products | ${deal.specialPrice.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDraft(buildDraftFromDeal(deal))}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--site-border)] bg-[var(--site-panel)]"
                      aria-label={`Edit ${deal.title}`}
                    >
                      <FaPen />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteDeal(deal)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600"
                      aria-label={`Delete ${deal.title}`}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {deal.products.map((item) => (
                    <span
                      key={item.id}
                      className="rounded-full border border-[var(--site-border)] bg-[var(--site-panel)] px-3 py-1 text-xs font-semibold text-[var(--site-muted)]"
                    >
                      {sanitize(item.product?.title || item.product?.model || "Product")}
                    </span>
                  ))}
                </div>
              </article>
            ))}
            {!isLoading && deals.length === 0 ? (
              <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] p-8 text-center text-[var(--site-muted)] lg:col-span-2">
                No deals created yet.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDealsPage;
