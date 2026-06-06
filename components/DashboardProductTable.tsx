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
import React, { useEffect, useState } from "react";
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

const DashboardProductTable = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  useEffect(() => {
    apiClient
      .get("/api/products?mode=admin", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setProducts(data || []);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => setLoading(false));
  }, []);

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

  const columns: DataTableColumn<Product>[] = [
    {
      key: "image",
      header: "Image",
      className: "w-[72px]",
      cell: (product) => (
        <HoverImagePreview
          src={product.mainImage ? `/${product.mainImage}` : "/product_placeholder.jpg"}
          alt={sanitize(product.title) || "Product image"}
          thumbnailClassName="mask mask-squircle h-12 w-12 overflow-hidden bg-[var(--site-panel-soft)]"
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
          <div className="min-w-0 text-sm font-semibold leading-5" title={sanitize(product.title || product.model || "Untitled product")}>
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
          </div>
          <div className="truncate text-xs text-[var(--site-muted)]">{sanitize(product.manufacturer || "-")}</div>
        </div>
      ),
    },
    {
      key: "model",
      header: "Model",
      searchableText: (product) => product.model || "",
      className: "w-[190px] min-w-0",
      cell: (product) => (
        <div className="min-w-0 text-sm" title={sanitize(product.model || "-")}>
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
        </div>
      ),
    },
    {
      key: "sku",
      header: "SKU",
      searchableText: (product) => product.sku || "",
      className: "w-[110px] min-w-0",
      cell: (product) => (
        <div className="min-w-0 text-sm" title={sanitize(product.sku || "-")}>
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
        </div>
      ),
    },
    {
      key: "merchant",
      header: "Merchant",
      searchableText: (product) => product.merchant?.name || "",
      accessor: (product) => product.merchant?.name || "-",
      className: "w-[110px] text-sm",
    },
    {
      key: "category",
      header: "Category",
      searchableText: (product) => product.category?.name || "",
      accessor: (product) => product.category?.name || "Uncategorized",
      className: "w-[120px] text-sm",
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
      searchableText: (product) => `${product.price} ${product.taxRate ?? 0}`,
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
        </div>
      ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      searchableText: (product) => product.updatedAt || "",
      accessor: (product) =>
        product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : "-",
      className: "w-[86px] text-sm font-semibold",
    },
    {
      key: "actions",
      header: "",
      cell: (product) => (
        <ViewActionLink href={`/admin/products/${product.id}`} label="View product details" />
      ),
    },
  ];

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
        searchPlaceholder="Search products..."
        className="w-full"
        tableClassName="table-fixed text-sm"
        actions={
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
        }
      />
    </div>
  );
};

export default DashboardProductTable;
