"use client";
import { DashboardSidebar, RichTextEditor } from "@/components";
import ProductMediaManager from "@/components/ProductMediaManager";
import ProductResearchAssistant from "@/components/ProductResearchAssistant";
import MultiOptionSelect from "@/components/ui/MultiOptionSelect";
import { sanitizeFormData } from "@/lib/form-sanitize";
import { PRODUCT_COLOR_PRESETS, PRODUCT_SIZE_PRESETS } from "@/lib/productColors";
import {
  appendMediaRows,
  buildMediaRows,
  createPendingMediaRows,
  moveMediaRow,
  removeMediaRow,
  setMainMediaRow,
  type ProductMediaRow,
} from "@/lib/productMedia";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, use } from "react";
import toast from "react-hot-toast";
import {
  convertCategoryNameToURLFriendly as convertSlugToURLFriendly,
  formatCategoryName,
} from "../../../../../utils/categoryFormating";
import apiClient, { getRuntimeApiBaseUrl } from "@/lib/api";

interface DashboardProductDetailsProps {
  params: Promise<{ id: string }>;
}

const DashboardProductDetails = ({ params }: DashboardProductDetailsProps) => {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [product, setProduct] = useState<Product>();
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [categories, setCategories] = useState<Category[]>();
  const [mediaRows, setMediaRows] = useState<ProductMediaRow[]>([]);
  const [removedMediaPaths, setRemovedMediaPaths] = useState<string[]>([]);
  const [convertingRowId, setConvertingRowId] = useState<string | null>(null);
  const router = useRouter();
  const fieldClassName =
    "block w-full rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 py-3 text-base text-[var(--site-text)] shadow-sm outline-none transition focus:border-[var(--site-accent)] focus:ring-2 focus:ring-[var(--site-accent-soft)]";
  const sectionClassName =
    "rounded-3xl border border-[var(--site-border)] bg-[var(--site-panel)] p-6 shadow-sm";
  const selectedColors = (product?.colors || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const selectedSizes = (product?.sizes || "")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);

  const buildProductFileNameSeed = () => {
    const sku = String(product?.sku || "").trim();
    const model = String(product?.model || "").trim();
    return [sku, model].filter(Boolean).join("-");
  };

  const handleColorsChange = (nextColors: string[]) => {
    setProduct((currentProduct) =>
      currentProduct
        ? {
            ...currentProduct,
            colors: nextColors.join(", "),
          }
        : currentProduct
    );
  };

  const handleSizesChange = (nextSizes: string[]) => {
    setProduct((currentProduct) =>
      currentProduct
        ? {
            ...currentProduct,
            sizes: nextSizes.join(", "),
          }
        : currentProduct
    );
  };

  // functionality for deleting product
  const deleteProduct = async () => {
    const requestOptions = {
      method: "DELETE",
    };
    apiClient
      .delete(`/api/products/${id}`, requestOptions)
      .then((response) => {
        if (response.status !== 204) {
          throw Error("There was an error while deleting product");
        } else {
          toast.success("Product deleted successfully");
          router.push("/admin/products");
        }
      })
      .catch((error) => {
        toast.error("There was an error while deleting product");
      });
  };

  // functionality for updating product
  const updateProduct = async () => {
    if (!product || product.model.trim() === "") {
      toast.error("Model is required");
      return;
    }

    try {
      const resolvedMediaRows = await Promise.all(
        mediaRows.map(async (row) => {
          if (!row.file) {
            return row;
          }

          const uploadedPath = await uploadFile(row.file, row.isMain ? "main" : "gallery");
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
        sku: product.sku?.trim() === "" ? null : product.sku,
        title: product.title?.trim() === "" ? null : product.title,
        manufacturer: product.manufacturer?.trim() === "" ? null : product.manufacturer,
        colors: product.colors?.trim() === "" ? null : product.colors,
        sizes: product.sizes?.trim() === "" ? null : product.sizes,
        description: product.description?.trim() === "" ? null : product.description,
        slug: product.slug?.trim() === "" ? null : product.slug,
        mainImage: mainImageRow?.path || null,
      });

      const response = await apiClient.put(`/api/products/${id}`, sanitizedProduct);

      if (response.status === 200) {
        await response.json();

        const galleryPayload = resolvedMediaRows
          .filter((row) => !row.isMain && row.path)
          .map((row, index) => ({
            imageID: row.imageId,
            image: row.path,
            sortOrder: index + 1,
          }));

        await apiClient.put(`/api/images/sync/${id}`, {
          images: galleryPayload,
          removedPaths: removedMediaPaths,
        });

        setRemovedMediaPaths([]);
        await fetchProductData();
        toast.success("Product successfully updated");
      } else {
        const errorData = await response.json();
        toast.error(
          errorData.error || "There was an error while updating product"
        );
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("There was an error while updating product");
    }
  };

  // functionality for uploading main image file
  const uploadFile = async (file: File, assetType: "main" | "gallery" = "main") => {
    const formData = new FormData();
    formData.append("uploadedFile", file);
    formData.append("productId", id);
    formData.append("assetType", assetType);
    formData.append("fileNameSeed", buildProductFileNameSeed());

    try {
      const response = await fetch(`${getRuntimeApiBaseUrl()}/api/main-image`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.path as string;
      } else {
        toast.error("File upload unsuccessful.");
      }
    } catch (error) {
      console.error("There was an error while during request sending:", error);
      toast.error("There was an error during request sending");
    }

    return "";
  };

  // fetching main product data including other product images
  const fetchProductData = async () => {
    setIsLoadingProduct(true);

    try {
      const productResponse = await apiClient.get(`/api/products/${id}`, {
        cache: "no-store",
      });

      if (!productResponse.ok) {
        throw new Error("Failed to load product details");
      }

      const productData = await productResponse.json();

      if (!productData?.id) {
        throw new Error("Product details response was invalid");
      }

      setProduct(productData);

      const imagesData = await apiClient.get(`/api/images/${id}`, {
        cache: "no-store",
      });
      const images = imagesData.ok ? await imagesData.json() : [];
      const normalizedImages = Array.isArray(images) ? images : [];
      setMediaRows(buildMediaRows(productData.mainImage, normalizedImages));
    } catch (error) {
      console.error("Failed to fetch product details:", error);
      setProduct(undefined);
      setMediaRows([]);
      toast.error("Failed to load product details");
    } finally {
      setIsLoadingProduct(false);
    }
  };

  // fetching all product categories. It will be used for displaying categories in select category input
  const fetchCategories = async () => {
    apiClient
      .get(`/api/categories`)
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setCategories([]);
        toast.error("Failed to load categories");
      });
  };

  const applyResearchFields = (fields: Partial<Product>) => {
    setProduct((currentProduct) => {
      if (!currentProduct) return currentProduct;

      return {
        ...currentProduct,
        ...fields,
        slug: fields.title
          ? convertSlugToURLFriendly(fields.title.toLowerCase())
          : currentProduct.slug,
      };
    });
  };

  useEffect(() => {
    fetchCategories();
    fetchProductData();
  }, [id]);

  const addMediaFiles = (files: FileList | null) => {
    const nextRows = createPendingMediaRows(files);
    setMediaRows((currentRows) => appendMediaRows(currentRows, nextRows));
  };

  const handleRemoveMediaRow = (rowId: string) => {
    setMediaRows((currentRows) => {
      const rowToRemove = currentRows.find((row) => row.id === rowId);

      if (rowToRemove?.source === "pending") {
        URL.revokeObjectURL(rowToRemove.previewUrl);
      }

      if (rowToRemove?.path && rowToRemove.source !== "pending") {
        setRemovedMediaPaths((currentPaths) =>
          currentPaths.includes(rowToRemove.path!)
            ? currentPaths
            : [...currentPaths, rowToRemove.path!]
        );
      }

      return removeMediaRow(currentRows, rowId);
    });
  };

  const handleConvertMediaRowToWebp = async (rowId: string) => {
    const targetRow = mediaRows.find((row) => row.id === rowId);

    if (!targetRow?.path) {
      toast.error("Image path is missing");
      return;
    }

    setConvertingRowId(rowId);

    try {
      const response = await fetch(`${getRuntimeApiBaseUrl()}/api/main-image/convert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: targetRow.path,
          productId: id,
          imageId: targetRow.imageId,
          assetType: targetRow.isMain ? "main" : "gallery",
          fileNameSeed: buildProductFileNameSeed(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.path) {
        throw new Error(data?.message || "Failed to convert image");
      }

      setMediaRows((currentRows) =>
        currentRows.map((row) =>
          row.id === rowId
            ? {
                ...row,
                id: row.isMain ? `main-${data.path}` : row.id,
                path: data.path,
                previewUrl: `/${data.path}`,
                fileName: data.fileName || data.path.split("/").pop() || row.fileName,
                source: row.isMain ? "existing-main" : "existing-gallery",
              }
            : row
        )
      );
      toast.success(data.changed ? "Converted to WebP" : "Already using WebP");
    } catch (error) {
      console.error("Failed to convert product image:", error);
      toast.error("Failed to convert image to WebP");
    } finally {
      setConvertingRowId(null);
    }
  };

  return (
    <div className="mx-auto flex max-w-screen-2xl justify-start bg-[var(--site-bg)] text-[var(--site-text)] xl:h-full max-xl:flex-col">
      <DashboardSidebar />
      <div className="w-full xl:ml-5 max-xl:px-5">
        <div className="mb-8 rounded-[2rem] border border-[var(--site-border)] bg-[linear-gradient(135deg,var(--site-panel),var(--site-panel-soft))] px-6 py-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--site-muted)]">
            Catalog
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">Product details</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--site-muted)]">
                Edit storefront content, pricing, inventory, visibility, and product media from
                one organized workspace.
              </p>
            </div>
            <span
              className={`rounded-xl border px-4 py-2 text-sm font-bold uppercase tracking-[0.1em] ${
                product?.isActive
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-gray-200 bg-gray-50 text-gray-600"
              }`}
            >
              {product?.isActive ? "Visible" : "Hidden"}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <ProductResearchAssistant
            initialQuery={product?.title || ""}
            categories={categories || []}
            onApply={applyResearchFields}
          />
        </div>

        {isLoadingProduct ? (
          <div className={`${sectionClassName} text-center text-[var(--site-muted)]`}>
            Loading product details...
          </div>
        ) : !product ? (
          <div className={`${sectionClassName} text-center`}>
            <p className="text-lg font-semibold text-[var(--site-text)]">Product details could not be loaded.</p>
            <p className="mt-2 text-sm text-[var(--site-muted)]">
              The product may have been deleted, or the backend request failed.
            </p>
          </div>
        ) : (

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className={sectionClassName}>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">Core details</h2>
              <p className="mt-2 text-sm text-[var(--site-muted)]">
                Control how this product appears in the storefront and search.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">
                  Model
                </span>
                <input
                  type="text"
                  className={fieldClassName}
                  value={product?.model || ""}
                  onChange={(e) => setProduct({ ...product!, model: e.target.value })}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">
                  SKU
                </span>
                <input
                  type="text"
                  className={fieldClassName}
                  value={product?.sku || ""}
                  onChange={(e) => setProduct({ ...product!, sku: e.target.value })}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">
                  Product name
                </span>
                <input
                  type="text"
                  className={fieldClassName}
                  value={product?.title || ""}
                  onChange={(e) => setProduct({ ...product!, title: e.target.value })}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">
                  Manufacturer
                </span>
                <input
                  type="text"
                  className={fieldClassName}
                  value={product?.manufacturer || ""}
                  onChange={(e) => setProduct({ ...product!, manufacturer: e.target.value })}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">
                  Category
                </span>
                <select
                  className={fieldClassName}
                  value={product?.categoryId || ""}
                  onChange={(e) =>
                    setProduct({
                      ...product!,
                      categoryId: e.target.value,
                    })
                  }
                >
                  <option value="">Uncategorized</option>
                  {categories &&
                    categories.map((category: Category) => (
                      <option key={category?.id} value={category?.id}>
                        {formatCategoryName(category?.name)}
                      </option>
                    ))}
                </select>
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

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">
                  Slug
                </span>
                <input
                  type="text"
                  className={fieldClassName}
                  value={product?.slug ? convertSlugToURLFriendly(product?.slug) : ""}
                  onChange={(e) =>
                    setProduct({
                      ...product!,
                      slug: convertSlugToURLFriendly(e.target.value),
                    })
                  }
                />
              </label>

              <div className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">
                  Product description
                </span>
                <RichTextEditor
                  value={product?.description || ""}
                  onChange={(description) => setProduct({ ...product!, description })}
                  minHeightClassName="min-h-[240px]"
                />
              </div>
            </div>
          </section>

          <div className="space-y-6">
            <section className={sectionClassName}>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold">Commercial settings</h2>
                <p className="mt-2 text-sm text-[var(--site-muted)]">
                  Manage price, tax, stock, and storefront visibility.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">
                    Price
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className={fieldClassName}
                    value={product?.price ?? 0}
                    onChange={(e) => setProduct({ ...product!, price: Number(e.target.value) })}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">
                    Tax % (optional)
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className={fieldClassName}
                    value={product?.taxRate ?? 0}
                    onChange={(e) =>
                      setProduct({
                        ...product!,
                        taxRate: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">
                    Stock quantity
                  </span>
                  <input
                    type="number"
                    min={0}
                    className={fieldClassName}
                    value={product?.inStock ?? 1}
                    onChange={(e) =>
                      setProduct({
                        ...product!,
                        inStock: Math.max(0, Number(e.target.value)),
                      })
                    }
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">
                    Visibility
                  </span>
                  <select
                    className={fieldClassName}
                    value={product?.isActive ? "enabled" : "disabled"}
                    onChange={(e) =>
                      setProduct({ ...product!, isActive: e.target.value === "enabled" })
                    }
                  >
                    <option value="enabled">Enabled - visible to customers</option>
                    <option value="disabled">Disabled - hidden from customers</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">
                    Featured
                  </span>
                  <select
                    className={fieldClassName}
                    value={product?.featured ? "yes" : "no"}
                    onChange={(e) =>
                      setProduct({ ...product!, featured: e.target.value === "yes" })
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
              onConvertToWebp={handleConvertMediaRowToWebp}
              convertingRowId={convertingRowId}
            />

            <section className={sectionClassName}>
              <h2 className="text-2xl font-semibold">Actions</h2>
              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={updateProduct}
                  className="inline-flex min-h-14 items-center justify-center rounded-xl bg-[var(--site-accent)] px-8 text-base font-bold uppercase tracking-[0.12em] text-white shadow-sm transition hover:bg-[var(--site-accent-strong)] focus:outline-none focus:ring-2"
                >
                  Update product
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-14 items-center justify-center rounded-xl bg-red-600 px-8 text-base font-bold uppercase tracking-[0.12em] text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2"
                  onClick={deleteProduct}
                >
                  Delete product
                </button>
              </div>
              <p className="mt-4 text-sm leading-6 text-red-500">
                Deleting a product now also releases related order references instead of blocking
                the delete.
              </p>
            </section>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default DashboardProductDetails;

