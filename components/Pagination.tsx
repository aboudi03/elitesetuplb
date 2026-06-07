"use client";

import { usePaginationStore } from "@/app/_zustand/paginationStore";
import { useEffect } from "react";
import React from "react";

const Pagination = ({ totalPages }: { totalPages: number }) => {
  const { page, incrementPage, decrementPage, setTotalPages } = usePaginationStore();

  useEffect(() => {
    setTotalPages(totalPages);
  }, [setTotalPages, totalPages]);

  return (
    <div className="join flex justify-center py-8">
      <button
        className="join-item btn h-10 min-h-10 border-0 px-4 text-sm theme-button"
        onClick={() => decrementPage()}
        disabled={page <= 1}
      >
        {"<<"}
      </button>
      <button className="join-item btn h-10 min-h-10 border border-[var(--site-border)] bg-[var(--site-panel)] px-5 text-sm text-[var(--site-text)]">
        Page {page} of {Math.max(1, totalPages)}
      </button>
      <button
        className="join-item btn h-10 min-h-10 border-0 px-4 text-sm theme-button"
        onClick={() => incrementPage()}
        disabled={page >= Math.max(1, totalPages)}
      >
        {">>"}
      </button>
    </div>
  );
};

export default Pagination;
