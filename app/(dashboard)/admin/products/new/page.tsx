"use client";
import { DashboardSidebar, RichTextEditor } from "@/components";
import ProductMediaManager from "@/components/ProductMediaManager";
import ProductResearchAssistant from "@/components/ProductResearchAssistant";
import MultiOptionSelect from "@/components/ui/MultiOptionSelect";
import apiClient, { getRuntimeApiBaseUrl } from "@/lib/api";
import { sanitizeFormData } from "@/lib/form-sanitize";
import { PRODUCT_COLOR_PRESETS, PRODUCT_SIZE_PRESETS } from "@/lib/productColors";
import {
  appendMediaRows,
  createPendingMediaRows,
  moveMediaRow,
  removeMediaRow,
  setMainMediaRow,
  type ProductMediaRow,
} from "@/lib/productMedia";
import { convertCategoryNameToURLFriendly as convertSlugToURLFriendly } from "@/utils/categoryFormating";
import { nanoid } from "nanoid";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const createEmptyProduct = () => ({
  id: nanoid(),
  merchantId: "",
  model: "",
  sku: "",
  title: "",
  price: 0,
  taxRate: 0,
  manufacturer: "",
  inStock: 0,
  mainImage: "",
  description: "",
  colors: "",
  sizes: "",
  slug: "",
  categoryId: "",
  isActive: true,
  featured: false,
});

