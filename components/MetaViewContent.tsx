"use client";

import { useEffect, useRef } from "react";
import {
  buildAnalyticsItem,
  trackViewContentEvent,
} from "@/lib/analytics";

type MetaViewContentProps = {
  product: Pick<Product, "id" | "title" | "model" | "sku" | "price" | "manufacturer"> & {
    categoryName?: string | null;
  };
};

export default function MetaViewContent({ product }: MetaViewContentProps) {
  const trackedProductId = useRef<string | null>(null);

  useEffect(() => {
    if (trackedProductId.current === product.id) {
      return;
    }

    const trackProductView = () => {
      trackViewContentEvent({
        value: product.price,
        item: buildAnalyticsItem({
          ...product,
          categoryName: product.categoryName,
        }),
      });
      trackedProductId.current = product.id;
    };

    if (typeof window.fbq === "function") {
      trackProductView();
      return;
    }

    window.addEventListener("meta-pixel-ready", trackProductView, { once: true });
    return () =>
      window.removeEventListener("meta-pixel-ready", trackProductView);
  }, [product]);

  return null;
}
