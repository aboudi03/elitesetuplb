// *********************
// Role of the component: Filters on shop page
// Name of the component: Filters.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <Filters />
// Input parameters: no input parameters
// Output: stock, rating and price filter
// *********************

"use client";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useSortStore } from "@/app/_zustand/sortStore";
import { usePaginationStore } from "@/app/_zustand/paginationStore";
import { FaBars, FaTimes } from "react-icons/fa";

interface InputCategory {
  inStock: { text: string, isChecked: boolean },
  outOfStock: { text: string, isChecked: boolean },
  priceFilter: { text: string, value: number },
  ratingFilter: { text: string, value: number },
}

const Filters = () => {
  const pathname = usePathname();
  const { replace } = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // getting current page number from Zustand store
  const { page } = usePaginationStore();

  const [inputCategory, setInputCategory] = useState<InputCategory>({
    inStock: { text: "instock", isChecked: true },
    outOfStock: { text: "outofstock", isChecked: true },
    priceFilter: { text: "price", value: 3000 },
    ratingFilter: { text: "rating", value: 0 },
  });
  const { sortBy } = useSortStore();

  useEffect(() => {
    const params = new URLSearchParams();
    // setting URL params and after that putting them all in URL
    params.set("outOfStock", inputCategory.outOfStock.isChecked.toString());
    params.set("inStock", inputCategory.inStock.isChecked.toString());
    params.set("rating", inputCategory.ratingFilter.value.toString());
    params.set("price", inputCategory.priceFilter.value.toString());
    params.set("sort", sortBy);
    params.set("page", page.toString());
    replace(`${pathname}?${params}`);
  }, [inputCategory, sortBy, page]);

  return (
    <div className={`${isOpen ? "w-60" : "w-12"} self-start rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] p-2 max-md:w-full`}>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--site-border)] text-sm text-[var(--site-text)] transition hover:bg-[var(--site-bg)]"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close filters" : "Open filters"}
        title={isOpen ? "Close filters" : "Open filters"}
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? <FaTimes aria-hidden="true" /> : <FaBars aria-hidden="true" />}
      </button>

      {isOpen && (
        <div className="mt-3">
          <h3 className="mb-2 text-base font-black">Filters</h3>
          <div className="divider"></div>
          <div className="grid gap-4">
            <div className="flex flex-col gap-y-1">
              <h3 className="mb-2 text-sm font-bold">Availability</h3>
              <div className="form-control">
                <label className="flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={inputCategory.inStock.isChecked}
                    onChange={() =>
                      setInputCategory({
                        ...inputCategory,
                        inStock: {
                          text: "instock",
                          isChecked: !inputCategory.inStock.isChecked,
                        },
                      })
                    }
                    className="checkbox"
                  />
                  <span className="label-text ml-2 text-sm text-[var(--site-text)]">In stock</span>
                </label>
              </div>

              <div className="form-control">
                <label className="flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={inputCategory.outOfStock.isChecked}
                    onChange={() =>
                      setInputCategory({
                        ...inputCategory,
                        outOfStock: {
                          text: "outofstock",
                          isChecked: !inputCategory.outOfStock.isChecked,
                        },
                      })
                    }
                    className="checkbox"
                  />
                  <span className="label-text ml-2 text-sm text-[var(--site-text)]">
                    Out of stock
                  </span>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-y-1">
              <h3 className="mb-2 text-sm font-bold">Price</h3>
              <div>
                <input
                  type="range"
                  min={0}
                  max={3000}
                  step={10}
                  value={inputCategory.priceFilter.value}
                  className="range"
                  onChange={(e) =>
                    setInputCategory({
                      ...inputCategory,
                      priceFilter: {
                        text: "price",
                        value: Number(e.target.value),
                      },
                    })
                  }
                />
                <span className="text-sm text-[var(--site-muted)]">{`Max price: $${inputCategory.priceFilter.value}`}</span>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-bold">Minimum Rating:</h3>
              <input
                type="range"
                min={0}
                max="5"
                value={inputCategory.ratingFilter.value}
                onChange={(e) =>
                  setInputCategory({
                    ...inputCategory,
                    ratingFilter: { text: "rating", value: Number(e.target.value) },
                  })
                }
                className="range range-info"
                step="1"
              />
              <div className="flex w-full justify-between px-2 text-xs">
                <span>0</span>
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Filters;
