"use client"

import { type ProductInCart, useProductStore } from "@/app/_zustand/store";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Image from "next/image"
import Link from "next/link";
import { FaCheck, FaCircleQuestion, FaClock, FaXmark } from "react-icons/fa6";
import QuantityInputCart from "@/components/QuantityInputCart";
import { sanitize } from "@/lib/sanitize";
import { calculateCartGrandTotal, calculateCartTax } from "@/lib/cartPricing";
import { getBundleItemName, groupCartItems } from "@/lib/cartBundles";

export const CartModule = () => {
  const [isMounted, setIsMounted] = useState(false);
  const cartState = useProductStore();
  const products = Array.isArray(cartState?.products) ? cartState.products : [];
  const total = typeof cartState?.total === "number" ? cartState.total : 0;
  const removeFromCart =
    typeof cartState?.removeFromCart === "function"
      ? cartState.removeFromCart
      : () => undefined;
  const calculateTotals =
    typeof cartState?.calculateTotals === "function"
      ? cartState.calculateTotals
      : () => undefined;
  const taxTotal = calculateCartTax(products);
  const orderTotal = calculateCartGrandTotal(products, total);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleRemoveItem = (cartItemId: string) => {
    removeFromCart(cartItemId);
    calculateTotals();
    toast.success("Product removed from the cart");
  };

  // Removing any bundle item removes the whole bundle (handled by the store).
  const handleRemoveBundle = (cartItemId: string) => {
    removeFromCart(cartItemId);
    calculateTotals();
    toast.success("Bundle removed from the cart");
  };

  const cartGroups = groupCartItems(products);

  const renderCartItem = (product: ProductInCart) => (
        <li key={product.cartItemId} className="flex py-6 sm:py-10">
          <div className="flex-shrink-0">
            <Image
              width={192}
              height={192}
              src={product?.image ? `/${product.image}` : "/product_placeholder.webp"}
              alt="laptop image"
              className="h-24 w-24 rounded-md object-cover object-center sm:h-48 sm:w-48"
            />
          </div>

          <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
            <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
              <div>
                <div className="flex justify-between">
                  <h3 className="text-sm">
                    <Link
                      href={`#`}
                      className="font-medium text-[var(--site-text)] hover:text-[var(--site-accent)]"
                    >
                      {sanitize(product.title)}
                    </Link>
                  </h3>
                </div>
                {/* <div className="mt-1 flex text-sm">
                    <p className="text-gray-500">{product.color}</p>
                    {product.size ? (
                      <p className="ml-4 border-l border-gray-200 pl-4 text-gray-500">{product.size}</p>
                    ) : null}
                  </div> */}
                <p className="mt-1 text-sm font-medium text-[var(--site-accent)]">
                  ${product.price}
                </p>
                {product.selectedColor && (
                  <p className="mt-2 text-sm text-[var(--site-muted)]">
                    Color: <span className="font-medium text-[var(--site-text)]">{product.selectedColor}</span>
                  </p>
                )}
                {product.selectedSize && (
                  <p className="mt-1 text-sm text-[var(--site-muted)]">
                    Size: <span className="font-medium text-[var(--site-text)]">{product.selectedSize}</span>
                  </p>
                )}
              </div>

              <div className="mt-4 sm:mt-0 sm:pr-9">
                <QuantityInputCart product={product} />
                <div className="absolute right-0 top-0">
                  <button
                    onClick={() => handleRemoveItem(product.cartItemId)}
                    type="button"
                    className="-m-2 inline-flex p-2 text-[var(--site-muted)] hover:text-[var(--site-accent)]"
                  >
                    <span className="sr-only">Remove</span>
                    <FaXmark className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            <p className="mt-4 flex space-x-2 text-sm text-[var(--site-muted)]">
              {product.stock === undefined || product.stock > 0 ? (
                <FaCheck
                  className="h-5 w-5 flex-shrink-0 text-green-500"
                  aria-hidden="true"
                />
              ) : (
                <FaClock
                  className="h-5 w-5 flex-shrink-0 text-gray-300"
                  aria-hidden="true"
                />
              )}

              <span>
                {product.stock === undefined
                  ? "In stock"
                  : product.stock > 0
                  ? `${product.stock} available`
                  : "Out of stock"}
              </span>
            </p>
          </div>
        </li>
  );

  if (!isMounted) {
    return (
      <div className="mt-12 rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] p-8 text-center">
        <p className="text-sm text-[var(--site-muted)]">Loading cart...</p>
      </div>
    );
  }

  return (

    <form className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
      <section aria-labelledby="cart-heading" className="lg:col-span-7">
        <h2 id="cart-heading" className="sr-only">
          Items in your shopping cart
        </h2>

        <ul
          role="list"
          className="divide-y divide-[var(--site-border)] border-b border-t border-[var(--site-border)]"
        >
          {cartGroups.map((group) => {
            if (group.type === "item") {
              return renderCartItem(group.item);
            }

            const bundleStock = Math.min(
              ...group.items.map((item) => item.stock ?? Number.POSITIVE_INFINITY)
            );

            return (
              <li key={group.key} className="py-6 sm:py-10">
                <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel)] p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className="inline-flex rounded-full bg-[var(--site-accent)] px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
                        Bundle
                      </span>
                      <h3 className="mt-2 text-base font-bold text-[var(--site-text)]">
                        {sanitize(group.title)}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-[var(--site-accent)]">
                        ${group.unitPrice.toFixed(2)} per bundle
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveBundle(group.items[0].cartItemId)}
                      type="button"
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--site-border)] px-3 py-1.5 text-xs font-bold text-[var(--site-muted)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
                    >
                      <FaXmark className="h-3.5 w-3.5" aria-hidden="true" />
                      Remove bundle
                    </button>
                  </div>

                  <ul className="mt-4 space-y-3">
                    {group.items.map((item) => (
                      <li key={item.cartItemId} className="flex items-center gap-3">
                        <Image
                          width={64}
                          height={64}
                          src={item.image ? `/${item.image}` : "/product_placeholder.webp"}
                          alt={sanitize(getBundleItemName(item))}
                          className="h-14 w-14 flex-none rounded-lg bg-[#fff] object-contain p-1"
                        />
                        <span className="min-w-0 flex-1 text-sm text-[var(--site-text)]">
                          {sanitize(getBundleItemName(item))}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--site-border)] pt-4">
                    <QuantityInputCart
                      key={`${group.key}-${group.amount}`}
                      product={{
                        ...group.items[0],
                        stock: Number.isFinite(bundleStock) ? bundleStock : undefined,
                      }}
                    />
                    <p className="text-xs text-[var(--site-muted)]">
                      Bundle items can only be bought together.
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Order summary */}
      <section
        aria-labelledby="summary-heading"
        className="mt-16 rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8"
      >
        <h2
          id="summary-heading"
          className="text-lg font-bold text-[var(--site-text)]"
        >
          Order summary
        </h2>

        <dl className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <dt className="text-sm text-[var(--site-muted)]">Subtotal</dt>
            <dd className="text-sm font-medium text-[var(--site-text)]">
              ${total.toFixed(2)}
            </dd>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--site-border)] pt-4">
            <dt className="flex items-center text-sm text-[var(--site-muted)]">
              <span>Shipping estimate</span>
              <a
                href="#"
                className="ml-2 flex-shrink-0 text-[var(--site-muted)] hover:text-[var(--site-accent)]"
              >
                <span className="sr-only">
                  Learn more about how shipping is calculated
                </span>
                <FaCircleQuestion
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </a>
            </dt>
            <dd className="text-sm font-medium text-[var(--site-text)]">$5.00</dd>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--site-border)] pt-4">
            <dt className="flex text-sm text-[var(--site-muted)]">
              <span>Tax estimate</span>
              <a
                href="#"
                className="ml-2 flex-shrink-0 text-[var(--site-muted)] hover:text-[var(--site-accent)]"
              >
                <span className="sr-only">
                  Learn more about how tax is calculated
                </span>
                <FaCircleQuestion
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </a>
            </dt>
            <dd className="text-sm font-medium text-[var(--site-text)]">
              ${taxTotal.toFixed(2)}
            </dd>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--site-border)] pt-4">
            <dt className="text-base font-medium text-[var(--site-text)]">
              Order total
            </dt>
            <dd className="text-base font-medium text-[var(--site-text)]">
              ${orderTotal.toFixed(2)}
            </dd>
          </div>
        </dl>
        {products.length > 0 && (
          <div className="mt-6">
            <Link
              href="/checkout"
              className="theme-button flex w-full items-center justify-center rounded-md px-4 py-3 text-base font-bold uppercase shadow-sm focus:outline-none focus:ring-2"
            >
              <span>Checkout</span>
            </Link>
          </div>
        )}
      </section>
    </form>

  )

}
