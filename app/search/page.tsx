import { ProductItem, SectionTitle } from "@/components";
import apiClient from "@/lib/api";
import type { Metadata } from "next";
import React from "react";
import { sanitize } from "@/lib/sanitize";
import MetaSearchEvent from "@/components/MetaSearchEvent";

interface Props {
  searchParams: { search: string };
}

export const metadata: Metadata = {
  title: "Search",
  robots: {
    index: false,
    follow: true,
  },
};

// sending api request for search results for a given search text
const SearchPage = async ({ searchParams }: Props) => {
  const sp = await searchParams;
  let products = [];

  try {
    const data = await apiClient.get(
      `/api/search?query=${sp?.search || ""}`
    );

    if (!data.ok) {
      console.error('Failed to fetch search results:', data.statusText);
      products = [];
    } else {
      const result = await data.json();
      products = Array.isArray(result) ? result : [];
    }
  } catch (error) {
    console.error('Error fetching search results:', error);
    products = [];
  }

  return (
    <div>
      {sp?.search && <MetaSearchEvent searchString={sp.search} />}
      <SectionTitle title="Search" path="Home | Search" />
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        {sp?.search && (
          <h3 className="break-words py-8 text-center text-2xl font-semibold max-sm:py-6 max-sm:text-xl">
            Showing results for {sanitize(sp?.search)}
          </h3>
        )}
        <div className="grid grid-cols-4 gap-4 max-[1300px]:grid-cols-3 max-lg:grid-cols-2 max-[500px]:grid-cols-1">
          {products.length > 0 ? (
            products.map((product: any) => (
              <ProductItem key={product.id} product={product} color="black" />
            ))
          ) : (
            <h3 className="mt-4 w-full col-span-full text-center text-xl font-medium max-[1000px]:text-lg max-[500px]:text-base">
              No products found for specified query
            </h3>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;

/*

*/
