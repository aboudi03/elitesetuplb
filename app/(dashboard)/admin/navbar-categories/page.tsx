"use client";

import { DashboardSidebar } from "@/components";
import type { NavbarCategoryItem } from "@/lib/navbarCategories";
import apiClient from "@/lib/api";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaArrowDown, FaArrowUp, FaPlus, FaTrash } from "react-icons/fa6";

const createBlankChild = (): NavbarCategoryItem => ({
  id: `child-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  label: "",
  href: "",
});

const createBlankParent = (): NavbarCategoryItem => ({
  id: `parent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  label: "",
  href: "",
  children: [],
});

const fieldClassName =
  "block w-full rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 py-3 text-base text-[var(--site-text)] shadow-sm outline-none transition focus:border-[var(--site-accent)] focus:ring-2 focus:ring-[var(--site-accent-soft)]";

export default function NavbarCategoriesPage() {
  const [categories, setCategories] = useState<NavbarCategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    apiClient
      .get("/api/navbar-categories", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error("Failed to load navbar categories"))
      .finally(() => setIsLoading(false));
  }, []);

  const updateParent = (index: number, updates: Partial<NavbarCategoryItem>) => {
    setCategories((current) =>
      current.map((category, currentIndex) =>
        currentIndex === index ? { ...category, ...updates } : category
      )
    );
  };

  const updateChild = (
    parentIndex: number,
    childIndex: number,
    updates: Partial<NavbarCategoryItem>
  ) => {
    setCategories((current) =>
      current.map((category, currentIndex) => {
        if (currentIndex !== parentIndex) return category;

        return {
          ...category,
          children: (category.children || []).map((child, currentChildIndex) =>
            currentChildIndex === childIndex ? { ...child, ...updates } : child
          ),
        };
      })
    );
  };

  const moveParent = (index: number, direction: "up" | "down") => {
    setCategories((current) => {
      const next = [...current];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return current;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const moveChild = (parentIndex: number, childIndex: number, direction: "up" | "down") => {
    setCategories((current) =>
      current.map((category, currentIndex) => {
        if (currentIndex !== parentIndex) return category;

        const children = [...(category.children || [])];
        const targetIndex = direction === "up" ? childIndex - 1 : childIndex + 1;
        if (targetIndex < 0 || targetIndex >= children.length) return category;
        [children[childIndex], children[targetIndex]] = [children[targetIndex], children[childIndex]];
        return { ...category, children };
      })
    );
  };

  const saveCategories = async () => {
    setIsSaving(true);

    try {
      const response = await apiClient.put("/api/navbar-categories", { categories });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.error || "Failed to save navbar categories");
      }

      setCategories(responseData.categories || []);
      toast.success("Navbar categories saved");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save navbar categories");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-screen-2xl justify-start bg-[var(--site-bg)] text-[var(--site-text)] xl:h-full max-xl:flex-col">
      <DashboardSidebar />
      <div className="w-full xl:ml-5 max-xl:px-5">
        <div className="mb-8 rounded-[2rem] border border-[var(--site-border)] bg-[linear-gradient(135deg,var(--site-panel),var(--site-panel-soft))] px-6 py-8 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--site-muted)]">
                Navigation
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">Navbar categories</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--site-muted)]">
                Manage the hero/navbar category links separately from the home page category cards
                and from the product category tree.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCategories((current) => [...current, createBlankParent()])}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel)] px-5 text-sm font-semibold text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
              >
                <FaPlus />
                Add parent item
              </button>
              <button
                type="button"
                onClick={saveCategories}
                disabled={isSaving}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--site-accent)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--site-accent-strong)] disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save navbar"}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel)] px-6 py-10 text-center text-[var(--site-muted)]">
              Loading navbar categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel)] px-6 py-10 text-center text-[var(--site-muted)]">
              No navbar categories yet.
            </div>
          ) : (
            categories.map((category, categoryIndex) => (
              <section
                key={category.id}
                className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel)] p-6 shadow-sm"
              >
                <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.2fr_auto]">
                  <input
                    type="text"
                    placeholder="Label"
                    className={fieldClassName}
                    value={category.label}
                    onChange={(event) =>
                      updateParent(categoryIndex, { label: event.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="ID"
                    className={fieldClassName}
                    value={category.id}
                    onChange={(event) =>
                      updateParent(categoryIndex, { id: event.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="/shop/example"
                    className={fieldClassName}
                    value={category.href}
                    onChange={(event) =>
                      updateParent(categoryIndex, { href: event.target.value })
                    }
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => moveParent(categoryIndex, "up")}
                      className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
                    >
                      <FaArrowUp />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveParent(categoryIndex, "down")}
                      className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
                    >
                      <FaArrowDown />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCategories((current) =>
                          current.filter((_, currentIndex) => currentIndex !== categoryIndex)
                        )
                      }
                      className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] p-4">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold">Child items</h2>
                    <button
                      type="button"
                      onClick={() =>
                        updateParent(categoryIndex, {
                          children: [...(category.children || []), createBlankChild()],
                        })
                      }
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel)] px-4 text-sm font-semibold text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
                    >
                      <FaPlus />
                      Add child
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(category.children || []).length === 0 ? (
                      <p className="text-sm text-[var(--site-muted)]">No child items.</p>
                    ) : (
                      (category.children || []).map((childCategory, childIndex) => (
                        <div
                          key={childCategory.id}
                          className="grid gap-3 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel)] p-4 lg:grid-cols-[1fr_1fr_1.2fr_auto]"
                        >
                          <input
                            type="text"
                            placeholder="Label"
                            className={fieldClassName}
                            value={childCategory.label}
                            onChange={(event) =>
                              updateChild(categoryIndex, childIndex, {
                                label: event.target.value,
                              })
                            }
                          />
                          <input
                            type="text"
                            placeholder="ID"
                            className={fieldClassName}
                            value={childCategory.id}
                            onChange={(event) =>
                              updateChild(categoryIndex, childIndex, {
                                id: event.target.value,
                              })
                            }
                          />
                          <input
                            type="text"
                            placeholder="/shop/example"
                            className={fieldClassName}
                            value={childCategory.href}
                            onChange={(event) =>
                              updateChild(categoryIndex, childIndex, {
                                href: event.target.value,
                              })
                            }
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => moveChild(categoryIndex, childIndex, "up")}
                              className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
                            >
                              <FaArrowUp />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveChild(categoryIndex, childIndex, "down")}
                              className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
                            >
                              <FaArrowDown />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateParent(categoryIndex, {
                                  children: (category.children || []).filter(
                                    (_, currentIndex) => currentIndex !== childIndex
                                  ),
                                })
                              }
                              className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
