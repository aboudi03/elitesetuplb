"use client";
import { DashboardSidebar, RichTextEditor } from "@/components";
import ProductResearchAssistant from "@/components/ProductResearchAssistant";
import { sanitizeFormData } from "@/lib/form-sanitize";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, use } from "react";
import toast from "react-hot-toast";
import {
  convertCategoryNameToURLFriendly as convertSlugToURLFriendly,
  formatCategoryName,
} from "../../../../../utils/categoryFormating";
import { nanoid } from "nanoid";
import apiClient, { getRuntimeApiBaseUrl } from "@/lib/api";

interface DashboardProductDetailsProps {
  params: Promise<{ id: string }>;
}

type PendingGalleryImage = {
  id: string;
  file: File;
  previewUrl: string;
};

const DashboardProductDetails = ({ params }: DashboardProductDetailsProps) => {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [product, setProduct] = useState<Product>();
  const [categories, setCategories] = useState<Category[]>();
  const [otherImages, setOtherImages] = useState<OtherImages[]>([]);
  const [pendingMainImageFile, setPendingMainImageFile] = useState<File | null>(null);
  const [mainImagePreviewUrl, setMainImagePreviewUrl] = useState("");
  const [pendingGalleryImages, setPendingGalleryImages] = useState<PendingGalleryImage[]>([]);
  const [removedExistingImageIds, setRemovedExistingImageIds] = useState<string[]>([]);
  const router = useRouter();
  const fieldClassName =
    "block w-full rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 py-3 text-base text-[var(--site-text)] shadow-sm outline-none transition focus:border-[var(--site-accent)] focus:ring-2 focus:ring-[var(--site-accent-soft)]";
  const sectionClassName =
    "rounded-3xl border border-[var(--site-border)] bg-[var(--site-panel)] p-6 shadow-sm";

  // functionality for deleting product
  const deleteProduct = async () => {
    const requestOptions = {
      method: "DELETE",
    };
    apiClient
      .delete(`/api/products/${id}`, requestOptions)
      .then((response) => {
        if (response.status !== 204) {
          if (response.status === 400) {
            toast.error(
              "Cannot delete the product because of foreign key constraint"
            );
          } else {
            throw Error("There was an error while deleting product");
          }
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
    if (
      product?.title === "" ||
      product?.slug === "" ||
      product?.price.toString() === "" ||
      product?.manufacturer === "" ||
      product?.description === ""
    ) {
      toast.error("You need to enter values in input fields");
      return;
    }

    try {
      let mainImagePath = product?.mainImage || "";

      if (pendingMainImageFile) {
        mainImagePath = await uploadFile(pendingMainImageFile);
        if (!mainImagePath) {
          toast.error("Failed to upload main image");
          return;
        }
      }

      const sanitizedProduct = sanitizeFormData({
        ...product,
        mainImage: mainImagePath,
      });

      const response = await apiClient.put(`/api/products/${id}`, sanitizedProduct);

      if (response.status === 200) {
        await response.json();

        for (const imageId of removedExistingImageIds) {
          await apiClient.delete(`/api/images/item/${imageId}`);
        }

        const uploadedImages: OtherImages[] = [];
        for (const image of pendingGalleryImages) {
          const uploadedPath = await uploadGalleryFile(image.file);
          if (!uploadedPath) {
            continue;
          }

          const imageResponse = await apiClient.post("/api/images", {
            productID: id,
            image: uploadedPath,
          });
          const imageRecord = await imageResponse.json();

          if (imageResponse.ok) {
            uploadedImages.push(imageRecord);
          }
        }

        if (mainImagePreviewUrl) {
          URL.revokeObjectURL(mainImagePreviewUrl);
        }
        pendingGalleryImages.forEach((image) => {
          URL.revokeObjectURL(image.previewUrl);
        });

        setPendingMainImageFile(null);
        setMainImagePreviewUrl("");
        setPendingGalleryImages([]);
        setRemovedExistingImageIds([]);
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
  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("uploadedFile", file);
    formData.append("productId", id);

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

  const uploadGalleryFile = async (file: File) => {
    const formData = new FormData();
    formData.append("uploadedFile", file);
    formData.append("productId", id);
    formData.append("assetType", "gallery");

    try {
      const response = await fetch(`${getRuntimeApiBaseUrl()}/api/main-image`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.path as string;
      }

      toast.error("Gallery upload unsuccessful.");
    } catch (error) {
      console.error("There was an error during gallery request sending:", error);
      toast.error("There was an error during request sending");
    }

    return "";
  };

  const selectGalleryImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const nextImages = Array.from(files).map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPendingGalleryImages((currentImages) => [...currentImages, ...nextImages]);
  };

  // fetching main product data including other product images
  const fetchProductData = async () => {
    apiClient
      .get(`/api/products/${id}`)
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        setProduct(data);
      });

    const imagesData = await apiClient.get(`/api/images/${id}`, {
      cache: "no-store",
    });
    const images = await imagesData.json();
    setOtherImages(Array.isArray(images) ? images : []);
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

  const removePendingGalleryImage = (imageId: string) => {
    setPendingGalleryImages((currentImages) => {
      const imageToRemove = currentImages.find((image) => image.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      return currentImages.filter((image) => image.id !== imageId);
    });
  };

  const removeExistingGalleryImage = (imageId: string) => {
    setRemovedExistingImageIds((currentIds) =>
      currentIds.includes(imageId) ? currentIds : [...currentIds, imageId]
    );
    setOtherImages((currentImages) => currentImages.filter((image) => image.imageID !== imageId));
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
                  {categories &&
                    categories.map((category: Category) => (
                      <option key={category?.id} value={category?.id}>
                        {formatCategoryName(category?.name)}
                      </option>
                    ))}
                </select>
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

            <section className={sectionClassName}>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold">Main image</h2>
                <p className="mt-2 text-sm text-[var(--site-muted)]">
                  Upload or import the primary image customers see first.
                </p>
              </div>

              <div className="space-y-5">
                <input
                  type="file"
                  className="file-input file-input-bordered file-input-lg w-full"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const selectedFile = e.target.files?.[0];

                    if (selectedFile) {
                      if (mainImagePreviewUrl) {
                        URL.revokeObjectURL(mainImagePreviewUrl);
                      }
                      setPendingMainImageFile(selectedFile);
                      setMainImagePreviewUrl(URL.createObjectURL(selectedFile));
                    }
                  }}
                />
                <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-[var(--site-border)] bg-[var(--site-panel-soft)] p-6">
                  {mainImagePreviewUrl || product?.mainImage ? (
                    <Image
                      src={mainImagePreviewUrl || `/${product?.mainImage}`}
                      alt={product?.title || "Product preview"}
                      className="h-auto max-h-[240px] w-auto object-contain"
                      width={240}
                      height={240}
                    />
                  ) : (
                    <p className="text-center text-sm text-[var(--site-muted)]">
                      Add an image to preview it here.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className={sectionClassName}>
              <div className="mb-5">
                <h2 className="text-2xl font-semibold">Gallery</h2>
                <p className="mt-2 text-sm text-[var(--site-muted)]">
                  Add and review secondary product images.
                </p>
              </div>

              <div className="space-y-5">
                <input
                  type="file"
                  multiple
                  className="file-input file-input-bordered file-input-lg w-full"
                  onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                    await selectGalleryImages(e.target.files);
                    e.target.value = "";
                  }}
                />

                <div className="grid min-h-[180px] grid-cols-2 gap-3 rounded-2xl border border-dashed border-[var(--site-border)] bg-[var(--site-panel-soft)] p-4 sm:grid-cols-3">
                  {otherImages.length > 0 ? (
                    otherImages.map((image) => (
                      <div
                        key={image.imageID}
                        className="group relative flex aspect-square items-center justify-center rounded-xl border border-[var(--site-border)] bg-[var(--site-panel)] p-3"
                      >
                        <button
                          type="button"
                          onClick={() => removeExistingGalleryImage(image.imageID)}
                          className="absolute right-2 top-2 z-10 hidden h-7 w-7 items-center justify-center rounded-full bg-black/75 text-sm font-bold text-white transition hover:bg-black group-hover:inline-flex"
                          aria-label="Remove gallery image"
                        >
                          x
                        </button>
                        <Image
                          src={`/${image.image}`}
                          alt="Product gallery image"
                          width={140}
                          height={140}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    ))
                  ) : null}
                  {pendingGalleryImages.map((image) => (
                    <div
                      key={image.id}
                      className="group relative flex aspect-square items-center justify-center rounded-xl border border-[var(--site-border)] bg-[var(--site-panel)] p-3"
                    >
                      <button
                        type="button"
                        onClick={() => removePendingGalleryImage(image.id)}
                        className="absolute right-2 top-2 z-10 hidden h-7 w-7 items-center justify-center rounded-full bg-black/75 text-sm font-bold text-white transition hover:bg-black group-hover:inline-flex"
                        aria-label="Remove gallery image"
                      >
                        x
                      </button>
                      <Image
                        src={image.previewUrl}
                        alt="Pending product gallery image"
                        width={140}
                        height={140}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ))}
                  {otherImages.length === 0 && pendingGalleryImages.length === 0 ? (
                    <div className="col-span-full flex items-center justify-center text-center text-sm text-[var(--site-muted)]">
                      Upload a few extra product images to build the gallery.
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

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
                Products connected to order records cannot be deleted until those records are
                removed.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardProductDetails;

