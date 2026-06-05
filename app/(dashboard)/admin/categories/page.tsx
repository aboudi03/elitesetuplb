"use client";

import { CustomButton, DashboardSidebar } from "@/components";
import apiClient from "@/lib/api";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FaGripVertical } from "react-icons/fa6";
import { formatCategoryName } from "../../../../utils/categoryFormating";

type CategoryDraftMap = Record<string, { name: string; parentId: string }>;

type CategoryRow = Category & {
  level: number;
};

const compareCategories = (left: Category, right: Category) =>
  (left.sortOrder ?? 0) - (right.sortOrder ?? 0) || left.name.localeCompare(right.name);

const DashboardCategory = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [drafts, setDrafts] = useState<CategoryDraftMap>({});
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get("/api/categories", { cache: "no-store" });
      const data = await response.json();
      const nextCategories = Array.isArray(data) ? data : [];

      setCategories(nextCategories);
      setDrafts(
        nextCategories.reduce<CategoryDraftMap>((accumulator, category) => {
          accumulator[category.id] = {
            name: category.name,
            parentId: category.parentId || "",
          };
          return accumulator;
        }, {})
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const categoriesByParent = useMemo(() => {
    const map = new Map<string, Category[]>();

    categories.forEach((category) => {
      const key = category.parentId || "root";
      const currentGroup = map.get(key) || [];
      currentGroup.push(category);
      map.set(key, currentGroup);
    });

    map.forEach((group, key) => {
      map.set(key, [...group].sort(compareCategories));
    });

    return map;
  }, [categories]);

  const categoryRows = useMemo(() => {
    const flattenRows = (parentId: string | null, level: number): CategoryRow[] => {
      const currentCategories = categoriesByParent.get(parentId || "root") || [];
      return currentCategories.flatMap((category) => [
        { ...category, level },
        ...flattenRows(category.id, level + 1),
      ]);
    };

    return flattenRows(null, 0);
  }, [categoriesByParent]);

  const getDescendantIds = (categoryId: string): string[] => {
    const directChildren = categories.filter((category) => category.parentId === categoryId);
    return directChildren.flatMap((child) => [child.id, ...getDescendantIds(child.id)]);
  };

  const updateDraft = (categoryId: string, updates: Partial<{ name: string; parentId: string }>) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [categoryId]: {
        ...currentDrafts[categoryId],
        ...updates,
      },
    }));
  };

  const saveCategory = async (categoryId: string) => {
    const draft = drafts[categoryId];

    if (!draft?.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      const response = await apiClient.put(`/api/categories/${categoryId}`, {
        name: draft.name.trim().toLowerCase().split(" ").join("-"),
        parentId: draft.parentId || null,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.error || "Failed to update category");
      }

      toast.success("Category updated");
      await fetchCategories();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update category");
    }
  };

  const deleteCategory = async (categoryId: string) => {
    try {
      const response = await apiClient.delete(`/api/categories/${categoryId}`);

      if (response.status === 204) {
        toast.success("Category deleted");
        await fetchCategories();
        return;
      }

      const errorData = await response.json();
      throw new Error(errorData?.error || "Failed to delete category");
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete category");
    }
  };

  const reorderSiblingCategories = async (
    parentId: string | null,
    siblingIds: string[],
    draggedId: string,
    targetId: string
  ) => {
    const nextSiblingIds = [...siblingIds];
    const draggedIndex = nextSiblingIds.indexOf(draggedId);
    const targetIndex = nextSiblingIds.indexOf(targetId);

    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
      return;
    }

    nextSiblingIds.splice(draggedIndex, 1);
    nextSiblingIds.splice(targetIndex, 0, draggedId);

    setCategories((currentCategories) =>
      currentCategories.map((category) => {
        const nextIndex = nextSiblingIds.indexOf(category.id);
        return nextIndex >= 0 ? { ...category, sortOrder: nextIndex } : category;
      })
    );

    try {
      const response = await apiClient.put("/api/categories/reorder", {
        parentId,
        orderedIds: nextSiblingIds,
      });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.error || "Failed to reorder categories");
      }

      toast.success("Sort order updated");
      await fetchCategories();
    } catch (error: any) {
      toast.error(error?.message || "Failed to reorder categories");
      await fetchCategories();
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
                Catalog
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">Categories</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--site-muted)]">
                Manage parent and child categories, change names inline, and drag rows to set the
                sort order within each level.
              </p>
            </div>
            <Link href="/admin/categories/new">
              <CustomButton
                buttonType="button"
                customWidth="110px"
                paddingX={10}
                paddingY={5}
                textSize="base"
                text="Add new category"
              />
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel)]">
          <div className="overflow-x-auto">
            <table className="admin-data-table w-full min-w-[980px] text-left">
              <thead className="bg-[var(--site-panel-soft)]">
                <tr>
                  <th className="w-16 px-4 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--site-muted)]">
                    Sort
                  </th>
                  <th className="px-4 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--site-muted)]">
                    Name
                  </th>
                  <th className="px-4 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--site-muted)]">
                    Parent
                  </th>
                  <th className="px-4 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--site-muted)]">
                    Slug
                  </th>
                  <th className="px-4 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--site-muted)]">
                    Homepage image
                  </th>
                  <th className="px-4 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--site-muted)]">
                    Children
                  </th>
                  <th className="px-4 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--site-muted)]">
                    Products
                  </th>
                  <th className="px-4 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--site-muted)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-[var(--site-muted)]">
                      Loading categories...
                    </td>
                  </tr>
                ) : categoryRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-[var(--site-muted)]">
                      No categories found.
                    </td>
                  </tr>
                ) : (
                  categoryRows.map((category) => {
                    const draft = drafts[category.id] || {
                      name: category.name,
                      parentId: category.parentId || "",
                    };
                    const descendantIds = getDescendantIds(category.id);
                    const currentSiblingIds = (categoriesByParent.get(category.parentId || "root") || [])
                      .map((item) => item.id);

                    return (
                      <tr
                        key={category.id}
                        draggable
                        onDragStart={() => setDraggedCategoryId(category.id)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={async () => {
                          if (!draggedCategoryId) return;

                          const draggedCategory = categories.find(
                            (currentCategory) => currentCategory.id === draggedCategoryId
                          );

                          if (!draggedCategory) return;

                          if ((draggedCategory.parentId || null) !== (category.parentId || null)) {
                            toast.error("Drag sorting only works between sibling categories");
                            setDraggedCategoryId(null);
                            return;
                          }

                          await reorderSiblingCategories(
                            category.parentId || null,
                            currentSiblingIds,
                            draggedCategoryId,
                            category.id
                          );
                          setDraggedCategoryId(null);
                        }}
                        onDragEnd={() => setDraggedCategoryId(null)}
                        className="border-t border-[var(--site-border)]"
                      >
                        <td className="px-4 py-4 align-middle">
                          <div className="flex h-10 w-10 cursor-grab items-center justify-center rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] text-[var(--site-muted)]">
                            <FaGripVertical />
                          </div>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <div
                            className="space-y-2"
                            style={{ paddingLeft: `${category.level * 18}px` }}
                          >
                            <input
                              type="text"
                              className="w-full rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 py-2 text-sm text-[var(--site-text)] outline-none transition focus:border-[var(--site-accent)]"
                              value={formatCategoryName(draft.name)}
                              onChange={(event) =>
                                updateDraft(category.id, { name: event.target.value })
                              }
                            />
                            <p className="text-xs text-[var(--site-muted)]">
                              {category.level === 0 ? "Top level" : `Child level ${category.level}`}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <select
                            className="w-full rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 py-2 text-sm text-[var(--site-text)] outline-none transition focus:border-[var(--site-accent)]"
                            value={draft.parentId}
                            onChange={(event) =>
                              updateDraft(category.id, { parentId: event.target.value })
                            }
                          >
                            <option value="">No parent</option>
                            {categories
                              .filter(
                                (optionCategory) =>
                                  optionCategory.id !== category.id &&
                                  !descendantIds.includes(optionCategory.id)
                              )
                              .sort(compareCategories)
                              .map((optionCategory) => (
                                <option key={optionCategory.id} value={optionCategory.id}>
                                  {formatCategoryName(optionCategory.name)}
                                </option>
                              ))}
                          </select>
                        </td>
                        <td className="px-4 py-4 align-middle text-sm text-[var(--site-muted)]">
                          /shop/{category.name}
                        </td>
                        <td className="px-4 py-4 align-middle text-sm text-[var(--site-muted)]">
                          {category.menuImage ? (
                            <span className="inline-flex items-center rounded-full bg-[var(--site-accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--site-accent)]">
                              Set
                            </span>
                          ) : (
                            "Not shown"
                          )}
                        </td>
                        <td className="px-4 py-4 align-middle text-sm font-semibold">
                          {category._count?.children || 0}
                        </td>
                        <td className="px-4 py-4 align-middle text-sm font-semibold">
                          {category._count?.products || 0}
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => saveCategory(category.id)}
                              className="rounded-md bg-[var(--site-accent)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[var(--site-accent-strong)]"
                            >
                              Save
                            </button>
                            <Link
                              href={`/admin/categories/${category.id}`}
                              className="rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-3 py-2 text-sm font-semibold text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:text-[var(--site-accent)]"
                            >
                              Open
                            </Link>
                            <button
                              type="button"
                              onClick={() => deleteCategory(category.id)}
                              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCategory;
