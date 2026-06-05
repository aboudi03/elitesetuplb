"use client";

import { pcBuilderWhatsAppNumber, type PcBuilderCategory, type PcBuilderCategoryKey } from "@/lib/pc-builder";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

type BuilderResponse = {
  categories: PcBuilderCategory[];
};

const inputClassName =
  "block w-full rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 py-3 text-base text-[var(--site-text)] shadow-sm outline-none transition focus:border-[var(--site-accent)] focus:ring-2 focus:ring-[var(--site-accent)]";

const PcBuilderExperience = () => {
  const [categories, setCategories] = useState<PcBuilderCategory[]>([]);
  const [selections, setSelections] = useState<Partial<Record<PcBuilderCategoryKey, string>>>({});
  const [customerNote, setCustomerNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadBuilderOptions = async () => {
      try {
        const response = await fetch("/api/pc-builder", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Could not load builder options");
        }

        const data: BuilderResponse = await response.json();
        if (!active) {
          return;
        }

        const nextCategories = Array.isArray(data?.categories) ? data.categories : [];
        setCategories(nextCategories);
        const defaults = Object.fromEntries(
          nextCategories.map((category) => [category.key, category.options[0]?.id || ""])
        ) as Partial<Record<PcBuilderCategoryKey, string>>;
        setSelections(defaults);
      } catch (error) {
        console.error(error);
        toast.error("Could not load PC builder options");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadBuilderOptions();

    return () => {
      active = false;
    };
  }, []);

  const selectedParts = useMemo(() => {
    return categories.map((category) => {
      const selectedId = selections[category.key];
      const option = category.options.find((entry) => entry.id === selectedId) || category.options[0];
      return {
        category,
        option,
      };
    });
  }, [categories, selections]);

  const selectedTierCount = useMemo(() => {
    return selectedParts.reduce(
      (acc, item) => {
        if (!item.option) {
          return acc;
        }
        acc[item.option.tier] += 1;
        return acc;
      },
      { Entry: 0, Mid: 0, High: 0 }
    );
  }, [selectedParts]);

  const dominantTier = useMemo(() => {
    const ordered = Object.entries(selectedTierCount).sort((a, b) => b[1] - a[1]);
    return ordered[0]?.[1] ? ordered[0][0] : "Custom";
  }, [selectedTierCount]);

  const handleSelect = (key: PcBuilderCategoryKey, value: string) => {
    setSelections((current) => ({ ...current, [key]: value }));
  };

  const orderNow = () => {
    if (selectedParts.some((item) => !item.option)) {
      toast.error("Please complete your build first");
      return;
    }

    const lines = selectedParts.map(
      ({ category, option }, index) =>
        `${index + 1}. ${category.label}: ${option?.label} (${option?.tier})`
    );

    const message = [
      "Hello Elite Setup,",
      "I would like a price and availability check for this custom PC build.",
      "",
      "Selected parts:",
      ...lines,
      "",
      `Build style: ${dominantTier}`,
      customerNote.trim() ? `Extra note: ${customerNote.trim()}` : "",
      "",
      "Please tell me the final price and what is available now.",
    ]
      .filter(Boolean)
      .join("\n");

    const whatsappUrl = `https://wa.me/${pcBuilderWhatsAppNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="bg-[var(--site-bg)] text-[var(--site-text)]">
      <section className="border-b border-[var(--site-border)] bg-[var(--site-panel)]">
        <div className="mx-auto grid max-w-screen-2xl gap-10 px-4 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-16">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-black uppercase tracking-[0.08em] text-[var(--site-accent)]">
              Custom Setup Request
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black uppercase leading-tight text-[var(--site-text)] md:text-5xl">
              Build your PC online and send the full setup straight to WhatsApp
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--site-muted)]">
              Choose your target parts, keep the brand flexible, and we will answer with price, stock, and the closest available configuration.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 py-4">
                <p className="text-xs font-black uppercase text-[var(--site-muted)]">Build level</p>
                <p className="mt-2 text-xl font-black text-[var(--site-text)]">{dominantTier}</p>
              </div>
              <div className="rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 py-4">
                <p className="text-xs font-black uppercase text-[var(--site-muted)]">Core parts</p>
                <p className="mt-2 text-xl font-black text-[var(--site-text)]">{selectedParts.length}</p>
              </div>
              <div className="rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 py-4">
                <p className="text-xs font-black uppercase text-[var(--site-muted)]">Quote method</p>
                <p className="mt-2 text-xl font-black text-[var(--site-text)]">Manual review</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-[var(--site-border)] bg-[radial-gradient(circle_at_top_left,rgba(217,4,41,0.16),transparent_32%),linear-gradient(135deg,var(--site-panel-soft),var(--site-panel))] p-6">
            <div className="absolute inset-x-6 top-6 flex items-center justify-between rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-white backdrop-blur">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-white/70">Demo Build</p>
                <p className="text-lg font-black uppercase">Performance Tower</p>
              </div>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase">
                Quote Ready
              </span>
            </div>
            <div className="relative mx-auto mt-16 aspect-[4/3] max-w-xl">
              <Image
                src="/pc%201.png"
                alt="Custom gaming PC preview"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.35)]"
                priority
              />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/10 px-4 py-4 text-white">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-white/70">How it works</p>
                <p className="mt-2 text-sm leading-6 text-white/90">
                  You choose the target level, we answer with the nearest available parts and the final build price.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/10 px-4 py-4 text-white">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-white/70">Why flexible parts</p>
                <p className="mt-2 text-sm leading-6 text-white/90">
                  Keeping brands open makes it easier to match live stock without changing your requested performance level.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-screen-2xl px-4 py-10 lg:px-10 lg:py-14">
        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            {isLoading ? (
              <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel)] px-6 py-10 text-center text-[var(--site-muted)]">
                Loading PC builder options...
              </div>
            ) : (
              categories.map((category) => (
                <section
                  key={category.key}
                  className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel)] p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-black uppercase text-[var(--site-text)]">
                        {category.label}
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-[var(--site-muted)]">
                        {category.helper}
                      </p>
                    </div>
                    <span className="inline-flex w-fit rounded-full bg-[var(--site-accent-soft)] px-3 py-1 text-xs font-black uppercase text-[var(--site-accent)]">
                      {category.options.length} options
                    </span>
                  </div>

                  <div className="mt-5">
                    <select
                      value={selections[category.key] || ""}
                      onChange={(event) => handleSelect(category.key, event.target.value)}
                      className={inputClassName}
                    >
                      {category.options.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label} - {option.tier}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 py-4">
                    <p className="text-xs font-black uppercase text-[var(--site-muted)]">Selection note</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--site-text)]">
                      {
                        category.options.find((option) => option.id === selections[category.key])?.note
                      }
                    </p>
                  </div>
                </section>
              ))
            )}
          </div>

          <aside className="h-fit rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel)] p-6 shadow-sm xl:sticky xl:top-28">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.08em] text-[var(--site-accent)]">
                  Your Build
                </p>
                <h2 className="mt-2 text-2xl font-black uppercase text-[var(--site-text)]">
                  Ready to quote
                </h2>
              </div>
              <span className="rounded-full border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 py-1 text-xs font-black uppercase text-[var(--site-muted)]">
                {dominantTier}
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {selectedParts.map(({ category, option }) => (
                <div
                  key={category.key}
                  className="rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase text-[var(--site-muted)]">
                        {category.label}
                      </p>
                      <p className="mt-1 text-sm font-bold text-[var(--site-text)]">
                        {option?.label || "Not selected"}
                      </p>
                    </div>
                    <span className="rounded-full bg-[var(--site-accent-soft)] px-2.5 py-1 text-[11px] font-black uppercase text-[var(--site-accent)]">
                      {option?.tier || "Custom"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <label htmlFor="pc-builder-note" className="block text-sm font-bold text-[var(--site-text)]">
                Extra request
              </label>
              <textarea
                id="pc-builder-note"
                value={customerNote}
                onChange={(event) => setCustomerNote(event.target.value)}
                className={`${inputClassName} mt-2 min-h-32 resize-y`}
                placeholder="Example: I want Wi-Fi, white case, or quiet cooling."
              />
            </div>

            <button
              type="button"
              onClick={orderNow}
              className="theme-button mt-6 w-full rounded-xl px-5 py-4 text-sm font-black uppercase shadow-sm transition hover:translate-y-[-1px] focus:outline-none focus:ring-2 focus:ring-[var(--site-accent)]"
            >
              Order Now on WhatsApp
            </button>

            <p className="mt-4 text-sm leading-6 text-[var(--site-muted)]">
              Your message asks for final price and current availability based on the parts level you selected.
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default PcBuilderExperience;
