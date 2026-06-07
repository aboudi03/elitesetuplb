"use client";

import type { ProductMediaRow } from "@/lib/productMedia";
import Image from "next/image";
import React from "react";
import { FaArrowDown, FaArrowUp, FaTrash } from "react-icons/fa6";

type ProductMediaManagerProps = {
  rows: ProductMediaRow[];
  onAddFiles: (files: FileList | null) => void;
  onSetMain: (rowId: string) => void;
  onMoveRow: (rowId: string, direction: "up" | "down") => void;
  onRemoveRow: (rowId: string) => void;
};

const ProductMediaManager = ({
  rows,
  onAddFiles,
  onSetMain,
  onMoveRow,
  onRemoveRow,
}: ProductMediaManagerProps) => {
  const galleryRows = rows.filter((row) => !row.isMain);

  return (
    <section className="rounded-3xl border border-[var(--site-border)] bg-[var(--site-panel)] p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Product media</h2>
        <p className="mt-2 text-sm text-[var(--site-muted)]">
          Keep every product image in one ordered list. Pick one main image and sort the rest as
          gallery shots.
        </p>
      </div>

      <div className="space-y-5">
        <input
          type="file"
          multiple
          className="file-input file-input-bordered file-input-lg w-full"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            onAddFiles(event.target.files);
            event.target.value = "";
          }}
        />

        <div className="overflow-x-auto rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel-soft)]">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[var(--site-border)] bg-[var(--site-panel)] text-left text-[var(--site-muted)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Preview</th>
                <th className="px-4 py-3 font-semibold">Image</th>
                <th className="px-4 py-3 font-semibold">Main</th>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row) => {
                  const galleryIndex = galleryRows.findIndex((galleryRow) => galleryRow.id === row.id);

                  return (
                    <tr
                      key={row.id}
                      className="border-b border-[var(--site-border)] text-[var(--site-text)] transition hover:bg-[var(--site-panel)] last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-[var(--site-border)] bg-[var(--site-panel)]">
                          <Image
                            src={row.previewUrl}
                            alt={row.fileName}
                            width={64}
                            height={64}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="font-semibold text-[var(--site-text)]">{row.fileName}</div>
                        <div className="text-xs text-[var(--site-muted)]">
                          {row.source === "pending"
                            ? "New upload"
                            : row.source === "existing-main"
                              ? "Saved main image"
                              : "Saved gallery image"}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <input
                          type="radio"
                          name="main-product-image"
                          checked={row.isMain}
                          onChange={() => onSetMain(row.id)}
                          className="h-4 w-4 border-[var(--site-border)] text-[var(--site-accent)] focus:ring-[var(--site-accent)]"
                          aria-label={`Set ${row.fileName} as main image`}
                        />
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {row.isMain ? (
                          <span className="inline-flex rounded-full border border-[var(--site-border)] bg-[var(--site-panel)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--site-text)]">
                            Main
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex min-w-10 justify-center rounded-lg border border-[var(--site-border)] bg-[var(--site-panel)] px-3 py-2 font-semibold text-[var(--site-text)]">
                              {galleryIndex + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => onMoveRow(row.id, "up")}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--site-border)] bg-[var(--site-panel)] text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:bg-[var(--site-accent-soft)] hover:text-[var(--site-accent)] disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={`Move ${row.fileName} up`}
                              disabled={galleryIndex <= 0}
                            >
                              <FaArrowUp />
                            </button>
                            <button
                              type="button"
                              onClick={() => onMoveRow(row.id, "down")}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--site-border)] bg-[var(--site-panel)] text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:bg-[var(--site-accent-soft)] hover:text-[var(--site-accent)] disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={`Move ${row.fileName} down`}
                              disabled={galleryIndex === -1 || galleryIndex >= galleryRows.length - 1}
                            >
                              <FaArrowDown />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right align-middle">
                        <button
                          type="button"
                          onClick={() => onRemoveRow(row.id)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                          aria-label={`Remove ${row.fileName}`}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-[var(--site-muted)]">
                    Upload product images to build the media set.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default ProductMediaManager;
