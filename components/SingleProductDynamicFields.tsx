// *********************
// Role of the component: Helper component for seperating dynamic client component from server component on the single product page with the intention to preserve SEO benefits of Next.js
// Name of the component: SingleProductDynamicFields.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <SingleProductDynamicFields product={product} />
// Input parameters: { product: Product }
// Output: Quantity, add to cart and buy now component on the single product page
// *********************

"use client";
import React, { useState } from "react";
import QuantityInput from "./QuantityInput";
import AddToCartSingleProductBtn from "./AddToCartSingleProductBtn";
import BuyNowSingleProductBtn from "./BuyNowSingleProductBtn";
import { getProductColors, getProductSizes } from "@/lib/productColors";
import { contactEmails } from "@/lib/utils";
import { pcBuilderWhatsAppNumber } from "@/lib/pc-builder";

const PUBLIC_ORDER_LIMIT = 10;
const supportWhatsappHref = `https://wa.me/${pcBuilderWhatsAppNumber}`;

const SingleProductDynamicFields = ({ product }: { product: Product }) => {
  const [quantityCount, setQuantityCount] = useState<number>(1);
  const colorOptions = getProductColors(product);
  const sizeOptions = getProductSizes(product);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    colorOptions[0]?.label
  );
  const [selectedSize, setSelectedSize] = useState<string | undefined>(sizeOptions[0]?.label);

  return (
    <>
      {colorOptions.length > 0 && (
        <div className="mb-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--site-muted)]">
              Color
            </span>
            <span className="text-sm font-medium text-[var(--site-text)]">
              {selectedColor}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {colorOptions.map((color) => {
              const isSelected = selectedColor === color.label;
              return (
                <button
                  key={color.key}
                  type="button"
                  aria-label={`Select ${color.label}`}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedColor(color.label)}
                  className={`group flex items-center gap-3 rounded-full border px-3 py-2 text-sm transition ${
                    isSelected
                      ? "border-[var(--site-accent)] bg-[var(--site-accent-soft)]"
                      : "border-[var(--site-border)] bg-[var(--site-panel-soft)] hover:border-[var(--site-accent)]"
                  }`}
                >
                  <span
                    className="h-6 w-6 rounded-full border border-black/10 shadow-sm"
                    style={{ backgroundColor: color.swatch }}
                  />
                  <span className="font-medium text-[var(--site-text)]">{color.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {sizeOptions.length > 0 && (
        <div className="mb-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--site-muted)]">
              Size
            </span>
            <span className="text-sm font-medium text-[var(--site-text)]">{selectedSize}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {sizeOptions.map((size) => {
              const isSelected = selectedSize === size.label;
              return (
                <button
                  key={size.key}
                  type="button"
                  aria-label={`Select size ${size.label}`}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedSize(size.label)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    isSelected
                      ? "border-[var(--site-accent)] bg-[var(--site-accent-soft)] text-[var(--site-accent)]"
                      : "border-[var(--site-border)] bg-[var(--site-panel-soft)] text-[var(--site-text)] hover:border-[var(--site-accent)]"
                  }`}
                >
                  {size.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <QuantityInput
        quantityCount={quantityCount}
        setQuantityCount={setQuantityCount}
        maxQuantity={PUBLIC_ORDER_LIMIT}
      />
      {quantityCount >= PUBLIC_ORDER_LIMIT ? (
        <p className="mt-2 text-sm text-[var(--site-muted)] max-[500px]:text-center">
          For more than {PUBLIC_ORDER_LIMIT} quantity, please{" "}
          <a
            href={supportWhatsappHref}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[var(--site-accent)] underline-offset-2 transition hover:text-[var(--site-accent-strong)] hover:underline"
          >
            contact us on WhatsApp
          </a>{" "}
          or{" "}
          <a
            href={`mailto:${contactEmails.support}`}
            className="font-semibold text-[var(--site-accent)] underline-offset-2 transition hover:text-[var(--site-accent-strong)] hover:underline"
          >
            email support
          </a>
          .
        </p>
      ) : null}
      {product.inStock > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-x-5">
          <AddToCartSingleProductBtn
            quantityCount={quantityCount}
            product={product}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
          />
          <BuyNowSingleProductBtn
            quantityCount={quantityCount}
            product={product}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
          />
        </div>
      )}
    </>
  );
};

export default SingleProductDynamicFields;
