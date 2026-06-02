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
    const { allQuantity } = useProductStore();
  return (
    <div className="relative">
            <Link href="/cart" className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--site-text)] transition hover:bg-[var(--site-panel-soft)] hover:text-[var(--site-accent)] md:h-auto md:w-auto md:rounded-none">
              <FaCartShopping className="text-xl md:text-2xl" />
              {allQuantity > 0 && (
                <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--site-accent)] text-[11px] font-bold text-white md:right-[-22px] md:top-[-17px] md:h-6 md:w-6 md:text-base">
                  {allQuantity}
                </span>
              )}
            </Link>
          </div>
  )
}

export default CartElement
