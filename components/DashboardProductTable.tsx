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

const DashboardProductTable = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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

  const columns: DataTableColumn<Product>[] = [
    {
      key: "product",
      header: "Product",
      searchableText: (product) => `${product.title} ${product.manufacturer}`,
      cell: (product) => (
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="mask mask-squircle h-12 w-12">
              <Image
                width={48}
                height={48}
                src={product.mainImage ? `/${product.mainImage}` : "/product_placeholder.jpg"}
                alt={sanitize(product.title) || "Product image"}
                className="h-12 w-12 object-contain"
              />
            </div>
          </div>
          <div>
            <div className="font-bold">{sanitize(product.title)}</div>
            <div className="text-sm text-[var(--site-muted)]">
              {sanitize(product.manufacturer)}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "stock",
      header: "Stock Availability",
      searchableText: (product) => String(product.inStock),
      cell: (product) =>
        product.inStock > 0 ? (
          <span className="badge badge-success text-white badge-sm">
            {product.inStock} in stock
          </span>
        ) : (
          <span className="badge badge-error text-white badge-sm">Out of stock</span>
        ),
    },
    {
      key: "visibility",
      header: "Visibility",
      searchableText: (product) => (product.isActive ? "enabled" : "disabled"),
      cell: (product) =>
        product.isActive ? (
          <span className="badge badge-success text-white badge-sm">Enabled</span>
        ) : (
          <span className="badge badge-warning text-black badge-sm">Disabled</span>
        ),
    },
    {
      key: "price",
      header: "Price",
      accessor: (product) => `$${product.price}`,
    },
    {
      key: "actions",
      header: "",
      cell: (product) => (
        <Link href={`/admin/products/${product.id}`} className="btn btn-ghost btn-xs">
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
        enableSearch
        searchPlaceholder="Search products..."
        className="xl:ml-5 max-xl:mt-5"
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
