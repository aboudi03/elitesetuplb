"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { DashboardSidebar } from "@/components";
import { getRuntimeApiBaseUrl } from "@/lib/api";

type ProductOption = {
  id: string;
  title?: string | null;
  model: string;
  sku?: string | null;
  featuredSortOrder?: number | null;
};

type FeaturedBrandForm = {
  id?: string;
  title: string;
  logo: string;
  isActive: boolean;
  sortOrder: number;
  productIds: string[];
};

const MAX_PRODUCTS_PER_BRAND = 5;

const createEmptyBrand = (sortOrder = 0): FeaturedBrandForm => ({
  title: "",
  logo: "",
  isActive: true,
  sortOrder,
  productIds: [],
});

const getProductLabel = (product: ProductOption) =>
  [product.title || product.model, product.sku ? `SKU: ${product.sku}` : null]
    .filter(Boolean)
    .join(" | ");

export default function FeaturedBrandsAdminPage() {
  const [brands, setBrands] = useState<FeaturedBrandForm[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [brandsResponse, productsResponse] = await Promise.all([
        fetch(`${getRuntimeApiBaseUrl()}/api/featured-brands?mode=admin`, {
          cache: "no-store",
        }),
        fetch(
          `${getRuntimeApiBaseUrl()}/api/products?mode=admin&featured=true&isActive=true&sortBy=featuredSortOrder&sortDirection=asc`,
          {
            cache: "no-store",
          }
        ),
      ]);

      const [brandsData, productsData] = await Promise.all([
        brandsResponse.json(),
        productsResponse.json(),
      ]);

      if (!brandsResponse.ok) {
        throw new Error(brandsData?.error || "Failed to load featured brand groups");
      }

      if (!productsResponse.ok) {
        throw new Error(productsData?.error || "Failed to load featured products");
      }

      setFeaturedProducts(Array.isArray(productsData) ? productsData : []);
      setBrands(
        (Array.isArray(brandsData) ? brandsData : []).map((brand: any) => ({
          id: brand.id,
          title: brand.title || "",
          logo: brand.logo || "",
          isActive: Boolean(brand.isActive),
          sortOrder: Number(brand.sortOrder) || 0,
          productIds: Array.isArray(brand.products)
            ? brand.products
                .sort((first: any, second: any) => first.sortOrder - second.sortOrder)
                .map((item: any) => item.productId)
            : [],
        }))
      );
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to load featured brands");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateBrandField = (
    index: number,
    field: keyof FeaturedBrandForm,
    value: string | number | boolean | string[]
  ) => {
    setBrands((currentBrands) =>
      currentBrands.map((brand, currentIndex) =>
        currentIndex === index ? { ...brand, [field]: value } : brand
      )
    );
  };

  const updateBrandProductSlot = (brandIndex: number, slotIndex: number, value: string) => {
    setBrands((currentBrands) =>
      currentBrands.map((brand, currentIndex) => {
        if (currentIndex !== brandIndex) {
          return brand;
        }

        const nextProductIds = [...brand.productIds];

        while (nextProductIds.length < MAX_PRODUCTS_PER_BRAND) {
          nextProductIds.push("");
        }

        nextProductIds[slotIndex] = value;

        return {
          ...brand,
          productIds: nextProductIds,
        };
      })
    );
  };

  const uploadLogo = async (file: File) => {
    const formData = new FormData();
    formData.append("uploadedFile", file);

    const response = await fetch(`${getRuntimeApiBaseUrl()}/api/main-image`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Logo upload failed");
    }

    return response.json();
  };

  const saveBrand = async (brand: FeaturedBrandForm, index: number) => {
    if (!brand.title.trim()) {
      toast.error("Brand title is required");
      return;
    }

    if (!brand.logo.trim()) {
      toast.error("Brand logo is required");
      return;
    }

    const productIds = brand.productIds.map((productId) => productId.trim()).filter(Boolean);

    try {
      const endpoint = brand.id
        ? `${getRuntimeApiBaseUrl()}/api/featured-brands/${brand.id}`
        : `${getRuntimeApiBaseUrl()}/api/featured-brands`;
      const method = brand.id ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: brand.title,
          logo: brand.logo,
          isActive: brand.isActive,
          sortOrder: brand.sortOrder,
          productIds,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.error || "Failed to save featured brand");
      }

      updateBrandField(index, "id", responseData.id);
      toast.success(brand.id ? "Featured brand updated" : "Featured brand created");
      await fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to save featured brand");
    }
  };

  const deleteBrand = async (brandId?: string) => {
    if (!brandId) {
      return;
    }

    try {
      const response = await fetch(`${getRuntimeApiBaseUrl()}/api/featured-brands/${brandId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete featured brand");
      }

      setBrands((currentBrands) => currentBrands.filter((brand) => brand.id !== brandId));
      toast.success("Featured brand deleted");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to delete featured brand");
    }
  };

  return (
    <div className="mx-auto flex max-w-screen-2xl justify-start gap-y-5 bg-[var(--site-bg)] text-[var(--site-text)] xl:h-full max-xl:flex-col">
      <DashboardSidebar />
      <div className="flex w-full flex-col gap-6 xl:ml-5 max-xl:px-5">
        <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
          <div>
            <h1 className="text-3xl font-semibold">Featured Brands</h1>
            <p className="mt-2 max-w-3xl text-sm text-[var(--site-muted)]">
              Create the brand strip shown under homepage featured products. Each brand gets a
              logo, a title, and up to five ordered products that appear when shoppers click it.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setBrands((currentBrands) => [
                ...currentBrands,
                createEmptyBrand(currentBrands.length),
              ])
            }
            className="rounded-md bg-[var(--site-accent)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--site-accent-strong)]"
          >
            Add brand set
          </button>
        </div>

        <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel)] p-4 text-sm text-[var(--site-muted)]">
          Only products already marked as featured and enabled can be used here. Slot 1 shows
          first on the storefront, slot 2 shows second, and so on up to five products.
        </div>

        {loading ? (
          <p className="text-sm text-[var(--site-muted)]">Loading featured brand groups...</p>
        ) : (
          <div className="grid gap-6">
            {brands.map((brand, index) => (
              <section
                key={brand.id ?? `featured-brand-${index}`}
                className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel)] p-5 shadow-sm"
              >
                <div className="mb-5 flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-start">
                  <div>
                    <h2 className="text-xl font-semibold">Brand Set {index + 1}</h2>
                    <p className="mt-1 text-sm text-[var(--site-muted)]">
                      Manage the logo tile and the five-product selection shown for this brand.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {brand.id ? (
                      <button
                        type="button"
                        onClick={() => deleteBrand(brand.id)}
                        className="rounded-md border border-red-500 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500 hover:text-white"
                      >
                        Delete
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => saveBrand(brand, index)}
                      className="rounded-md bg-[var(--site-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--site-accent-strong)]"
                    >
                      Save brand set
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="form-control">
                    <div className="label">
                      <span className="label-text">Brand title</span>
                    </div>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={brand.title}
                      onChange={(event) => updateBrandField(index, "title", event.target.value)}
                      placeholder="Logitech, HyperX, ASUS..."
                    />
                  </label>

                  <label className="form-control">
                    <div className="label">
                      <span className="label-text">Sort order</span>
                    </div>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={brand.sortOrder}
                      onChange={(event) =>
                        updateBrandField(index, "sortOrder", Number(event.target.value))
                      }
                    />
                  </label>

                  <label className="form-control">
                    <div className="label">
                      <span className="label-text">Logo upload</span>
                    </div>
                    <input
                      type="file"
                      className="file-input file-input-bordered w-full"
                      accept="image/*"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];

                        if (!file) {
                          return;
                        }

                        try {
                          const uploaded = await uploadLogo(file);
                          updateBrandField(index, "logo", uploaded.path);
                          toast.success("Brand logo uploaded");
                        } catch (error: any) {
                          console.error(error);
                          toast.error(error?.message || "Failed to upload brand logo");
                        }
                      }}
                    />
                    <p className="mt-2 text-xs text-[var(--site-muted)]">
                      Saved path: {brand.logo || "No logo uploaded yet"}
                    </p>
                    {brand.logo ? (
                      <div className="mt-3 rounded-2xl border border-[var(--site-border)] bg-white p-4">
                        <Image
                          src={`/${brand.logo}`}
                          alt={brand.title || "Brand logo"}
                          width={160}
                          height={80}
                          className="h-16 w-auto object-contain"
                        />
                      </div>
                    ) : null}
                  </label>

                  <label className="form-control">
                    <div className="label">
                      <span className="label-text">Visibility</span>
                    </div>
                    <select
                      className="select select-bordered"
                      value={brand.isActive ? "enabled" : "disabled"}
                      onChange={(event) =>
                        updateBrandField(index, "isActive", event.target.value === "enabled")
                      }
                    >
                      <option value="enabled">Enabled</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </label>

                  <div className="lg:col-span-2">
                    <div className="mb-3">
                      <h3 className="text-base font-semibold">Featured product slots</h3>
                      <p className="mt-1 text-sm text-[var(--site-muted)]">
                        Pick up to five products in the exact order they should appear.
                      </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {Array.from({ length: MAX_PRODUCTS_PER_BRAND }).map((_, slotIndex) => (
                        <label key={`${brand.id ?? index}-slot-${slotIndex}`} className="form-control">
                          <div className="label">
                            <span className="label-text">Slot {slotIndex + 1}</span>
                          </div>
                          <select
                            className="select select-bordered"
                            value={brand.productIds[slotIndex] || ""}
                            onChange={(event) =>
                              updateBrandProductSlot(index, slotIndex, event.target.value)
                            }
                          >
                            <option value="">No product selected</option>
                            {featuredProducts.map((product) => (
                              <option key={product.id} value={product.id}>
                                {getProductLabel(product)}
                              </option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            ))}

            {brands.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--site-border)] bg-[var(--site-panel)] p-8 text-sm text-[var(--site-muted)]">
                No featured brand sets yet. Use "Add brand set" to build the strip shown beneath
                the homepage featured products section.
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
