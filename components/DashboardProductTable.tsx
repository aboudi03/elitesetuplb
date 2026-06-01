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

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import CustomButton from "./CustomButton";
import apiClient from "@/lib/api";
import { sanitize } from "@/lib/sanitize";
import DataTable, { DataTableColumn } from "./ui/DataTable";
import InlineNumberEdit from "./ui/InlineNumberEdit";
import InlineSelectEdit from "./ui/InlineSelectEdit";
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
    updates: Partial<Pick<Product, "inStock" | "isActive">>
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
      className: "min-w-[96px]",
      cell: (product) => (
        <div className="avatar">
          <div className="mask mask-squircle h-14 w-14">
            <Image
              width={56}
              height={56}
              src={product.mainImage ? `/${product.mainImage}` : "/product_placeholder.jpg"}
              alt={sanitize(product.title) || "Product image"}
              className="h-14 w-14 object-contain"
            />
          </div>
        </div>
      ),
    },
    {
      key: "product",
      header: "Product",
      searchableText: (product) => `${product.title} ${product.manufacturer}`,
      className: "min-w-[320px]",
      cell: (product) => (
        <div>
          <div className="text-lg font-semibold leading-6">{sanitize(product.title)}</div>
          <div className="text-base text-[var(--site-muted)]">
            {sanitize(product.manufacturer)}
          </div>
        </div>
      ),
    },
    {
      key: "stock",
      header: "Stock Availability",
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
      key: "price",
      header: "Price",
      accessor: (product) => `$${product.price}`,
      className: "text-lg font-semibold",
    },
    {
      key: "actions",
      header: "",
      cell: (product) => (
        <Link href={`/admin/products/${product.id}`} className="btn btn-ghost btn-sm">
          details
        </Link>
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
