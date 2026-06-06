"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[var(--site-bg)] text-[var(--site-text)]">
        <main className="flex min-h-screen items-center justify-center px-6 py-16">
          <div className="w-full max-w-xl rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel)] p-8 text-center shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.08em] text-[var(--site-accent)]">
              Application Error
            </p>
            <h1 className="mt-4 text-3xl font-black uppercase">
              Something went wrong
            </h1>
            <p className="mt-4 text-sm leading-6 text-[var(--site-muted)]">
              {error.message || "An unexpected error occurred while rendering this page."}
            </p>
            <button
              type="button"
              onClick={() => reset()}
              className="theme-button mt-8 rounded-md px-5 py-3 text-sm font-black uppercase shadow-sm"
            >
              Try Again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
