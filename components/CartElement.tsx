// *********************
// Role of the component: Cart icon and quantity that will be located in the header
// Name of the component: CartElement.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <CartElement />
// Input parameters: no input parameters
// Output: Cart icon and quantity
// *********************

"use client";
import Link from 'next/link'
import React from 'react'
import { FaCartShopping } from 'react-icons/fa6'
import { useProductStore } from "@/app/_zustand/store";

const CartElement = () => {
    const cartState = useProductStore();
    const allQuantity = typeof cartState?.allQuantity === "number" ? cartState.allQuantity : 0;
  return (
    <div className="relative">
            <Link
              href="/cart"
              className="group flex h-9 w-9 items-center justify-center rounded-xl border border-transparent bg-transparent text-[var(--site-text)] shadow-[0_0_0_rgba(15,23,42,0)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:scale-110 hover:border-[var(--site-border)] hover:bg-[color-mix(in_srgb,var(--site-panel-soft)_88%,white_12%)] hover:text-[var(--site-accent)] hover:shadow-[0_14px_28px_rgba(15,23,42,0.14)] md:h-11 md:w-11"
            >
              <FaCartShopping className="text-xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 md:text-2xl" />
              {allQuantity > 0 && (
                <span className="absolute right-[-2px] top-[-2px] flex h-5 w-5 items-center justify-center rounded-full bg-[var(--site-accent)] text-[11px] font-bold text-white shadow-[0_8px_18px_rgba(225,29,46,0.28)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 md:right-[-6px] md:top-[-4px] md:h-6 md:w-6 md:text-base">
                  {allQuantity}
                </span>
              )}
            </Link>
          </div>
  )
}

export default CartElement
