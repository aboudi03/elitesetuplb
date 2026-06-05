"use client";

import { usePaginationStore } from "@/app/_zustand/paginationStore";
import React from "react";

const Pagination = () => {
  const { page, incrementPage, decrementPage } = usePaginationStore();

  return (
    <div className="join flex justify-center py-8">
      <button
        className="join-item btn h-10 min-h-10 border-0 px-4 text-sm theme-button"
        onClick={() => decrementPage()}
      >
        {"<<"}
      </button>
      <button className="join-item btn h-10 min-h-10 border border-[var(--site-border)] bg-[var(--site-panel)] px-5 text-sm text-[var(--site-text)]">
        Page {page}
      </button>
      <button
        className="join-item btn h-10 min-h-10 border-0 px-4 text-sm theme-button"
        onClick={() => incrementPage()}
      >
        {">>"}
      </button>
    </div>
  );
};

export default Pagination;
