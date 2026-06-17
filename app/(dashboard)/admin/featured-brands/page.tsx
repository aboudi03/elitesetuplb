"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { FaArrowDown, FaArrowUp, FaFloppyDisk, FaPen, FaPlus, FaTrash } from "react-icons/fa6";
import { DashboardSidebar } from "@/components";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { getRuntimeApiBaseUrl } from "@/lib/api";

type ProductOption = {
  id: string;
  title?: string | null;
  model: string;
  sku?: string | null;
  category?: {
    name?: string | null;
  } | null;
};

type FeaturedBrandForm = {
  clientId: string;
  id?: string;
  title: string;
  logo: string;
  isActive: boolean;
  sortOrder: number;
  productIds: string[];
};

const MAX_PRODUCTS_PER_BRAND = 5;

const createEmptyBrand = (sortOrder = 0): FeaturedBrandForm => ({
  clientId: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  title: "",
  logo: "",
  isActive: true,
  sortOrder,
  productIds: [],
});

const getProductLabel = (product: ProductOption) =>
  [
    product.title || product.model,
    product.category?.name ? `Category: ${product.category.name}` : null,
    product.sku ? `SKU: ${product.sku}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

const getBrandRowId = (brand: FeaturedBrandForm) =>
  brand.id || brand.clientId;

export default function FeaturedBrandsAdminPage() {
  const [brands, setBrands] = useState<FeaturedBrandForm[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [editingIds, setEditingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  const fetchData = async () => {
    try {
      setLoading(true);

      const [brandsResponse, productsResponse] = await Promise.all([
        fetch(`${getRuntimeApiBaseUrl()}/api/featured-brands?mode=admin`, {
          cache: "no-store",
        }),
        fetch(
          `${getRuntimeApiBaseUrl()}/api/products?mode=admin&isActive=true&sortBy=title&sortDirection=asc`,
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
        throw new Error(productsData?.error || "Failed to load products");
      }

      setProducts(Array.isArray(productsData) ? productsData : []);
      setBrands(
        (Array.isArray(brandsData) ? brandsData : []).map((brand: any, index: number) => ({
          clientId: brand.id || `existing-${index}`,
          id: brand.id,
          title: brand.title || "",
          logo: brand.logo || "",
          isActive: Boolean(brand.isActive),
          sortOrder: Number(brand.sortOrder) || index,
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

  const updateBrand = (rowId: string, updates: Partial<FeaturedBrandForm>) => {
    setBrands((currentBrands) =>
      currentBrands.map((brand) =>
        getBrandRowId(brand) === rowId ? { ...brand, ...updates } : brand
      )
    );
  };

  const updateBrandProductSlot = (rowId: string, slotIndex: number, value: string) => {
    setBrands((currentBrands) =>
      currentBrands.map((brand) => {
        if (getBrandRowId(brand) !== rowId) {
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

  const saveBrand = async (brand: FeaturedBrandForm) => {
    if (!brand.title.trim()) {
      toast.error("Brand title is required");
      return;
    }

    if (!brand.logo.trim()) {
      toast.error("Brand logo is required");
      return;
    }

    const productIds = brand.productIds.map((productId) => productId.trim()).filter(Boolean);

    if (new Set(productIds).size !== productIds.length) {
      toast.error("Each selected product must be unique within the brand set");
      return;
    }

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

      setEditingIds((currentIds) => currentIds.filter((id) => id !== getBrandRowId(brand)));
      toast.success(brand.id ? "Featured brand updated" : "Featured brand created");
      await fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to save featured brand");
    }
  };

  const deleteBrand = async (brand: FeaturedBrandForm) => {
    if (!brand.id) {
      setBrands((currentBrands) => currentBrands.filter((item) => item !== brand));
      return;
    }

    try {
      const response = await fetch(`${getRuntimeApiBaseUrl()}/api/featured-brands/${brand.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete featured brand");
      }

      setBrands((currentBrands) => currentBrands.filter((item) => item.id !== brand.id));
      toast.success("Featured brand deleted");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to delete featured brand");
    }
  };

  const moveBrand = (brand: FeaturedBrandForm, direction: "up" | "down") => {
    setBrands((currentBrands) => {
      const currentIndex = currentBrands.findIndex((item) => getBrandRowId(item) === getBrandRowId(brand));
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= currentBrands.length) {
        return currentBrands;
      }

      const nextBrands = [...currentBrands];
      const [movedBrand] = nextBrands.splice(currentIndex, 1);
      nextBrands.splice(targetIndex, 0, movedBrand);

      return nextBrands.map((item, index) => ({
        ...item,
        sortOrder: index,
      }));
    });
  };

  const saveOrder = async () => {
    const existingBrands = brands.filter((brand) => brand.id);

    try {
      setSavingOrder(true);
      await Promise.all(
        existingBrands.map((brand) =>
          fetch(`${getRuntimeApiBaseUrl()}/api/featured-brands/${brand.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: brand.title,
              logo: brand.logo,
              isActive: brand.isActive,
              sortOrder: brand.sortOrder,
              productIds: brand.productIds.map((productId) => productId.trim()).filter(Boolean),
            }),
          }).then(async (response) => {
            if (!response.ok) {
              const responseData = await response.json().catch(() => null);
              throw new Error(responseData?.error || "Failed to save brand order");
            }
          })
        )
      );

      toast.success("Featured brand order saved");
      await fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to save featured brand order");
    } finally {
      setSavingOrder(false);
    }
  };

  const addBrand = () => {
    const nextBrand = createEmptyBrand(brands.length);
    const rowId = getBrandRowId(nextBrand);

    setBrands((currentBrands) => [...currentBrands, nextBrand]);
    setEditingIds((currentIds) => [...currentIds, rowId]);
  };

  const columns: DataTableColumn<FeaturedBrandForm>[] = [
    {
      key: "sort",
      header: "Sort",
      className: "w-24",
      cell: (brand) => {
        const index = brands.findIndex((item) => getBrandRowId(item) === getBrandRowId(brand));

        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => moveBrand(brand, "up")}
              disabled={index <= 0}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Move brand up"
              title="Move up"
            >
              <FaArrowUp />
            </button>
            <button
              type="button"
              onClick={() => moveBrand(brand, "down")}
              disabled={index === brands.length - 1}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Move brand down"
              title="Move down"
            >
              <FaArrowDown />
            </button>
          </div>
        );
      },
    },
    {
      key: "logo",
      header: "Logo",
      className: "min-w-[12rem]",
      cell: (brand) => {
        const rowId = getBrandRowId(brand);
        const isEditing = editingIds.includes(rowId);

        return (
          <div className="flex min-w-0 flex-col gap-2">
            {brand.logo ? (
              <div className="w-fit rounded-md border border-[var(--site-border)] bg-white p-2">
                <Image
                  src={`/${brand.logo}`}
                  alt={brand.title || "Brand logo"}
                  width={112}
                  height={48}
                  className="h-10 w-28 object-contain"
                />
              </div>
            ) : (
              <span className="text-sm text-[var(--site-muted)]">No logo</span>
            )}
            {isEditing ? (
              <>
                <input
                  type="file"
                  className="file-input file-input-bordered file-input-sm w-full max-w-xs"
                  accept="image/*"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];

                    if (!file) {
                      return;
                    }

                    try {
                      const uploaded = await uploadLogo(file);
                      updateBrand(rowId, { logo: uploaded.path });
                      toast.success("Brand logo uploaded");
                    } catch (error: any) {
                      console.error(error);
                      toast.error(error?.message || "Failed to upload brand logo");
                    }
                  }}
                />
                <input
                  type="text"
                  className="input input-bordered input-sm w-full max-w-xs"
                  value={brand.logo}
                  onChange={(event) => updateBrand(rowId, { logo: event.target.value })}
                  placeholder="uploads/logo.webp"
                />
              </>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "title",
      header: "Brand",
      searchableText: (brand) => brand.title,
      className: "min-w-[14rem]",
      cell: (brand) => {
        const rowId = getBrandRowId(brand);

        return editingIds.includes(rowId) ? (
          <input
            type="text"
            className="input input-bordered input-sm w-full"
            value={brand.title}
            onChange={(event) => updateBrand(rowId, { title: event.target.value })}
            placeholder="Logitech, HyperX, ASUS..."
          />
        ) : (
          <div>
            <p className="font-semibold text-[var(--site-text)]">{brand.title || "Untitled brand"}</p>
            <p className="mt-1 text-xs text-[var(--site-muted)]">Sort order: {brand.sortOrder}</p>
          </div>
        );
      },
    },
    {
      key: "products",
      header: "Products",
      searchableText: (brand) =>
        brand.productIds
          .map((productId) => productById.get(productId))
          .filter(Boolean)
          .map((product) => getProductLabel(product as ProductOption))
          .join(" "),
      className: "min-w-[24rem]",
      cell: (brand) => {
        const rowId = getBrandRowId(brand);
        const isEditing = editingIds.includes(rowId);

        if (!isEditing) {
          const selectedProducts = brand.productIds
            .map((productId) => productById.get(productId))
            .filter(Boolean) as ProductOption[];

          return selectedProducts.length > 0 ? (
            <div className="flex flex-col gap-1 text-sm">
              {selectedProducts.map((product, index) => (
                <span key={product.id}>
                  {index + 1}. {getProductLabel(product)}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-sm text-[var(--site-muted)]">No products selected</span>
          );
        }

        return (
          <div className="grid w-full gap-2">
            {Array.from({ length: MAX_PRODUCTS_PER_BRAND }).map((_, slotIndex) => (
              <select
                key={`${rowId}-slot-${slotIndex}`}
                className="select select-bordered select-sm w-full"
                value={brand.productIds[slotIndex] || ""}
                onChange={(event) => updateBrandProductSlot(rowId, slotIndex, event.target.value)}
              >
                <option value="">Slot {slotIndex + 1}: No product selected</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {getProductLabel(product)}
                  </option>
                ))}
              </select>
            ))}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      className: "w-40",
      cell: (brand) => {
        const rowId = getBrandRowId(brand);

        return editingIds.includes(rowId) ? (
          <select
            className="select select-bordered select-sm w-full"
            value={brand.isActive ? "enabled" : "disabled"}
            onChange={(event) => updateBrand(rowId, { isActive: event.target.value === "enabled" })}
          >
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
        ) : (
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              brand.isActive
                ? "bg-green-100 text-green-700"
                : "bg-[var(--site-panel-soft)] text-[var(--site-muted)]"
            }`}
          >
            {brand.isActive ? "Enabled" : "Disabled"}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      className: "w-36",
      cell: (brand) => {
        const rowId = getBrandRowId(brand);
        const isEditing = editingIds.includes(rowId);

        return (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <button
                type="button"
                onClick={() => saveBrand(brand)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--site-accent)] text-white transition hover:bg-[var(--site-accent-strong)]"
                aria-label="Save brand"
                title="Save"
              >
                <FaFloppyDisk />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setEditingIds((currentIds) => [...new Set([...currentIds, rowId])])}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
                aria-label="Edit brand"
                title="Edit"
              >
                <FaPen />
              </button>
            )}
            <button
              type="button"
              onClick={() => deleteBrand(brand)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-500 text-red-500 transition hover:bg-red-500 hover:text-white"
              aria-label="Delete brand"
              title="Delete"
            >
              <FaTrash />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="mx-auto flex max-w-screen-2xl justify-start gap-y-5 bg-[var(--site-bg)] text-[var(--site-text)] xl:h-full max-xl:flex-col">
      <DashboardSidebar />
      <div className="flex w-full flex-col gap-6 xl:ml-5 max-xl:px-5">
        <DataTable
          title="Featured Brands"
          description="Manage the brand strip shown below homepage featured products. Each brand can use any enabled product, not only products marked as featured."
          data={brands}
          columns={columns}
          getRowId={getBrandRowId}
          loading={loading}
          emptyMessage="No featured brand sets yet."
          enableSearch
          searchPlaceholder="Search brands or selected products..."
          tableClassName="min-w-[1180px]"
          actions={
            <>
              <button
                type="button"
                onClick={saveOrder}
                disabled={savingOrder || brands.length === 0}
                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 text-sm font-semibold text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaFloppyDisk />
                {savingOrder ? "Saving..." : "Save order"}
              </button>
              <button
                type="button"
                onClick={addBrand}
                className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--site-accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--site-accent-strong)]"
              >
                <FaPlus />
                Add brand
              </button>
            </>
          }
        />
      </div>
    </div>
  );
}
