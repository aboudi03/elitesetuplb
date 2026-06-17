"use client";

import { useCatalogViewStore } from "@/app/_zustand/catalogViewStore";
import { useEffect } from "react";
import ProductItem from "./ProductItem";

const ProductResultsBrowser = ({ products }: { products: Product[] }) => {
  const { viewMode, hydrateViewMode, hasHydrated } = useCatalogViewStore();

  useEffect(() => {
    hydrateViewMode();
  }, [hydrateViewMode]);

  const resolvedViewMode = hasHydrated ? viewMode : "grid";

  return (
    <div
      className={
        resolvedViewMode === "list"
          ? "flex flex-col gap-4"
          : "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
      }
    >
      {products.length > 0 ? (
        products.map((product) => (
          <ProductItem
            key={product.id}
            product={product}
            color="black"
            viewMode={resolvedViewMode}
            quickAddEnabled
            mobileCardLinkEnabled
          />
        ))
      ) : (
        <h3 className="col-span-full mt-6 w-full text-center text-xl max-[500px]:text-base">
          No products found for specified query
        </h3>
      )}
    </div>
  );
};

export default ProductResultsBrowser;
