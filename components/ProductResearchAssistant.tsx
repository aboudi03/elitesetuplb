"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

type ProductResearchAssistantProps = {
  initialQuery?: string;
  categories?: Category[];
  onApply: (fields: Partial<Product>) => void;
};

type ResearchSource = {
  title: string;
  url: string;
  snippet: string;
};

type ImageSuggestion = {
  url: string;
};

type ResearchResult = {
  titleSuggestions: string[];
  manufacturerSuggestions: string[];
  categoryId: string;
  descriptionSuggestions: string[];
  imageSuggestions: ImageSuggestion[];
  sources: ResearchSource[];
};

const fieldClassName =
  "block w-full rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 py-3 text-sm text-[var(--site-text)] shadow-sm outline-none transition focus:border-[var(--site-accent)] focus:ring-2 focus:ring-[var(--site-accent-soft)]";

const actionButtonClassName =
  "rounded-lg border border-[var(--site-border)] px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]";

const ProductResearchAssistant = ({
  initialQuery = "",
  categories = [],
  onApply,
}: ProductResearchAssistantProps) => {
  const [query, setQuery] = useState(initialQuery);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importingImage, setImportingImage] = useState("");

  useEffect(() => {
    if (!query && initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery, query]);

  const runResearch = async () => {
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      toast.error("Enter a product name or model first.");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/product-research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: cleanQuery,
          categories,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Research failed.");
        return;
      }

      setResult(data);
      toast.success("Suggestions loaded.");
    } catch (error) {
      console.error("Product research failed:", error);
      toast.error("Could not research this product.");
    } finally {
      setIsLoading(false);
    }
  };

  const importImage = async (imageUrl: string) => {
    setImportingImage(imageUrl);

    try {
      const response = await fetch("/api/product-research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "importImage",
          imageUrl,
          fileNameSeed: query,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Image import failed.");
        return;
      }

      onApply({ mainImage: data.path });
      toast.success("Image imported.");
    } catch (error) {
      console.error("Image import failed:", error);
      toast.error("Could not import image.");
    } finally {
      setImportingImage("");
    }
  };

  return (
    <section className="rounded-3xl border border-[var(--site-border)] bg-[var(--site-panel)] p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--site-muted)]">
            Assistant
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Product research</h2>
        </div>
        <button
          type="button"
          onClick={runResearch}
          disabled={isLoading}
          className="rounded-xl bg-[var(--site-accent)] px-5 py-3 text-sm font-bold uppercase tracking-[0.1em] text-white transition hover:bg-[var(--site-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Searching..." : "Find info"}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <input
          type="text"
          className={fieldClassName}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Product name, model, or barcode"
        />
        <button
          type="button"
          onClick={() => setQuery(initialQuery)}
          className={actionButtonClassName}
        >
          Use current name
        </button>
      </div>

      {result && (
        <div className="mt-6 grid gap-5">
          {result.titleSuggestions.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-[var(--site-muted)]">
                Names
              </h3>
              <div className="grid gap-2">
                {result.titleSuggestions.map((title) => (
                  <div
                    key={title}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] p-3"
                  >
                    <span className="text-sm font-semibold">{title}</span>
                    <button
                      type="button"
                      className={actionButtonClassName}
                      onClick={() => onApply({ title })}
                    >
                      Use
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.manufacturerSuggestions[0] && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] p-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--site-muted)]">
                  Manufacturer
                </h3>
                <p className="mt-1 text-sm font-semibold">{result.manufacturerSuggestions[0]}</p>
              </div>
              <button
                type="button"
                className={actionButtonClassName}
                onClick={() => onApply({ manufacturer: result.manufacturerSuggestions[0] })}
              >
                Use
              </button>
            </div>
          )}

          {result.categoryId && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] p-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--site-muted)]">
                  Category guess
                </h3>
                <p className="mt-1 text-sm font-semibold">
                  {categories.find((category) => category.id === result.categoryId)?.name ||
                    result.categoryId}
                </p>
              </div>
              <button
                type="button"
                className={actionButtonClassName}
                onClick={() => onApply({ categoryId: result.categoryId })}
              >
                Use
              </button>
            </div>
          )}

          {result.descriptionSuggestions[0] && (
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--site-muted)]">
                  Description
                </h3>
                <button
                  type="button"
                  className={actionButtonClassName}
                  onClick={() => onApply({ description: result.descriptionSuggestions[0] })}
                >
                  Use
                </button>
              </div>
              <p className="rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] p-4 text-sm leading-6 text-[var(--site-muted)]">
                {result.descriptionSuggestions[0]}
              </p>
            </div>
          )}

          {result.imageSuggestions.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-[var(--site-muted)]">
                Photos
              </h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {result.imageSuggestions.map((image) => (
                  <div
                    key={image.url}
                    className="overflow-hidden rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)]"
                  >
                    <div className="flex aspect-square items-center justify-center p-2">
                      <img
                        src={image.url}
                        alt="Suggested product"
                        className="max-h-full max-w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex gap-2 border-t border-[var(--site-border)] p-2">
                      <button
                        type="button"
                        className="flex-1 rounded-lg bg-[var(--site-accent)] px-2 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white transition hover:bg-[var(--site-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={importingImage === image.url}
                        onClick={() => importImage(image.url)}
                      >
                        {importingImage === image.url ? "Importing" : "Import"}
                      </button>
                      <a
                        href={image.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-[var(--site-border)] px-2 py-2 text-xs font-bold uppercase tracking-[0.08em]"
                      >
                        Open
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.sources.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-[var(--site-muted)]">
                Sources
              </h3>
              <div className="grid gap-2">
                {result.sources.slice(0, 3).map((source) => (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] p-3 text-sm transition hover:border-[var(--site-accent)]"
                  >
                    <span className="font-semibold">{source.title}</span>
                    <span className="mt-1 line-clamp-2 block text-[var(--site-muted)]">
                      {source.snippet}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default ProductResearchAssistant;