const AddNewProduct = () => {
  const [product, setProduct] = useState<{
    id: string;
    merchantId?: string | null;
    model: string;
    sku: string;
    title: string;
    price: number;
    taxRate: number;
    manufacturer: string;
    inStock: number;
    mainImage: string;
    description: string;
    colors: string;
    sizes: string;
    slug: string;
    categoryId: string;
    isActive: boolean;
    featured: boolean;
  }>(createEmptyProduct);
  const [categories, setCategories] = useState<Category[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [mediaRows, setMediaRows] = useState<ProductMediaRow[]>([]);

  const fieldClassName =
    "block w-full rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 py-3 text-base text-[var(--site-text)] shadow-sm outline-none transition focus:border-[var(--site-accent)] focus:ring-2 focus:ring-[var(--site-accent-soft)]";
  const sectionClassName =
    "rounded-3xl border border-[var(--site-border)] bg-[var(--site-panel)] p-6 shadow-sm";
  const selectedColors = product.colors
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const selectedSizes = product.sizes
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);

  const handleColorsChange = (nextColors: string[]) => {
    setProduct((currentProduct) => ({
      ...currentProduct,
      colors: nextColors.join(", "),
    }));
  };

  const handleSizesChange = (nextSizes: string[]) => {
    setProduct((currentProduct) => ({
      ...currentProduct,
      sizes: nextSizes.join(", "),
    }));
  };

  const addProduct = async () => {
    if (product.model.trim() === "") {
      toast.error("Model is required");
      return;
    }

    try {
      const resolvedMediaRows = await Promise.all(
        mediaRows.map(async (row) => {
          if (!row.file) {
            return row;
          }

          const uploadedPath = await uploadFile(row.file, product.id, row.isMain ? "main" : "gallery");
          if (!uploadedPath) {
            throw new Error(`Failed to upload ${row.fileName}`);
          }

          URL.revokeObjectURL(row.previewUrl);
          return {
            ...row,
            path: uploadedPath,
            previewUrl: `/${uploadedPath}`,
            file: undefined,
            source: "existing-gallery" as const,
          };
        })
      );

      const mainImageRow = resolvedMediaRows.find((row) => row.isMain && row.path);

      const sanitizedProduct = sanitizeFormData({
        ...product,
        merchantId: product.merchantId === "" ? null : product.merchantId,
        categoryId: product.categoryId === "" ? null : product.categoryId,
        sku: product.sku.trim() === "" ? null : product.sku,
        title: product.title.trim() === "" ? null : product.title,
        manufacturer: product.manufacturer.trim() === "" ? null : product.manufacturer,
        colors: product.colors.trim() === "" ? null : product.colors,
        sizes: product.sizes.trim() === "" ? null : product.sizes,
        description: product.description.trim() === "" ? null : product.description,
        slug: product.slug.trim() === "" ? null : product.slug,
        mainImage: mainImageRow?.path || null,
      });
      const response = await apiClient.post(`/api/products`, sanitizedProduct);

      if (response.status === 201) {
        await response.json();

        const galleryPayload = resolvedMediaRows
          .filter((row) => !row.isMain && row.path)
          .map((row, index) => ({
            image: row.path,
            sortOrder: index + 1,
          }));

        await apiClient.put(`/api/images/sync/${product.id}`, {
          images: galleryPayload,
          removedPaths: [],
        });

        toast.success("Product added successfully");
        setProduct({
          ...createEmptyProduct(),
        });
        setMediaRows([]);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || errorData.message || "Failed to add product");
      }
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Network error. Please try again.");
    }
  };

  const fetchMerchants = async () => {
    try {
      const res = await apiClient.get("/api/merchants");
      const data = await res.json();
      const merchantsData: Merchant[] = Array.isArray(data) ? data : [];
      setMerchants(merchantsData);
    } catch (e) {
      toast.error("Failed to load merchants");
    }
  };

  const uploadFile = async (
    file: File,
    productId: string,
    assetType: "main" | "gallery" = "main"
  ) => {
    const formData = new FormData();
    formData.append("uploadedFile", file);
    formData.append("productId", productId);
    formData.append("assetType", assetType);

    try {
      const response = await fetch(`${getRuntimeApiBaseUrl()}/api/main-image`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.path as string;
      }
    } catch (error) {
      console.error("Error happened while sending request:", error);
    }

    return "";
  };

  const fetchCategories = async () => {
    apiClient
      .get(`/api/categories`)
      .then((res) => res.json())
      .then((data) => {
        const categoriesData = Array.isArray(data) ? data : [];
        setCategories(categoriesData);
        // Do not auto-select a category — keep it optional/blank by default
      })
      .catch(() => {
        setCategories([]);
        toast.error("Failed to load categories");
      });
  };

  const applyResearchFields = (fields: Partial<Product>) => {
    setProduct((currentProduct) => ({
      ...currentProduct,
      ...(fields.title !== undefined ? { title: fields.title || "" } : {}),
      ...(fields.model !== undefined ? { model: fields.model || "" } : {}),
      ...(fields.sku !== undefined ? { sku: fields.sku || "" } : {}),
      ...(fields.manufacturer !== undefined ? { manufacturer: fields.manufacturer || "" } : {}),
      ...(fields.description !== undefined ? { description: fields.description || "" } : {}),
      ...(fields.colors !== undefined ? { colors: fields.colors || "" } : {}),
      ...(fields.sizes !== undefined ? { sizes: fields.sizes || "" } : {}),
      ...(fields.mainImage !== undefined ? { mainImage: fields.mainImage || "" } : {}),
      ...(fields.price !== undefined ? { price: fields.price } : {}),
      ...(fields.taxRate !== undefined ? { taxRate: fields.taxRate || 0 } : {}),
      ...(fields.inStock !== undefined ? { inStock: fields.inStock } : {}),
      ...(fields.categoryId !== undefined ? { categoryId: fields.categoryId || "" } : {}),
      slug: fields.title
        ? convertSlugToURLFriendly(fields.title.toLowerCase())
        : currentProduct.slug,
    }));
  };

  useEffect(() => {
    fetchCategories();
    fetchMerchants();
  }, []);

  const addMediaFiles = (files: FileList | null) => {
    const nextRows = createPendingMediaRows(files);
    setMediaRows((currentRows) => appendMediaRows(currentRows, nextRows));
  };

  const handleRemoveMediaRow = (rowId: string) => {
    setMediaRows((currentRows) => {
      const removedRow = currentRows.find((row) => row.id === rowId);
      if (removedRow?.source === "pending") {
        URL.revokeObjectURL(removedRow.previewUrl);
      }

      return removeMediaRow(currentRows, rowId);
    });
  };

  return (
    <div className="mx-auto flex max-w-screen-2xl justify-start gap-y-5 bg-[var(--site-bg)] text-[var(--site-text)] xl:h-full max-xl:flex-col">
      <DashboardSidebar />
      <div className="w-full xl:ml-5 max-xl:px-5">
        <div className="mb-8 rounded-[2rem] border border-[var(--site-border)] bg-[linear-gradient(135deg,var(--site-panel),var(--site-panel-soft))] px-6 py-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--site-muted)]">
            Catalog
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Add new product</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--site-muted)]">
            Create a polished product entry with identity, pricing, stock, tax, visibility, and
            image preview in one comfortable workflow.
          </p>
        </div>

        <div className="mb-6">
          <ProductResearchAssistant
            initialQuery={product.title}
            categories={categories}
            onApply={applyResearchFields}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className={sectionClassName}>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">Core details</h2>
              <p className="mt-2 text-sm text-[var(--site-muted)]">
                Define how the product is named, grouped, and described in the storefront.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Merchant</span>
                <select
                  className={fieldClassName}
                  value={product?.merchantId || ""}
                  onChange={(e) => setProduct({ ...product, merchantId: e.target.value })}
                >
                  <option value="">No merchant</option>
                  {merchants.map((merchant) => (
                    <option key={merchant.id} value={merchant.id}>
                      {merchant.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Category</span>
                <select
                  className={fieldClassName}
                  value={product?.categoryId}
                  onChange={(e) => setProduct({ ...product, categoryId: e.target.value })}
                >
                  <option value="">Uncategorized</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Model</span>
                <input
                  type="text"
                  className={fieldClassName}
                  value={product?.model}
                  onChange={(e) => setProduct({ ...product, model: e.target.value })}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">SKU</span>
                <input
                  type="text"
                  className={fieldClassName}
                  value={product?.sku}
                  onChange={(e) => setProduct({ ...product, sku: e.target.value })}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Product name</span>
                <input
                  type="text"
                  className={fieldClassName}
                  value={product?.title}
                  onChange={(e) => setProduct({ ...product, title: e.target.value })}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Slug</span>
                <input
                  type="text"
                  className={fieldClassName}
                  value={convertSlugToURLFriendly(product?.slug)}
                  onChange={(e) =>
                    setProduct({
                      ...product,
                      slug: convertSlugToURLFriendly(e.target.value),
                    })
                  }
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Manufacturer</span>
                <input
                  type="text"
                  className={fieldClassName}
                  value={product?.manufacturer}
                  onChange={(e) => setProduct({ ...product, manufacturer: e.target.value })}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">
                  Colors
                </span>
                <MultiOptionSelect
                  options={PRODUCT_COLOR_PRESETS.map((color) => ({
                    label: color.label,
                    value: color.label,
                    swatch: color.swatch,
                  }))}
                  selectedValues={selectedColors}
                  onChange={handleColorsChange}
                  placeholder="Select colors"
                  emptySummary="No colors selected."
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">
                  Sizes
                </span>
                <MultiOptionSelect
                  options={PRODUCT_SIZE_PRESETS.map((size) => ({
                    label: size,
                    value: size,
                  }))}
                  selectedValues={selectedSizes}
                  onChange={handleSizesChange}
                  placeholder="Select sizes"
                  emptySummary="No sizes selected."
                />
              </label>

              <div className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Description</span>
                <RichTextEditor
                  value={product?.description}
                  onChange={(description) => setProduct({ ...product, description })}
                  minHeightClassName="min-h-[220px]"
                />
              </div>
            </div>
          </section>

          <div className="space-y-6">
            <section className={sectionClassName}>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold">Commercial settings</h2>
                <p className="mt-2 text-sm text-[var(--site-muted)]">
                  Tune the numbers customers will feel at checkout and inventory level.
                </p>
              </div>

              <div className="grid gap-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Price</span>
                  <input
                    type="number"
                    min={0}
                    className={fieldClassName}
                  value={product?.price}
                  step="0.01"
                  onChange={(e) => setProduct({ ...product, price: Number(e.target.value) })}
                />
              </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Tax % (optional)</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className={fieldClassName}
                    value={product?.taxRate}
                    onChange={(e) =>
                      setProduct({ ...product, taxRate: Math.max(0, Number(e.target.value) || 0) })
                    }
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Stock quantity</span>
                  <input
                    type="number"
                    min={0}
                    className={fieldClassName}
                    value={product?.inStock}
                    onChange={(e) =>
                      setProduct({ ...product, inStock: Math.max(0, Number(e.target.value)) })
                    }
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Visibility</span>
                  <select
                    className={fieldClassName}
                    value={product.isActive ? "enabled" : "disabled"}
                    onChange={(e) =>
                      setProduct({ ...product, isActive: e.target.value === "enabled" })
                    }
                  >
                    <option value="enabled">Enabled - visible to customers</option>
                    <option value="disabled">Disabled - hidden from customers</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Featured</span>
                  <select
                    className={fieldClassName}
                    value={product.featured ? "yes" : "no"}
                    onChange={(e) =>
                      setProduct({ ...product, featured: e.target.value === "yes" })
                    }
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </label>
              </div>
            </section>

            <ProductMediaManager
              rows={mediaRows}
              onAddFiles={addMediaFiles}
              onSetMain={(rowId) => setMediaRows((currentRows) => setMainMediaRow(currentRows, rowId))}
              onMoveRow={(rowId, direction) =>
                setMediaRows((currentRows) => moveMediaRow(currentRows, rowId, direction))
              }
              onRemoveRow={handleRemoveMediaRow}
              convertingRowId={null}
            />

            <div className="flex flex-wrap gap-3">
              <button
                onClick={addProduct}
                type="button"
                className="inline-flex min-h-14 items-center justify-center rounded-xl bg-[var(--site-accent)] px-8 text-base font-bold uppercase tracking-[0.12em] text-white shadow-sm transition hover:bg-[var(--site-accent-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--site-accent)]"
              >
                Add product
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddNewProduct;
