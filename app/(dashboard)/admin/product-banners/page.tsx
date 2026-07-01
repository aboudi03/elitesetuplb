"use client";

import { DashboardSidebar } from "@/components";
import apiClient, { getRuntimeApiBaseUrl } from "@/lib/api";
import { sanitize } from "@/lib/sanitize";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FaPen, FaTrash, FaUpload, FaXmark } from "react-icons/fa6";

type BannerDraft = {
  id?: string;
  title: string;
  image: string;
  altText: string;
  scopeType: ProductBanner["scopeType"];
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  sortOrder: number;
  productIds: string[];
  categoryIds: string[];
};

const emptyDraft: BannerDraft = {
  title: "",
  image: "",
  altText: "",
  scopeType: "ALL",
  isActive: true,
  startsAt: "",
  endsAt: "",
  sortOrder: 0,
  productIds: [],
  categoryIds: [],
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

function buildDraftFromBanner(banner: ProductBanner): BannerDraft {
  return {
    id: banner.id,
    title: banner.title,
    image: banner.image,
    altText: banner.altText || "",
    scopeType: banner.scopeType,
    isActive: banner.isActive,
    startsAt: toDateInputValue(banner.startsAt),
    endsAt: toDateInputValue(banner.endsAt),
    sortOrder: banner.sortOrder || 0,
    productIds: banner.productIds || banner.products.map((item) => item.productId),
    categoryIds: banner.categoryIds || banner.categories.map((item) => item.categoryId),
  };
}

const ProductBannersAdminPage = () => {
  const [banners, setBanners] = useState<ProductBanner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [draft, setDraft] = useState<BannerDraft>(emptyDraft);
  const [productSearch, setProductSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const filteredProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase();
    if (!search) return products;

    return products.filter((product) =>
      [product.title, product.model, product.sku, product.manufacturer, product.category?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }, [productSearch, products]);

  const filteredCategories = useMemo(() => {
    const search = categorySearch.trim().toLowerCase();
    if (!search) return categories;
    return categories.filter((category) => category.name.toLowerCase().includes(search));
  }, [categories, categorySearch]);

  const loadData = async () => {
    setIsLoading(true);

    try {
      const [bannersResponse, productsResponse, categoriesResponse] = await Promise.all([
        apiClient.get("/api/product-banners?mode=admin", { cache: "no-store" }),
        apiClient.get("/api/products?mode=admin", { cache: "no-store" }),
        apiClient.get("/api/categories", { cache: "no-store" }),
      ]);
      const [bannersData, productsData, categoriesData] = await Promise.all([
        bannersResponse.json(),
        productsResponse.json(),
        categoriesResponse.json(),
      ]);

      if (!bannersResponse.ok) {
        throw new Error(bannersData?.details || bannersData?.error || "Failed to load banners");
      }

      setBanners(Array.isArray(bannersData) ? bannersData : []);
      setProducts(Array.isArray(productsData) ? productsData : productsData?.products || []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load product banners");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setDraft(emptyDraft);
    setProductSearch("");
    setCategorySearch("");
  };

  const toggleProduct = (productId: string) => {
    setDraft((current) => ({
      ...current,
      productIds: current.productIds.includes(productId)
        ? current.productIds.filter((id) => id !== productId)
        : [...current.productIds, productId],
    }));
  };

  const toggleCategory = (categoryId: string) => {
    setDraft((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(categoryId)
        ? current.categoryIds.filter((id) => id !== categoryId)
        : [...current.categoryIds, categoryId],
    }));
  };

  const uploadBannerImage = async (file: File | null) => {
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("uploadedFile", file);
      formData.append("fileNameSeed", draft.title || "product-banner");

      const response = await fetch(`${getRuntimeApiBaseUrl()}/api/main-image`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || !data?.path) {
        throw new Error(data?.message || "Failed to upload banner image");
      }

      setDraft((current) => ({
        ...current,
        image: data.path,
      }));
      toast.success("Banner image uploaded");
    } catch (error: any) {
      toast.error(error?.message || "Failed to upload banner image");
    } finally {
      setIsUploading(false);
    }
  };

  const saveBanner = async () => {
    if (!draft.title.trim()) {
      toast.error("Banner title is required");
      return;
    }

    if (!draft.image.trim()) {
      toast.error("Upload or paste a banner image path");
      return;
    }

    if (draft.scopeType === "PRODUCTS" && draft.productIds.length === 0) {
      toast.error("Choose at least one product");
      return;
    }

    if (draft.scopeType === "CATEGORIES" && draft.categoryIds.length === 0) {
      toast.error("Choose at least one category");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        title: draft.title,
        image: draft.image,
        altText: draft.altText || null,
        scopeType: draft.scopeType,
        isActive: draft.isActive,
        startsAt: draft.startsAt || null,
        endsAt: draft.endsAt || null,
        sortOrder: Number(draft.sortOrder) || 0,
        productIds: draft.scopeType === "PRODUCTS" ? draft.productIds : [],
        categoryIds: draft.scopeType === "CATEGORIES" ? draft.categoryIds : [],
      };
      const response = draft.id
        ? await apiClient.put(`/api/product-banners/${draft.id}`, payload)
        : await apiClient.post("/api/product-banners", payload);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.details || responseData?.error || "Failed to save banner");
      }

      toast.success(draft.id ? "Banner updated" : "Banner created");
      resetForm();
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save banner");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBanner = async (banner: ProductBanner) => {
    if (!window.confirm(`Delete ${banner.title}?`)) return;

    try {
      const response = await apiClient.delete(`/api/product-banners/${banner.id}`);

      if (!response.ok) {
        const responseData = await response.json().catch(() => ({}));
        throw new Error(responseData?.details || responseData?.error || "Failed to delete banner");
      }

      toast.success("Banner deleted");
      if (draft.id === banner.id) {
        resetForm();
      }
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete banner");
    }
  };

  return (
    <div className="mx-auto flex max-w-screen-2xl justify-start gap-y-5 bg-[var(--site-bg)] text-[var(--site-text)] xl:h-full max-xl:flex-col">
      <DashboardSidebar />
      <div className="w-full xl:ml-5 max-xl:px-5">
        <div className="mb-8 rounded-[2rem] border border-[var(--site-border)] bg-[linear-gradient(135deg,var(--site-panel),var(--site-panel-soft))] px-6 py-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--site-muted)]">
            Catalog banners
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Product banners</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--site-muted)]">
            Upload a small banner image and choose whether it appears on all products, selected products, or selected categories.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className={sectionClassName}>
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">{draft.id ? "Edit banner" : "Create banner"}</h2>
                <p className="mt-2 text-sm text-[var(--site-muted)]">
                  The image overlays the upper-left area of the product image.
                </p>
              </div>
              {draft.id ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 text-sm font-semibold"
                >
                  <FaXmark /> New banner
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
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Alt text</span>
                <input
                  className={fieldClassName}
                  value={draft.altText}
                  onChange={(event) => setDraft({ ...draft, altText: event.target.value })}
                />
              </label>

              <div className="md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Banner image</span>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    className={fieldClassName}
                    value={draft.image}
                    placeholder="uploads/banner.webp"
                    onChange={(event) => setDraft({ ...draft, image: event.target.value })}
                  />
                  <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-5 text-sm font-semibold transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]">
                    <FaUpload />
                    {isUploading ? "Uploading..." : "Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={isUploading}
                      onChange={(event) => uploadBannerImage(event.target.files?.[0] || null)}
                    />
                  </label>
                </div>
                {draft.image ? (
                  <div className="mt-4 inline-flex rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] p-3">
                    <div className="relative h-16 w-40">
                      <Image
                        src={`/${draft.image.replace(/^\/+/, "")}`}
                        alt={sanitize(draft.altText || draft.title || "Banner preview")}
                        fill
                        sizes="160px"
                        className="object-contain object-left"
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Visibility</span>
                <select
                  className={fieldClassName}
                  value={draft.isActive ? "active" : "inactive"}
                  onChange={(event) =>
                    setDraft({ ...draft, isActive: event.target.value === "active" })
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
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
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Show on</span>
                <select
                  className={fieldClassName}
                  value={draft.scopeType}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      scopeType: event.target.value as ProductBanner["scopeType"],
                    })
                  }
                >
                  <option value="ALL">All products</option>
                  <option value="PRODUCTS">Selected products</option>
                  <option value="CATEGORIES">Selected categories</option>
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={saveBanner}
              disabled={isSaving}
              className="mt-6 inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-[var(--site-accent)] px-8 text-base font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--site-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : draft.id ? "Update banner" : "Create banner"}
            </button>
          </section>

          <section className={sectionClassName}>
            <h2 className="text-2xl font-semibold">Targets</h2>
            <p className="mt-2 text-sm text-[var(--site-muted)]">
              {draft.scopeType === "ALL"
                ? "This banner will appear wherever products are shown."
                : draft.scopeType === "PRODUCTS"
                ? `${draft.productIds.length} products selected`
                : `${draft.categoryIds.length} categories selected`}
            </p>

            {draft.scopeType === "PRODUCTS" ? (
              <div className="mt-5">
                <input
                  className={fieldClassName}
                  value={productSearch}
                  placeholder="Search products..."
                  onChange={(event) => setProductSearch(event.target.value)}
                />
                <div className="mt-4 max-h-[620px] space-y-3 overflow-y-auto pr-1">
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
                          width={56}
                          height={56}
                          className="h-14 w-14 rounded-xl object-contain"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">
                            {sanitize(product.title || product.model || "Untitled product")}
                          </span>
                          <span className="mt-1 block truncate text-sm text-[var(--site-muted)]">
                            {sanitize(product.category?.name || "Uncategorized")}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {draft.scopeType === "CATEGORIES" ? (
              <div className="mt-5">
                <input
                  className={fieldClassName}
                  value={categorySearch}
                  placeholder="Search categories..."
                  onChange={(event) => setCategorySearch(event.target.value)}
                />
                <div className="mt-4 grid max-h-[620px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                  {filteredCategories.map((category) => {
                    const isSelected = draft.categoryIds.includes(category.id);

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className={`rounded-2xl border px-4 py-3 text-left font-semibold transition ${
                          isSelected
                            ? "border-[var(--site-accent)] bg-[var(--site-accent-soft)] text-[var(--site-accent)]"
                            : "border-[var(--site-border)] bg-[var(--site-panel-soft)] hover:border-[var(--site-accent)]"
                        }`}
                      >
                        {sanitize(category.name)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <section className={`${sectionClassName} mt-6`}>
          <div className="mb-5">
            <h2 className="text-2xl font-semibold">Existing banners</h2>
            <p className="mt-2 text-sm text-[var(--site-muted)]">
              {isLoading ? "Loading banners..." : `${banners.length} banners configured`}
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {banners.map((banner) => (
              <article
                key={banner.id}
                className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-4">
                    <div className="relative h-14 w-32 shrink-0 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel)]">
                      <Image
                        src={`/${banner.image.replace(/^\/+/, "")}`}
                        alt={sanitize(banner.altText || banner.title)}
                        fill
                        sizes="128px"
                        className="object-contain p-2"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--site-muted)]">
                        {banner.isActive ? "Active" : "Inactive"} | {banner.scopeType.toLowerCase()}
                      </p>
                      <h3 className="mt-2 truncate text-xl font-semibold">{sanitize(banner.title)}</h3>
                      <p className="mt-1 text-sm text-[var(--site-muted)]">
                        {banner.scopeType === "PRODUCTS"
                          ? `${banner.products.length} products`
                          : banner.scopeType === "CATEGORIES"
                          ? `${banner.categories.length} categories`
                          : "All products"}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => setDraft(buildDraftFromBanner(banner))}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--site-border)] bg-[var(--site-panel)]"
                      aria-label={`Edit ${banner.title}`}
                    >
                      <FaPen />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteBanner(banner)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600"
                      aria-label={`Delete ${banner.title}`}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {!isLoading && banners.length === 0 ? (
              <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] p-8 text-center text-[var(--site-muted)] lg:col-span-2">
                No product banners created yet.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductBannersAdminPage;
