"use client";

// *********************
// Role of the component: Product table component on admin dashboard page
// Name of the component: DashboardProductTable.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <DashboardProductTable />
// Input parameters: no input parameters
// Output: products table
// *********************

import Link from "next/link";
import React, { useDeferredValue, useEffect, useState } from "react";
import CustomButton from "./CustomButton";
import apiClient from "@/lib/api";
import { sanitize } from "@/lib/sanitize";
import DataTable, { DataTableColumn } from "./ui/DataTable";
import InlineNumberEdit from "./ui/InlineNumberEdit";
import InlineSelectEdit from "./ui/InlineSelectEdit";
import InlineTextEdit from "./ui/InlineTextEdit";
import HoverImagePreview from "./ui/HoverImagePreview";
import ViewActionLink from "./ui/ViewActionLink";
import toast from "react-hot-toast";
import Image from "next/image";
import { FaGripVertical, FaLink, FaTag, FaXmark } from "react-icons/fa6";

function truncateWords(value: string | null | undefined, limit = 4) {
  const words = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length <= limit) {
    return words.join(" ");
  }

  return `${words.slice(0, limit).join(" ")}...`;
}

function HoverCellText({
  value,
  children,
  className = "",
}: {
  value: string | null | undefined;
  children?: React.ReactNode;
  className?: string;
}) {
  const fullText = sanitize(value || "-");

  return (
    <span className={`group/celltext relative inline-flex min-w-0 max-w-full ${className}`}>
      {children || <span className="block min-w-0 truncate">{fullText}</span>}
      <span className="pointer-events-none absolute left-0 top-full z-50 mt-2 hidden max-w-[360px] whitespace-normal break-words rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] px-3 py-2 text-sm font-semibold leading-5 text-[var(--site-text)] shadow-[0_20px_50px_rgba(15,23,42,0.22)] group-hover/celltext:block">
        {fullText}
      </span>
    </span>
  );
}

