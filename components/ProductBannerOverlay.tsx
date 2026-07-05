"use client";

import apiClient from "@/lib/api";
import { sanitize } from "@/lib/sanitize";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";

let bannerCache: ProductBanner[] | null = null;
let bannerRequest: Promise<ProductBanner[]> | null = null;
let bannerCacheFetchedAt = 0;
const BANNER_CACHE_TTL_MS = 15000;

async function loadProductBanners() {
  if (bannerCache && Date.now() - bannerCacheFetchedAt < BANNER_CACHE_TTL_MS) {
    return bannerCache;
  }

  if (!bannerRequest) {
    bannerRequest = apiClient
      .get("/api/product-banners", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          return [];
        }

        const data = await response.json();
        bannerCache = Array.isArray(data) ? data : [];
        bannerCacheFetchedAt = Date.now();
        return bannerCache;
      })
      .catch(() => [])
      .finally(() => {
        bannerRequest = null;
      });
  }

  return bannerRequest;
}

function productMatchesBanner(product: Product, banner: ProductBanner) {
  if (banner.scopeType === "ALL") {
    return true;
  }

  if (banner.scopeType === "PRODUCTS") {
    const productIds =
      banner.productIds && banner.productIds.length > 0
        ? banner.productIds
        : banner.products.map((item) => item.productId);
    return productIds.includes(product.id);
  }

  if (banner.scopeType === "CATEGORIES" && product.categoryId) {
    const categoryIds =
      banner.categoryIds && banner.categoryIds.length > 0
        ? banner.categoryIds
        : banner.categories.map((item) => item.categoryId);
    return categoryIds.includes(product.categoryId);
  }

  return false;
}

const ProductBannerOverlay = ({
  product,
  className = "",
  variant = "card",
}: {
  product: Product;
  className?: string;
  variant?: "card" | "gallery";
}) => {
  const [banners, setBanners] = useState<ProductBanner[]>(bannerCache || []);

  useEffect(() => {
    let isMounted = true;

    loadProductBanners().then((nextBanners) => {
      if (isMounted) {
        setBanners(nextBanners);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const matchingBanner = useMemo(
    () => banners.find((banner) => productMatchesBanner(product, banner)),
    [banners, product]
  );

  if (!matchingBanner?.image) {
    return null;
  }

  const sizeClassName =
    variant === "gallery"
      ? "h-10 w-28 sm:h-12 sm:w-32 lg:h-14 lg:w-36"
      : "h-8 w-24 sm:h-9 sm:w-28";

  return (
    <div
      className={`pointer-events-none absolute bottom-3 right-3 z-30 max-w-[36%] sm:bottom-4 sm:right-4 ${className}`}
      aria-label={sanitize(matchingBanner.altText || matchingBanner.title)}
    >
      <div className={`relative ${sizeClassName} drop-shadow-[0_10px_18px_rgba(15,23,42,0.20)]`}>
        <Image
          src={`/${matchingBanner.image.replace(/^\/+/, "")}`}
          alt={sanitize(matchingBanner.altText || matchingBanner.title)}
          fill
          sizes={variant === "gallery" ? "144px" : "112px"}
          className="object-contain object-right-bottom"
        />
      </div>
    </div>
  );
};

export default ProductBannerOverlay;
