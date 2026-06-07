"use client";

import { useCatalogViewStore } from "@/app/_zustand/catalogViewStore";
import { useEffect } from "react";
import { HiOutlineSquares2X2, HiOutlineQueueList } from "react-icons/hi2";

const toggleButtonClassName =
  "inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-bold uppercase transition";

const CatalogViewToggle = () => {
  const { viewMode, setViewMode, hydrateViewMode, hasHydrated } = useCatalogViewStore();

  useEffect(() => {
    hydrateViewMode();
  }, [hydrateViewMode]);

  const resolvedViewMode = hasHydrated ? viewMode : "grid";

  return (
    <div className="flex flex-col gap-2 max-lg:w-full">
      <span className="text-sm font-bold uppercase text-[var(--site-muted)]">View</span>
      <div className="flex items-center gap-2 max-sm:w-full">
        <button
          type="button"
          onClick={() => setViewMode("grid")}
          className={`${toggleButtonClassName} ${
            resolvedViewMode === "grid"
              ? "border-[var(--site-accent)] bg-[var(--site-accent-soft)] text-[var(--site-accent)]"
              : "border-[var(--site-border)] bg-[var(--site-panel)] text-[var(--site-text)] hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
          } max-sm:flex-1 max-sm:justify-center`}
          aria-pressed={resolvedViewMode === "grid"}
        >
          <HiOutlineSquares2X2 className="h-5 w-5" />
          <span>Grid</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode("list")}
          className={`${toggleButtonClassName} ${
            resolvedViewMode === "list"
              ? "border-[var(--site-accent)] bg-[var(--site-accent-soft)] text-[var(--site-accent)]"
              : "border-[var(--site-border)] bg-[var(--site-panel)] text-[var(--site-text)] hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
          } max-sm:flex-1 max-sm:justify-center`}
          aria-pressed={resolvedViewMode === "list"}
        >
          <HiOutlineQueueList className="h-5 w-5" />
          <span>List</span>
        </button>
      </div>
    </div>
  );
};

export default CatalogViewToggle;