const DashboardProductTable = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [isFeaturedOrderDialogOpen, setIsFeaturedOrderDialogOpen] = useState(false);
  const [featuredDraftProducts, setFeaturedDraftProducts] = useState<Product[]>([]);
  const [draggedFeaturedProductId, setDraggedFeaturedProductId] = useState<string | null>(null);
  const [isSavingFeaturedOrder, setIsSavingFeaturedOrder] = useState(false);
  const [saleProduct, setSaleProduct] = useState<Product | null>(null);
  const [salePriceDraft, setSalePriceDraft] = useState("");
  const [isSavingSale, setIsSavingSale] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [merchantFilter, setMerchantFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [minPriceFilter, setMinPriceFilter] = useState("");
  const [maxPriceFilter, setMaxPriceFilter] = useState("");
  const [sortValue, setSortValue] = useState("updatedAt:desc");
  const deferredSearch = useDeferredValue(search);

  const loadProducts = async () => {
    setLoading(true);

    try {
      const [sortBy, sortDirection] = sortValue.split(":");
      const params = new URLSearchParams();

      params.set("mode", "admin");
      params.set("sortBy", sortBy || "updatedAt");
      params.set("sortDirection", sortDirection || "desc");

      if (deferredSearch.trim()) {
        params.set("search", deferredSearch.trim());
      }

      if (categoryFilter !== "all") {
        params.set("categoryId", categoryFilter);
      }

      if (merchantFilter !== "all") {
        params.set("merchantId", merchantFilter);
      }

      if (featuredFilter !== "all") {
        params.set("featured", featuredFilter);
      }

      if (visibilityFilter !== "all") {
        params.set("isActive", visibilityFilter);
      }

      if (stockFilter !== "all") {
        params.set("stockStatus", stockFilter);
      }

      if (minPriceFilter.trim()) {
        params.set("minPrice", minPriceFilter.trim());
      }

      if (maxPriceFilter.trim()) {
        params.set("maxPrice", maxPriceFilter.trim());
      }

      const response = await apiClient.get(`/api/products?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.details || data?.error || "Failed to load products");
      }

      setProducts(Array.isArray(data) ? data : data?.products || []);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [
    categoryFilter,
    deferredSearch,
    featuredFilter,
    maxPriceFilter,
    merchantFilter,
    minPriceFilter,
    sortValue,
    stockFilter,
    visibilityFilter,
  ]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [categoriesResponse, merchantsResponse] = await Promise.all([
          apiClient.get("/api/categories"),
          apiClient.get("/api/merchants"),
        ]);

        const [categoriesData, merchantsData] = await Promise.all([
          categoriesResponse.json(),
          merchantsResponse.json(),
        ]);

        if (categoriesResponse.ok) {
          setCategories(categoriesData || []);
        }

        if (merchantsResponse.ok) {
          setMerchants(merchantsData || []);
        }
      } catch (error) {
        console.error("Failed to load product filters:", error);
      }
    };

    loadFilterOptions();
  }, []);

  const getSortedFeaturedProducts = (productList: Product[]) =>
    productList
      .filter((product) => product.featured)
      .sort((firstProduct, secondProduct) => {
        const firstOrder = firstProduct.featuredSortOrder ?? Number.MAX_SAFE_INTEGER;
        const secondOrder = secondProduct.featuredSortOrder ?? Number.MAX_SAFE_INTEGER;

        if (firstOrder !== secondOrder) {
          return firstOrder - secondOrder;
        }

        return (firstProduct.title || firstProduct.model || "").localeCompare(
          secondProduct.title || secondProduct.model || ""
        );
      });

  const openFeaturedOrderDialog = () => {
    setFeaturedDraftProducts(getSortedFeaturedProducts(products));
    setIsFeaturedOrderDialogOpen(true);
  };

  const closeFeaturedOrderDialog = () => {
    if (isSavingFeaturedOrder) return;
    setIsFeaturedOrderDialogOpen(false);
    setDraggedFeaturedProductId(null);
  };

  const moveFeaturedDraftProduct = (draggedId: string, targetId: string) => {
    if (!draggedId || draggedId === targetId) return;

    setFeaturedDraftProducts((currentProducts) => {
      const nextProducts = [...currentProducts];
      const draggedIndex = nextProducts.findIndex((product) => product.id === draggedId);
      const targetIndex = nextProducts.findIndex((product) => product.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) {
        return currentProducts;
      }

      const [draggedProduct] = nextProducts.splice(draggedIndex, 1);
      nextProducts.splice(targetIndex, 0, draggedProduct);
      return nextProducts;
    });
  };

  const removeFeaturedDraftProduct = (productId: string) => {
    setFeaturedDraftProducts((currentProducts) =>
      currentProducts.filter((product) => product.id !== productId)
    );
  };

  const saveFeaturedOrder = async () => {
    setIsSavingFeaturedOrder(true);

    try {
      const response = await apiClient.put("/api/products/featured-order", {
        productIds: featuredDraftProducts.map((product) => product.id),
      });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.details || responseData?.error || "Failed to save featured order");
      }

      setProducts((currentProducts) =>
        currentProducts.map((product) => {
          const reorderedProduct = responseData.find((current: Product) => current.id === product.id);
          return reorderedProduct ? { ...product, ...reorderedProduct } : product;
        })
      );
      setFeaturedDraftProducts(responseData);
      setIsFeaturedOrderDialogOpen(false);
      setDraggedFeaturedProductId(null);
      await loadProducts();
      toast.success("Featured product order updated");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save featured order");
    } finally {
      setIsSavingFeaturedOrder(false);
    }
  };

  const getTargetProducts = (product: Product) =>
    selectedProductIds.includes(product.id)
      ? products.filter((currentProduct) => selectedProductIds.includes(currentProduct.id))
      : [product];

  const updateProducts = async (
    targetProducts: Product[],
    updates: Partial<
      Pick<
        Product,
        "inStock" | "isActive" | "featured" | "title" | "model" | "sku" | "price"
        | "salePrice"
        | "cost"
      >
    >
  ) => {
    const updatedProducts = await Promise.all(
      targetProducts.map(async (product) => {
        const payload = {
          ...product,
          ...updates,
        };

        const response = await apiClient.put(`/api/products/${product.id}`, payload);
        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData?.details || responseData?.error || "Failed to update product");
        }

        return responseData;
      })
    );

    setProducts((currentProducts) =>
      currentProducts.map((currentProduct) => {
        const updatedProduct = updatedProducts.find(
          (product) => product.id === currentProduct.id
        );
        return updatedProduct ? { ...currentProduct, ...updatedProduct } : currentProduct;
      })
    );
  };

  const openSaleDialog = (product: Product) => {
    setSaleProduct(product);
    setSalePriceDraft(product.salePrice ? String(product.salePrice) : "");
  };

  const closeSaleDialog = () => {
    if (isSavingSale) return;
    setSaleProduct(null);
    setSalePriceDraft("");
  };

  const saveSalePrice = async () => {
    if (!saleProduct) return;

    const nextSalePrice = Number(salePriceDraft);
    if (!Number.isFinite(nextSalePrice) || nextSalePrice <= 0) {
      toast.error("Enter a sale price greater than 0");
      return;
    }
    if (nextSalePrice >= saleProduct.price) {
      toast.error("Sale price must be lower than the regular price");
      return;
    }

    setIsSavingSale(true);
    try {
      await updateProducts([saleProduct], { salePrice: nextSalePrice });
      toast.success("Sale price saved");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save sale price");
    } finally {
      setIsSavingSale(false);
      setSaleProduct(null);
      setSalePriceDraft("");
    }
  };

  const removeSalePrice = async () => {
    if (!saleProduct) return;

    setIsSavingSale(true);
    try {
      await updateProducts([saleProduct], { salePrice: null });
      toast.success("Sale removed");
    } catch (error: any) {
      toast.error(error?.message || "Failed to remove sale");
    } finally {
      setIsSavingSale(false);
      setSaleProduct(null);
      setSalePriceDraft("");
    }
  };

  const columns: DataTableColumn<Product>[] = [
    {
      key: "image",
      header: "Image",
      className: "w-[112px]",
      cell: (product) => (
        <HoverImagePreview
          src={product.mainImage ? `/${product.mainImage}` : "/product_placeholder.webp"}
          alt={sanitize(product.title) || "Product image"}
          thumbnailClassName="mask mask-squircle h-20 w-20 overflow-hidden bg-[var(--site-panel-soft)]"
          previewSize={560}
        />
      ),
    },
    {
      key: "name",
      header: "Name",
      searchableText: (product) =>
        [
          product.title,
          product.model,
          product.sku,
          product.manufacturer,
          product.slug,
          product.category?.name,
          product.merchant?.name,
        ]
          .filter(Boolean)
          .join(" "),
      className: "w-[190px] min-w-0",
      cell: (product) => (
        <div className="min-w-0 space-y-1">
          <div className="min-w-0 text-sm font-semibold leading-5">
            <HoverCellText value={product.title || product.model || "Untitled product"}>
              <InlineTextEdit
                value={product.title || ""}
                displayValue={truncateWords(sanitize(product.title || product.model || "Untitled product"))}
                label={`${sanitize(product.model || product.title || "product")} title`}
                inputClassName="min-w-[11rem] text-left"
                onConfirm={async (nextTitle) => {
                  await updateProducts([product], { title: nextTitle });
                  toast.success("Title updated");
                }}
              />
            </HoverCellText>
          </div>
          <HoverCellText value={product.manufacturer || "-"} className="text-xs text-[var(--site-muted)]">
            <span className="block min-w-0 truncate">{sanitize(product.manufacturer || "-")}</span>
          </HoverCellText>
        </div>
      ),
    },
    {
      key: "model",
      header: "Model",
      searchableText: (product) => product.model || "",
      className: "w-[190px] min-w-0",
      cell: (product) => (
        <div className="min-w-0 text-sm">
          <HoverCellText value={product.model || "-"}>
            <InlineTextEdit
              value={product.model || ""}
              displayValue={truncateWords(sanitize(product.model || "-"))}
              label={`${sanitize(product.title || product.model || "product")} model`}
              inputClassName="min-w-[11rem] text-left"
              onConfirm={async (nextModel) => {
                await updateProducts([product], { model: nextModel });
                toast.success("Model updated");
              }}
            />
          </HoverCellText>
        </div>
      ),
    },
    {
      key: "sku",
      header: "SKU",
      searchableText: (product) => product.sku || "",
      className: "w-[110px] min-w-0",
      cell: (product) => (
        <div className="min-w-0 text-sm">
          <HoverCellText value={product.sku || "-"}>
            <InlineTextEdit
              value={product.sku || ""}
              displayValue={sanitize(product.sku || "-")}
              label={`${sanitize(product.title || product.model || "product")} sku`}
              inputClassName="min-w-[7rem] text-left"
              onConfirm={async (nextSku) => {
                await updateProducts([product], { sku: nextSku || null });
                toast.success("SKU updated");
              }}
            />
          </HoverCellText>
        </div>
      ),
    },
    {
      key: "merchant",
      header: "Merchant",
      searchableText: (product) => product.merchant?.name || "",
      className: "w-[110px] text-sm",
      cell: (product) => <HoverCellText value={product.merchant?.name || "-"} />,
    },
    {
      key: "category",
      header: "Category",
      searchableText: (product) => product.category?.name || "",
      className: "w-[120px] text-sm",
      cell: (product) => <HoverCellText value={product.category?.name || "Uncategorized"} />,
    },
    {
      key: "stock",
      header: "Stock",
      searchableText: (product) => String(product.inStock),
      className: "w-[108px]",
      cell: (product) => (
        <InlineNumberEdit
          value={product.inStock}
          label={`${sanitize(product.title)} stock`}
          min={0}
          onConfirm={async (nextStock) => {
            const targetProducts = getTargetProducts(product);
            await updateProducts(targetProducts, { inStock: nextStock });
            toast.success(
              targetProducts.length > 1
                ? `Stock updated for ${targetProducts.length} products`
                : "Stock updated"
            );
          }}
        />
      ),
    },
    {
      key: "featuredOrder",
      header: "Feature order",
      searchableText: (product) =>
        product.featured ? `feature order ${product.featuredSortOrder || ""}` : "not featured",
      className: "w-[104px]",
      cell: (product) =>
        product.featured ? (
          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
            #{product.featuredSortOrder || "-"}
          </span>
        ) : (
          <span className="text-xs text-[var(--site-muted)]">-</span>
        ),
    },
    {
      key: "featured",
      header: "Featured",
      searchableText: (product) => (product.featured ? "featured yes" : "featured no"),
      className: "w-[88px]",
      cell: (product) => (
        <InlineSelectEdit
          value={product.featured ? "yes" : "no"}
          displayValue={product.featured ? "Yes" : "No"}
          options={[
            { label: "No", value: "no" },
            { label: "Yes", value: "yes" },
          ]}
          onChange={async (value) => {
            const targetProducts = getTargetProducts(product);
            await updateProducts(targetProducts, { featured: value === "yes" });
            await loadProducts();
            toast.success(
              targetProducts.length > 1
                ? `Featured state updated for ${targetProducts.length} products`
                : "Featured state updated"
            );
          }}
        />
      ),
    },
    {
      key: "visibility",
      header: "Visibility",
      searchableText: (product) => (product.isActive ? "enabled" : "disabled"),
      className: "w-[96px]",
      cell: (product) => (
        <InlineSelectEdit
          value={product.isActive ? "enabled" : "disabled"}
          displayValue={product.isActive ? "Enabled" : "Disabled"}
          options={[
            { label: "Enabled", value: "enabled" },
            { label: "Disabled", value: "disabled" },
          ]}
          onChange={async (value) => {
            const targetProducts = getTargetProducts(product);
            await updateProducts(targetProducts, { isActive: value === "enabled" });
            toast.success(
              targetProducts.length > 1
                ? `Visibility updated for ${targetProducts.length} products`
                : "Visibility updated"
            );
          }}
        />
      ),
    },
    {
      key: "status",
      header: "Storefront",
      searchableText: (product) =>
        `${product.isActive ? "enabled" : "disabled"} ${product.featured ? "featured" : "standard"}`,
      className: "w-[108px]",
      cell: (product) => (
        <div className="flex flex-wrap gap-1.5">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              product.isActive
                ? "bg-green-100 text-green-700"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {product.isActive ? "On" : "Off"}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              product.featured
                ? "bg-amber-100 text-amber-700"
                : "bg-[var(--site-panel-soft)] text-[var(--site-muted)]"
            }`}
          >
            {product.featured ? "Featured" : "Standard"}
          </span>
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      searchableText: (product) => `${product.price} ${product.cost ?? 0} ${product.taxRate ?? 0}`,
      className: "w-[96px]",
      cell: (product) => (
        <div className="space-y-1">
          <div className="text-base font-semibold">
            <InlineTextEdit
              value={String(product.price)}
              displayValue={`$${product.price.toFixed(2)}`}
              label={`${sanitize(product.title || product.model || "product")} price`}
              type="number"
              min={0}
              step={0.01}
              inputClassName="min-w-[8rem]"
              onConfirm={async (nextPrice) => {
                await updateProducts([product], { price: Number(nextPrice) });
                toast.success("Price updated");
              }}
            />
          </div>
          <div className="text-xs text-[var(--site-muted)]">Tax: {product.taxRate ?? 0}%</div>
          {product.salePrice ? (
            <div className="text-xs font-bold text-red-600">
              Sale: ${product.salePrice.toFixed(2)}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: "cost",
      header: "Cost",
      searchableText: (product) => String(product.cost ?? 0),
      className: "w-[96px]",
      cell: (product) => (
        <InlineTextEdit
          value={String(product.cost ?? 0)}
          displayValue={`$${Number(product.cost || 0).toFixed(2)}`}
          label={`${sanitize(product.title || product.model || "product")} cost`}
          type="number"
          min={0}
          step={0.01}
          inputClassName="min-w-[8rem]"
          onConfirm={async (nextCost) => {
            await updateProducts([product], { cost: Math.max(0, Number(nextCost) || 0) });
            toast.success("Cost updated");
          }}
        />
      ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      searchableText: (product) => product.updatedAt || "",
      className: "w-[86px] text-sm font-semibold",
      cell: (product) => (
        <HoverCellText
          value={product.updatedAt ? new Date(product.updatedAt).toLocaleString() : "-"}
        >
          <span>{product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : "-"}</span>
        </HoverCellText>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (product) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openSaleDialog(product)}
            aria-label={`Set sale price for ${sanitize(product.title || product.model || "product")}`}
            title="Sale"
            className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md border px-2.5 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-red-100 ${
              product.salePrice
                ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                : "border-[var(--site-border)] bg-[var(--site-panel-soft)] text-[var(--site-text)] hover:border-red-300 hover:text-red-600"
            }`}
          >
            <FaTag aria-hidden="true" />
            Sale
          </button>
          <ViewActionLink href={`/admin/products/${product.id}`} label="View product details" />
          <Link
            href={`/product/${encodeURIComponent(product.slug || product.id)}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Open storefront product page"
            title="Open storefront product page"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:bg-[var(--site-accent-soft)] hover:text-[var(--site-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--site-accent-soft)]"
          >
            <FaLink aria-hidden="true" className="text-base" />
            <span className="sr-only">Open storefront product page</span>
          </Link>
        </div>
      ),
    },
  ];

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setMerchantFilter("all");
    setFeaturedFilter("all");
    setVisibilityFilter("all");
    setStockFilter("all");
    setMinPriceFilter("");
    setMaxPriceFilter("");
    setSortValue("updatedAt:desc");
  };

  return (
    <div className="w-full">
      <DataTable
        title="All products"
        data={products}
        columns={columns}
        getRowId={(product) => product.id}
        loading={loading}
        emptyMessage="No products found."
        enableSelection
        selectedIds={selectedProductIds}
        onSelectionChange={setSelectedProductIds}
        enableSearch
        searchValue={search}
        onSearchChange={setSearch}
        autoFilter={false}
        searchPlaceholder="Search products..."
        className="w-full"
        tableClassName="table-fixed text-sm"
        actions={
          <div className="flex flex-wrap gap-3">
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="min-h-11 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 text-sm"
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              value={merchantFilter}
              onChange={(event) => setMerchantFilter(event.target.value)}
              className="min-h-11 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 text-sm"
            >
              <option value="all">All merchants</option>
              {merchants.map((merchant) => (
                <option key={merchant.id} value={merchant.id}>
                  {merchant.name}
                </option>
              ))}
            </select>
            <select
              value={featuredFilter}
              onChange={(event) => setFeaturedFilter(event.target.value)}
              className="min-h-11 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 text-sm"
            >
              <option value="all">Featured: all</option>
              <option value="true">Featured only</option>
              <option value="false">Standard only</option>
            </select>
            <select
              value={visibilityFilter}
              onChange={(event) => setVisibilityFilter(event.target.value)}
              className="min-h-11 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 text-sm"
            >
              <option value="all">Visibility: all</option>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
            <select
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value)}
              className="min-h-11 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 text-sm"
            >
              <option value="all">Stock: all</option>
              <option value="in">In stock</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
            <input
              type="number"
              min="0"
              value={minPriceFilter}
              onChange={(event) => setMinPriceFilter(event.target.value)}
              placeholder="Min price"
              className="min-h-11 w-28 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 text-sm"
            />
            <input
              type="number"
              min="0"
              value={maxPriceFilter}
              onChange={(event) => setMaxPriceFilter(event.target.value)}
              placeholder="Max price"
              className="min-h-11 w-28 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 text-sm"
            />
            <select
              value={sortValue}
              onChange={(event) => setSortValue(event.target.value)}
              className="min-h-11 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 text-sm"
            >
              <option value="updatedAt:desc">Recently updated</option>
              <option value="updatedAt:asc">Oldest updated</option>
              <option value="title:asc">Name A-Z</option>
              <option value="title:desc">Name Z-A</option>
              <option value="price:desc">Price high to low</option>
              <option value="price:asc">Price low to high</option>
              <option value="inStock:desc">Stock high to low</option>
              <option value="inStock:asc">Stock low to high</option>
              <option value="featuredSortOrder:asc">Featured order</option>
              <option value="merchant:asc">Merchant A-Z</option>
              <option value="category:asc">Category A-Z</option>
            </select>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 text-sm font-semibold text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={openFeaturedOrderDialog}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 text-sm font-semibold text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
            >
              Order featured products
            </button>
            <span className="inline-flex min-h-11 items-center rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700">
              Products: {products.length}
            </span>
            <Link href="/admin/products/new">
              <CustomButton
                buttonType="button"
                customWidth="110px"
                paddingX={10}
                paddingY={5}
                textSize="base"
                text="Add new product"
              />
            </Link>
          </div>
        }
      />
      {saleProduct && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/55 px-4 py-6">
          <div className="w-full max-w-md rounded-3xl border border-[var(--site-border)] bg-[var(--site-panel)] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-[var(--site-text)]">Product sale</h2>
                <p className="mt-2 text-sm text-[var(--site-muted)]">
                  {sanitize(saleProduct.title || saleProduct.model || "Product")}
                </p>
              </div>
              <button
                type="button"
                onClick={closeSaleDialog}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)]"
                aria-label="Close sale dialog"
              >
                <FaXmark />
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] p-4">
              <p className="text-sm text-[var(--site-muted)]">Regular price</p>
              <p className="mt-1 text-xl font-black text-[var(--site-text)]">
                ${saleProduct.price.toFixed(2)}
              </p>
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">
                New sale price
              </span>
              <input
                type="number"
                min="0.01"
                max={Math.max(0.01, saleProduct.price - 0.01)}
                step="0.01"
                value={salePriceDraft}
                onChange={(event) => setSalePriceDraft(event.target.value)}
                placeholder="Enter exact new price"
                autoFocus
                className="min-h-12 w-full rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 text-lg font-bold outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </label>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              {saleProduct.salePrice ? (
                <button
                  type="button"
                  onClick={removeSalePrice}
                  disabled={isSavingSale}
                  className="mr-auto min-h-11 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-600 disabled:opacity-60"
                >
                  Remove sale
                </button>
              ) : null}
              <button
                type="button"
                onClick={closeSaleDialog}
                disabled={isSavingSale}
                className="min-h-11 rounded-xl border border-[var(--site-border)] px-4 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveSalePrice}
                disabled={isSavingSale}
                className="min-h-11 rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {isSavingSale ? "Saving..." : "Save sale"}
              </button>
            </div>
          </div>
        </div>
      )}
      {isFeaturedOrderDialogOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/55 px-4 py-6">
          <div className="w-full max-w-3xl rounded-3xl border border-[var(--site-border)] bg-[var(--site-panel)] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--site-border)] px-6 py-5">
              <div>
                <h2 className="text-2xl font-semibold text-[var(--site-text)]">Featured order</h2>
                <p className="mt-2 text-sm text-[var(--site-muted)]">
                  Drag products into the exact order they should appear on the main page. Maximum 14 featured products.
                </p>
              </div>
              <button
                type="button"
                onClick={closeFeaturedOrderDialog}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
                aria-label="Close featured order dialog"
              >
                <FaXmark />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              <div className="mb-4 flex items-center justify-between rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 py-3 text-sm text-[var(--site-muted)]">
                <span>{featuredDraftProducts.length} / 14 featured products selected</span>
                <span>Drag and drop to reorder</span>
              </div>

              <div className="space-y-3">
                {featuredDraftProducts.length > 0 ? (
                  featuredDraftProducts.map((product, index) => (
                    <div
                      key={product.id}
                      draggable
                      onDragStart={() => setDraggedFeaturedProductId(product.id)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => {
                        if (draggedFeaturedProductId) {
                          moveFeaturedDraftProduct(draggedFeaturedProductId, product.id);
                        }
                      }}
                      onDragEnd={() => setDraggedFeaturedProductId(null)}
                      className={`flex items-center gap-4 rounded-2xl border px-4 py-3 transition ${
                        draggedFeaturedProductId === product.id
                          ? "border-[var(--site-accent)] bg-[var(--site-accent-soft)]"
                          : "border-[var(--site-border)] bg-[var(--site-panel-soft)]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex min-w-10 justify-center rounded-xl border border-[var(--site-border)] bg-[var(--site-panel)] px-3 py-2 text-sm font-bold text-[var(--site-text)]">
                          {index + 1}
                        </span>
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--site-border)] bg-[var(--site-panel)] text-[var(--site-muted)]">
                          <FaGripVertical />
                        </span>
                      </div>
                      <div className="overflow-hidden rounded-xl border border-[var(--site-border)] bg-[var(--site-panel)]">
                        <Image
                          src={product.mainImage ? `/${product.mainImage}` : "/product_placeholder.webp"}
                          alt={sanitize(product.title || product.model || "Featured product")}
                          width={64}
                          height={64}
                          className="h-16 w-16 object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-[var(--site-text)]">
                          {sanitize(product.title || product.model || "Untitled product")}
                        </p>
                        <p className="mt-1 truncate text-sm text-[var(--site-muted)]">
                          {sanitize(product.model || "-")} {product.sku ? `| SKU: ${sanitize(product.sku)}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeFeaturedDraftProduct(product.id);
                        }}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition hover:border-red-400 hover:bg-red-100"
                        aria-label={`Remove ${sanitize(product.title || product.model || "product")} from featured`}
                      >
                        <FaXmark />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 py-8 text-center text-sm text-[var(--site-muted)]">
                    No featured products selected yet.
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--site-border)] px-6 py-5">
              <button
                type="button"
                onClick={closeFeaturedOrderDialog}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-5 text-sm font-semibold text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveFeaturedOrder}
                disabled={isSavingFeaturedOrder}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--site-accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--site-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingFeaturedOrder ? "Saving..." : "Save featured order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardProductTable;
