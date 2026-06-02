export const dynamic = "force-dynamic";
export const revalidate = 0;

import {
  Breadcrumb,
  Filters,
  Pagination,
  Products,
  SortBy,
} from "@/components";
import type { Metadata } from "next";
import React from "react";
import { sanitize } from "@/lib/sanitize";
import { absoluteUrl, STORE_NAME, toTitleCase } from "@/lib/seo";

// improve readabillity of category text, for example category text "smart-watches" will be "smart watches"
const improveCategoryText = (text: string): string => {
  if (text.indexOf("-") !== -1) {
    let textArray = text.split("-");

    return textArray.join(" ");
  } else {
    return text;
  }
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const awaitedParams = await params;
  const categorySlug = awaitedParams?.slug?.[0];
  const categoryName = categorySlug ? toTitleCase(categorySlug) : "All Products";
  const title =
    categorySlug === undefined
      ? "Shop Electronics in Lebanon"
      : `${categoryName} in Lebanon`;
  const description =
    categorySlug === undefined
      ? `Shop electronics, gaming PCs, laptops, PC parts, accessories, and setup essentials from ${STORE_NAME} in Lebanon.`
      : `Shop ${categoryName.toLowerCase()} in Lebanon from ${STORE_NAME}. Browse prices, stock, and setup essentials online.`;
  const url = absoluteUrl(categorySlug ? `/shop/${categorySlug}` : "/shop");

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

const ShopPage = async ({ params, searchParams }: { params: Promise<{ slug?: string[] }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) => {
  // Await both params and searchParams
  const awaitedParams = await params;
  const awaitedSearchParams = await searchParams;
  
  return (
    <div className="bg-[var(--site-bg)] text-[var(--site-text)]">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-10">
        <Breadcrumb />
        <div className="grid grid-cols-[200px_1fr] gap-x-10 max-md:grid-cols-1 max-md:gap-y-5">
          <Filters />
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-4 max-lg:flex-col max-lg:items-stretch max-lg:gap-y-5">
              <h2 className="text-2xl font-black max-sm:text-xl max-[400px]:text-lg uppercase">
                {awaitedParams?.slug && awaitedParams?.slug[0]?.length > 0
                  ? sanitize(improveCategoryText(awaitedParams?.slug[0]))
                  : "All products"}
              </h2>

              <SortBy />
            </div>
            <div className="divider"></div>
            <Products params={awaitedParams} searchParams={awaitedSearchParams} />
            <Pagination />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
