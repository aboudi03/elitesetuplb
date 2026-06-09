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
import Image from "next/image";
import Link from "next/link";
import React, { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";
import { sanitize } from "@/lib/sanitize";
import { FaMagnifyingGlass } from "react-icons/fa6";
import apiClient from "@/lib/api";

type SearchPreviewProduct = Pick<
  Product,
  "id" | "slug" | "title" | "model" | "mainImage" | "price" | "manufacturer"
>;

const SearchInput = () => {
  const [searchInput, setSearchInput] = useState<string>("");
  const [results, setResults] = useState<SearchPreviewProduct[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const deferredSearchInput = useDeferredValue(searchInput);
  const trimmedDeferredSearch = deferredSearchInput.trim();
  const trimmedSearchInput = searchInput.trim();

  // function for modifying URL for searching products
  const searchProducts = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Sanitize the search input before using it in URL
    const sanitizedSearch = sanitize(searchInput);
    if (!sanitizedSearch.trim()) {
      return;
    }
    setIsDrawerOpen(false);
    router.push(`/search?search=${encodeURIComponent(sanitizedSearch)}`);
  };

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setIsDrawerOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDrawerOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (trimmedDeferredSearch.length < 2) {
      setResults([]);
      setIsSearching(false);
      setIsDrawerOpen(false);
      return;
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true);

      try {
        const response = await apiClient.get(
          `/api/search?query=${encodeURIComponent(trimmedDeferredSearch)}`,
          { signal: abortController.signal }
        );

        if (!response.ok) {
          throw new Error("Search request failed");
        }

        const data = await response.json();
        const nextResults = Array.isArray(data) ? data : [];
        startTransition(() => {
          setResults(nextResults);
          setIsDrawerOpen(true);
        });
      } catch (error) {
        if (!abortController.signal.aborted) {
          startTransition(() => {
            setResults([]);
            setIsDrawerOpen(true);
          });
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 180);

    return () => {
      abortController.abort();
      window.clearTimeout(timeoutId);
    };
  }, [trimmedDeferredSearch]);

  const handleResultClick = () => {
    setIsDrawerOpen(false);
  };

  const showDrawer = trimmedSearchInput.length >= 2 && isDrawerOpen;

  return (
    <div ref={searchWrapperRef} className="relative w-full max-w-3xl">
      <form
        className="relative z-20 flex w-full justify-center max-md:rounded-md max-md:border max-md:border-[var(--site-border)] max-md:bg-[var(--site-panel-soft)] max-md:p-1"
        onSubmit={searchProducts}
      >
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onFocus={() => {
            if (trimmedSearchInput.length >= 2) {
              setIsDrawerOpen(true);
            }
          }}
          placeholder="Search gear..."
          className="input input-bordered min-w-0 flex-1 rounded-r-none border-[var(--site-border)] bg-[var(--site-panel-soft)] text-[var(--site-text)] outline-none placeholder:text-[var(--site-muted)] focus:outline-none max-md:h-10 max-md:border-0 max-md:bg-transparent max-md:px-2"
        />
        <button type="submit" className="btn theme-button shrink-0 rounded-l-none rounded-r-md border-0 max-md:h-10 max-md:min-h-10 max-md:w-11 max-md:px-0 md:px-4">
          <FaMagnifyingGlass className="h-4 w-4 md:hidden" />
          <span className="max-md:sr-only">Search</span>
        </button>
      </form>

      <div
        className={`absolute left-0 right-0 top-[calc(100%+0.75rem)] z-30 origin-top overflow-hidden rounded-[1.5rem] border border-[var(--site-border)] bg-[color-mix(in_srgb,var(--site-panel)_96%,white_4%)] shadow-[0_28px_70px_rgba(0,0,0,0.18)] backdrop-blur transition-all duration-300 ${
          showDrawer
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <div className="border-b border-[var(--site-border)] px-5 py-4">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-black uppercase tracking-[0.12em] text-[var(--site-text)]">
              Search results for:
            </p>
            <p className="text-sm font-semibold uppercase tracking-[0.1em] text-[var(--site-muted)]">
              {trimmedSearchInput.length >= 2 ? sanitize(trimmedSearchInput) : ""}
            </p>
          </div>
        </div>

        <div className="max-h-[420px] overflow-y-auto px-5 py-2">
          {isSearching ? (
            <div>
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 border-b border-[var(--site-border)] px-0 py-4 last:border-b-0 animate-pulse"
                >
                  <div className="h-14 w-14 rounded-lg bg-[var(--site-panel-soft)]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 rounded bg-[var(--site-panel-soft)]" />
                    <div className="h-3 w-1/3 rounded bg-[var(--site-panel-soft)]" />
                    <div className="h-3 w-1/4 rounded bg-[var(--site-panel-soft)]" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div>
              {results.map((product) => {
                const href = `/product/${product.slug || product.id}`;
                const displayTitle = sanitize(product.title || product.model || "Product");
                return (
                  <Link
                    key={product.id}
                    href={href}
                    onClick={handleResultClick}
                    className="group flex items-center gap-3 border-b border-[var(--site-border)] px-0 py-4 transition duration-300 last:border-b-0 hover:bg-transparent"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--site-panel-soft)]">
                      <Image
                        src={product.mainImage ? `/${product.mainImage}` : "/product_placeholder.webp"}
                        alt={displayTitle}
                        fill
                        sizes="56px"
                        className="object-contain p-2 transition duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-black uppercase text-[var(--site-text)] transition group-hover:text-[var(--site-accent)]">
                        {displayTitle}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-[var(--site-muted)]">
                        {product.manufacturer ? <span>{sanitize(product.manufacturer)}</span> : null}
                        <span className="text-[var(--site-accent)]">${Number(product.price).toFixed(2)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="px-0 py-10 text-center">
              <p className="text-sm font-semibold text-[var(--site-muted)]">
                No products found for this search yet.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-[var(--site-border)] px-4 py-4">
          <Link
            href={`/search?search=${encodeURIComponent(sanitize(trimmedSearchInput))}`}
            onClick={handleResultClick}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[var(--site-border)] bg-[var(--site-panel)] px-4 py-2 text-sm font-black uppercase text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
          >
            View all results
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SearchInput;
