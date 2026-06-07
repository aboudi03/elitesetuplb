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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function formatPlainDescription(value: string) {
  const sectionLabels = [
    "Summary",
    "Package Content",
    "Features",
    "Description",
  ];
  const specLabels = [
    "DPI",
    "Switch Lifetime",
    "Lighting Effects",
    "Size",
    "Weight",
    "Cable",
  ];
  const allLabels = [...sectionLabels, ...specLabels];
  const labelPattern = allLabels
    .map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  const lines = value
    .replace(/\r\n/g, "\n")
    .replace(new RegExp(`(${labelPattern}):`, "g"), "\n$1:\n")
    .replace(/([a-z0-9])([A-Z][a-z])/g, "$1\n$2")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let html = "";
  let listOpen = false;

  const closeList = () => {
    if (!listOpen) return;
    html += "</ol>";
    listOpen = false;
  };

  lines.forEach((line) => {
    if (sectionLabels.some((label) => line === `${label}:`)) {
      closeList();
      html += `<h2>${escapeHtml(line)}</h2>`;
      return;
    }

    if (!listOpen) {
      html += "<ol>";
      listOpen = true;
    }

    html += `<li>${escapeHtml(line.replace(/^\d+\.\s*/, ""))}</li>`;
  });

  closeList();

  return html || escapeHtml(value);
}

function formatDescription(value: string | null | undefined) {
  if (!value || value.trim().length === 0) {
    return "<p>This product has no description yet.</p>";
  }

  if (/<[a-z][\s\S]*>/i.test(value)) {
    return sanitizeHtml(value);
  }

  return formatPlainDescription(value);
}

const ProductTabs = ({ product }: { product: Product }) => {
  const [currentProductTab, setCurrentProductTab] = useState<number>(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [canExpandDescription, setCanExpandDescription] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const sanitizedDescription = formatDescription(product?.description);
  const additionalInfoItems = [
    {
      label: "Manufacturer",
      value: sanitize(product?.manufacturer) || "Not specified",
    },
    {
      label: "Category",
      value: product?.category?.name
        ? sanitize(formatCategoryName(product?.category?.name))
        : "No category",
    },
    {
      label: "Color",
      value: "Check available options above",
    },
  ];

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
    <div className="px-5 text-[var(--site-text)] max-sm:px-0">
      <div role="tablist" className="tabs tabs-bordered w-full">
        <a
          role="tab"
          className={`tab flex-1 text-center text-lg text-[var(--site-text)] pb-8 max-[500px]:text-sm max-[400px]:px-2 max-[400px]:text-xs ${
            currentProductTab === 0 && "tab-active"
          }`}
          onClick={() => setCurrentProductTab(0)}
        >
          Description
        </a>
        <a
          role="tab"
          className={`tab flex-1 text-center text-lg text-[var(--site-text)] pb-8 max-[500px]:text-sm max-[400px]:px-2 max-[400px]:text-xs ${
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
          <div className="grid gap-3 pt-1 sm:gap-4">
            {additionalInfoItems.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-[var(--site-border)] bg-[linear-gradient(180deg,var(--site-panel),var(--site-panel-soft))] px-4 py-4 shadow-sm"
              >
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--site-muted)]">
                  {item.label}
                </p>
                <p className="mt-2 break-words text-base font-semibold text-[var(--site-text)] sm:text-lg">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductTabs;
