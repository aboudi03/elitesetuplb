// *********************
// Role of the component: Single product tabs on the single product page containing product description, main product info and reviews
// Name of the component: ProductTabs.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <ProductTabs product={product} />
// Input parameters: { product: Product }
// Output: Single product tabs containing product description, main product info and reviews
// *********************

"use client";

import React, { useEffect, useRef, useState } from "react";
import { formatCategoryName } from "@/utils/categoryFormating";
import { sanitize, sanitizeHtml } from "@/lib/sanitize";

const ProductTabs = ({ product }: { product: Product }) => {
  const [currentProductTab, setCurrentProductTab] = useState<number>(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [canExpandDescription, setCanExpandDescription] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const sanitizedDescription = sanitizeHtml(product?.description);

  useEffect(() => {
    if (currentProductTab !== 0) return;

    const checkOverflow = () => {
      const descriptionElement = descriptionRef.current;
      if (!descriptionElement) return;

      setCanExpandDescription(descriptionElement.scrollHeight > descriptionElement.clientHeight + 8);
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);

    return () => window.removeEventListener("resize", checkOverflow);
  }, [currentProductTab, sanitizedDescription, isDescriptionExpanded]);

  return (
    <div className="px-5 text-black">
      <div role="tablist" className="tabs tabs-bordered">
        <a
          role="tab"
          className={`tab text-lg text-black pb-8 max-[500px]:text-base max-[400px]:text-sm max-[370px]:text-xs ${
            currentProductTab === 0 && "tab-active"
          }`}
          onClick={() => setCurrentProductTab(0)}
        >
          Description
        </a>
        <a
          role="tab"
          className={`tab text-black text-lg pb-8 max-[500px]:text-base max-[400px]:text-sm max-[370px]:text-xs ${
            currentProductTab === 1 && "tab-active"
          }`}
          onClick={() => setCurrentProductTab(1)}
        >
          Additional info
        </a>
      </div>
      <div className="pt-5">
        {currentProductTab === 0 && (
          <div className="border-y border-[var(--site-border)] py-5">
            <div
              ref={descriptionRef}
              className={`rich-text-content text-lg text-[var(--site-text)] transition-[max-height] duration-300 max-sm:text-base ${
                isDescriptionExpanded ? "max-h-none" : "max-h-[170px] overflow-hidden"
              }`}
              dangerouslySetInnerHTML={{
                __html: sanitizedDescription
              }}
            />
            {canExpandDescription || isDescriptionExpanded ? (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--site-accent)] transition hover:text-[var(--site-accent-strong)]"
                  onClick={() => setIsDescriptionExpanded((current) => !current)}
                >
                  {isDescriptionExpanded ? "Show Less" : "Show More"}
                  <span aria-hidden="true">{isDescriptionExpanded ? "^" : "v"}</span>
                </button>
              </div>
            ) : null}
          </div>
        )}

        {currentProductTab === 1 && (
          <div className="overflow-x-auto">
            <table className="table text-xl text-center max-[500px]:text-base">
              <tbody>
                {/* row 1 */}
                <tr>
                  <th>Manufacturer:</th>
                  <td>{sanitize(product?.manufacturer)}</td>
                </tr>
                {/* row 2 */}
                <tr>
                  <th>Category:</th>
                  <td>
                    {product?.category?.name
                      ? sanitize(formatCategoryName(product?.category?.name))
                      : "No category"}
                  </td>
                </tr>
                {/* row 3 */}
                <tr>
                  <th>Color:</th>
                  <td>Silver, LightSlateGray, Blue</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductTabs;
