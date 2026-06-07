// *********************
// Role of the component: Showing products on the shop page with applied filter and sort
// Name of the component: Products.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <Products params={params} searchParams={searchParams} />
// Input parameters: { params, searchParams }: { params: { slug?: string[] }, searchParams: { [key: string]: string | string[] | undefined } }
// Output: products grid
// *********************

import React from "react";
import apiClient from "@/lib/api";
import ProductResultsBrowser from "./ProductResultsBrowser";

export async function getProductsPageData({
  params,
  searchParams,
}: {
  params: { slug?: string[] };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // getting all data from URL slug and preparing everything for sending GET request
  const showInStock = searchParams?.inStock !== "false";
  const showOutOfStock = searchParams?.outOfStock !== "false";
  const page = searchParams?.page ? Number(searchParams?.page) : 1;

  let products = [];
  let totalPages = 1;

  try {
    const queryParts = [
      `filters[price][$lte]=${encodeURIComponent(String(searchParams?.price || 3000))}`,
      `filters[rating][$gte]=${encodeURIComponent(String(Number(searchParams?.rating) || 0))}`,
      `sort=${encodeURIComponent(String(searchParams?.sort || "defaultSort"))}`,
      `page=${encodeURIComponent(String(page))}`,
      "includePagination=true",
    ];

    if (showInStock && !showOutOfStock) {
      queryParts.push("filters[inStock][$gt]=0");
    }

    if (!showInStock && showOutOfStock) {
      queryParts.push("filters[inStock][$equals]=0");
    }

    if (params?.slug?.[0]) {
      queryParts.push(`filters[category][$equals]=${encodeURIComponent(params.slug[0])}`);
    }

    // sending API request with filtering, sorting and pagination for getting all products
    const data = await apiClient.get(`/api/products?${queryParts.join("&")}`);

    if (!data.ok) {
      console.error('Failed to fetch products:', data.statusText);
      products = [];
    } else {
      const result = await data.json();
      products = Array.isArray(result?.products) ? result.products : [];
      totalPages = Number(result?.pagination?.totalPages) > 0 ? Number(result.pagination.totalPages) : 1;
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    products = [];
  }

  return {
    products,
    totalPages,
  };
}

const Products = async ({
  params,
  searchParams,
  data,
}: {
  params: { slug?: string[] };
  searchParams: { [key: string]: string | string[] | undefined };
  data?: { products: any[]; totalPages: number };
}) => {
  const resolvedData = data || (await getProductsPageData({ params, searchParams }));
  const products = resolvedData.products;

  return <ProductResultsBrowser products={products as Product[]} />;
};

export default Products;
