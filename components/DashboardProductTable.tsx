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
import HoverImagePreview from "./ui/HoverImagePreview";
import ViewActionLink from "./ui/ViewActionLink";
import toast from "react-hot-toast";

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
    updates: Partial<Pick<Product, "inStock" | "isActive" | "featured">>
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
      className: "min-w-[110px]",
      cell: (product) => (
        <HoverImagePreview
          src={product.mainImage ? `/${product.mainImage}` : "/product_placeholder.jpg"}
          alt={sanitize(product.title) || "Product image"}
          thumbnailClassName="mask mask-squircle h-14 w-14 overflow-hidden bg-[var(--site-panel-soft)]"
        />
      ),
    },
    {
      key: "product",
      header: "Product",
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
      className: "min-w-[320px]",
      cell: (product) => (
        <div>
          <div className="text-lg font-semibold leading-6">
            {sanitize(product.title || product.model || "Untitled product")}
          </div>
          <div className="text-sm text-[var(--site-muted)]">
            Model: {sanitize(product.model || "-")}
            {product.sku ? ` | SKU: ${sanitize(product.sku)}` : ""}
          </div>
          <div className="text-sm text-[var(--site-muted)]">
            {product.slug ? `/${sanitize(product.slug)}` : "No slug"}
          </div>
          <div className="text-base text-[var(--site-muted)]">{sanitize(product.manufacturer || "-")}</div>
        </div>
      ),
    },
    {
      key: "merchant",
      header: "Merchant",
      searchableText: (product) => product.merchant?.name || "",
      accessor: (product) => product.merchant?.name || "-",
    },
    {
      key: "category",
      header: "Category",
      searchableText: (product) => product.category?.name || "",
      accessor: (product) => product.category?.name || "Uncategorized",
    },
    {
      key: "stock",
      header: "Stock",
      searchableText: (product) => String(product.inStock),
      className: "min-w-[240px]",
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
      cell: (product) => (
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              product.isActive
                ? "bg-green-100 text-green-700"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {product.isActive ? "On" : "Off"}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
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
      cell: (product) => (
        <div>
          <div className="text-lg font-semibold">${product.price.toFixed(2)}</div>
          <div className="text-sm text-[var(--site-muted)]">Tax: {product.taxRate ?? 0}%</div>
        </div>
      ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      searchableText: (product) => product.updatedAt || "",
      accessor: (product) =>
        product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : "-",
      className: "text-lg font-semibold",
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
        className="xl:ml-5 max-xl:mt-5"
        tableClassName="text-base"
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
