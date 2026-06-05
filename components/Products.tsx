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
import ProductItem from "./ProductItem";
import apiClient from "@/lib/api";

const Products = async ({ params, searchParams }: { params: { slug?: string[] }, searchParams: { [key: string]: string | string[] | undefined } }) => {
  // getting all data from URL slug and preparing everything for sending GET request
  const showInStock = searchParams?.inStock !== "false";
  const showOutOfStock = searchParams?.outOfStock !== "false";
  const page = searchParams?.page ? Number(searchParams?.page) : 1;

  let products = [];

  try {
    const queryParts = [
      `filters[price][$lte]=${encodeURIComponent(String(searchParams?.price || 3000))}`,
      `filters[rating][$gte]=${encodeURIComponent(String(Number(searchParams?.rating) || 0))}`,
      `sort=${encodeURIComponent(String(searchParams?.sort || "defaultSort"))}`,
      `page=${encodeURIComponent(String(page))}`,
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
      products = Array.isArray(result) ? result : [];
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    products = [];
  }

  return (
    <div className="grid grid-cols-3 gap-4 max-[1300px]:grid-cols-3 max-lg:grid-cols-2 max-[500px]:grid-cols-1">
      {products.length > 0 ? (
        products.map((product: any) => (
          <ProductItem key={product.id} product={product} color="black" />
        ))
      ) : (
        <h3 className="col-span-full mt-6 w-full text-center text-xl max-[500px]:text-base">
          No products found for specified query
        </h3>
      )}
    </div>
  );
};

export default Products;
