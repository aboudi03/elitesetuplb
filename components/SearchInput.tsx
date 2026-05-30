// *********************
// Role of the component: Search input element located in the header but it can be used anywhere in your application
// Name of the component: SearchInput.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <SearchInput />
// Input parameters: no input parameters
// Output: form with search input and button
// *********************

"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { sanitize } from "@/lib/sanitize";
import { FaMagnifyingGlass } from "react-icons/fa6";

const SearchInput = () => {
  const [searchInput, setSearchInput] = useState<string>("");
  const router = useRouter();

  // function for modifying URL for searching products
  const searchProducts = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Sanitize the search input before using it in URL
    const sanitizedSearch = sanitize(searchInput);
    router.push(`/search?search=${encodeURIComponent(sanitizedSearch)}`);
    setSearchInput("");
  };

  return (
    <form className="flex w-full max-w-3xl justify-center max-md:rounded-md max-md:border max-md:border-[var(--site-border)] max-md:bg-[var(--site-panel-soft)] max-md:p-1" onSubmit={searchProducts}>
      <input
        type="text"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Search gear..."
        className="input input-bordered min-w-0 flex-1 rounded-r-none border-[var(--site-border)] bg-[var(--site-panel-soft)] text-[var(--site-text)] outline-none placeholder:text-[var(--site-muted)] focus:outline-none max-md:h-10 max-md:border-0 max-md:bg-transparent max-md:px-2"
      />
      <button type="submit" className="btn theme-button shrink-0 rounded-l-none rounded-r-md border-0 max-md:h-10 max-md:min-h-10 max-md:w-11 max-md:px-0 md:px-4">
        <FaMagnifyingGlass className="h-4 w-4 md:hidden" />
        <span className="max-md:sr-only">Search</span>
      </button>
    </form>
  );
};

export default SearchInput;
