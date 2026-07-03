// *********************
// Role of the component: SortBy
// Name of the component: SortBy.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <SortBy />
// Input parameters: no input parameters
// Output: select input with options for sorting by a-z, z-a, price low, price high
// *********************

"use client";
import React from "react";
import { useSortStore } from "@/app/_zustand/sortStore";

const SortBy = () => {
  // getting values from Zustand sort store
  const { sortBy, changeSortBy } = useSortStore();

  return (
    <div className="flex items-center gap-x-3 max-lg:flex-col max-lg:w-full max-lg:items-start">
      <h3 className="text-base font-bold">Sort by:</h3>
      <select
        defaultValue={sortBy}
        onChange={(e) => changeSortBy(e.target.value)}
        className="select h-10 min-h-10 w-36 border border-[var(--site-border)] bg-[var(--site-panel)] px-2 py-1 text-sm text-[var(--site-text)] outline-none focus:outline-none max-lg:w-full"
        name="sort"
      >
        <option value="defaultSort">Recommended</option>
        <option value="titleAsc">Sort A-Z</option>
        <option value="titleDesc">Sort Z-A</option>
        <option value="lowPrice">Lowest Price</option>
        <option value="highPrice">Highest Price</option>
      </select>
    </div>
  );
};

export default SortBy;
