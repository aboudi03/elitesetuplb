// *********************
// Role of the component: Wishlist icon with quantity located in the header
// Name of the component: HeartElement.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <HeartElement />
// Input parameters: no input parameters
// Output: wishlist icon with quantity
// *********************

"use client";
import { useWishlistStore } from "@/app/_zustand/wishlistStore";
import Link from "next/link";
import React from "react";
import { FaHeart } from "react-icons/fa6";

const HeartElement = ({wishQuantity}: {wishQuantity: number}) => {
  return (
    <div className="relative">
      <Link href="/wishlist" className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--site-text)] transition hover:bg-[var(--site-panel-soft)] hover:text-[var(--site-accent)] md:h-auto md:w-auto md:rounded-none">
        <FaHeart className="text-xl md:text-2xl" />
        <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--site-accent)] text-[11px] font-bold text-white md:right-[-22px] md:top-[-17px] md:h-6 md:w-6 md:text-base">
          { wishQuantity }
        </span>
      </Link>
    </div>
  );
};

export default HeartElement;
