"use client";
import { DashboardSidebar } from "@/components";
import apiClient, { getRuntimeApiBaseUrl } from "@/lib/api";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { convertCategoryNameToURLFriendly } from "../../../../../utils/categoryFormating";

const DashboardNewCategoryPage = () => {
  const [categoryInput, setCategoryInput] = useState({
    name: "",
    parentId: "",
    menuImage: "",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const previewImageSrc =
    categoryInput.menuImage.startsWith("http://") || categoryInput.menuImage.startsWith("https://")
      ? categoryInput.menuImage
      : `/${categoryInput.menuImage}`.replace("//", "/");

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("uploadedFile", file);

    try {
      const response = await fetch(`${getRuntimeApiBaseUrl()}/api/main-image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      return data.path as string;
    } catch (error) {
      console.error("Error uploading category image:", error);
      toast.error("Failed to upload category image");
      return "";
    }
  };

  const addNewCategory = async () => {
    if (categoryInput.name.length > 0) {
      try {
        const response = await apiClient.post(`/api/categories`, {
          name: convertCategoryNameToURLFriendly(categoryInput.name),
          parentId: categoryInput.parentId || null,
          menuImage: categoryInput.menuImage || null,
        });

        if (response.status === 201) {
          await response.json();
          toast.success("Category added successfully");
          setCategoryInput({
            name: "",
            parentId: "",
            menuImage: "",
          });
        } else {
          const errorData = await response.json();
          toast.error(
            errorData.error || "There was an error while creating category"
          );
        }
      } catch (error) {
        console.error("Error creating category:", error);
        toast.error("There was an error while creating category");
      }
    } else {
      toast.error("You need to enter values to add a category");
    }
  };

  useEffect(() => {
    apiClient
      .get("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to load categories"));
  }, []);

  return (
    <div className="bg-[var(--site-bg)] text-[var(--site-text)] flex justify-start max-w-screen-2xl mx-auto xl:h-full max-xl:flex-col max-xl:gap-y-5">
      <DashboardSidebar />
      <div className="flex flex-col gap-y-7 xl:pl-5 max-xl:px-5 w-full">
        <h1 className="text-3xl font-semibold">Add new category</h1>
        <div>
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">Category name:</span>
            </div>
            <input
              type="text"
              className="input input-bordered w-full max-w-xs"
              value={categoryInput.name}
              onChange={(e) =>
                setCategoryInput({ ...categoryInput, name: e.target.value })
              }
            />
          </label>
        </div>

        <div>
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">Parent category:</span>
            </div>
            <select
              className="select select-bordered w-full max-w-xs"
              value={categoryInput.parentId}
              onChange={(e) =>
                setCategoryInput({ ...categoryInput, parentId: e.target.value })
              }
            >
              <option value="">No parent (top level)</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="max-w-md space-y-4">
          <label className="form-control w-full">
            <div className="label">
              <span className="label-text">Homepage category image:</span>
            </div>
            <input
              type="file"
              className="file-input file-input-bordered w-full"
              onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                const selectedFile = e.target.files?.[0];
                if (!selectedFile) return;

                const uploadedPath = await uploadFile(selectedFile);
                if (uploadedPath) {
                  setCategoryInput((current) => ({ ...current, menuImage: uploadedPath }));
                }
              }}
            />
          </label>

          <label className="form-control w-full">
            <div className="label">
              <span className="label-text">Or image path:</span>
            </div>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="uploads/category-icon.png"
              value={categoryInput.menuImage}
              onChange={(e) =>
                setCategoryInput({ ...categoryInput, menuImage: e.target.value })
              }
            />
          </label>

          <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-[var(--site-border)] bg-[var(--site-panel-soft)] p-4">
            {categoryInput.menuImage ? (
              <Image
                src={previewImageSrc}
                alt="Category preview"
                width={120}
                height={120}
                className="h-24 w-24 object-contain"
              />
            ) : (
              <p className="text-sm text-[var(--site-muted)]">
                Add an image if this category should appear in the homepage category grid.
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-x-2">
          <button
            type="button"
            className="uppercase bg-[var(--site-accent)] px-10 py-5 text-lg border border-black border-gray-300 font-bold text-white shadow-sm hover:bg-[var(--site-accent-strong)] hover:text-white focus:outline-none focus:ring-2"
            onClick={addNewCategory}
          >
            Create category
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardNewCategoryPage;

