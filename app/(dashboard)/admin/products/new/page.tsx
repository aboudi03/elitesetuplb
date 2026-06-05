"use client";
import { DashboardSidebar, RichTextEditor } from "@/components";
import ProductResearchAssistant from "@/components/ProductResearchAssistant";
import apiClient, { getRuntimeApiBaseUrl } from "@/lib/api";
import { sanitizeFormData } from "@/lib/form-sanitize";
import { convertCategoryNameToURLFriendly as convertSlugToURLFriendly } from "@/utils/categoryFormating";
import Image from "next/image";
import { nanoid } from "nanoid";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

type PendingGalleryImage = {
  id: string;
  file: File;
  previewUrl: string;
};

const createEmptyProduct = () => ({
  id: nanoid(),
  merchantId: "",
  title: "",
  price: 0,
  taxRate: 0,
  manufacturer: "",
  inStock: 1,
  mainImage: "",
  description: "",
  slug: "",
  categoryId: "",
  isActive: true,
  featured: false,
});

const AddNewProduct = () => {
  const [product, setProduct] = useState<{
    id: string;
    merchantId?: string;
    title: string;
    price: number;
    taxRate: number;
    manufacturer: string;
    inStock: number;
    mainImage: string;
    description: string;
    slug: string;
    categoryId: string;
    isActive: boolean;
    featured: boolean;
  }>(createEmptyProduct);
  const [categories, setCategories] = useState<Category[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [otherImages, setOtherImages] = useState<OtherImages[]>([]);
  const [pendingMainImageFile, setPendingMainImageFile] = useState<File | null>(null);
  const [mainImagePreviewUrl, setMainImagePreviewUrl] = useState("");
  const [pendingGalleryImages, setPendingGalleryImages] = useState<PendingGalleryImage[]>([]);

  const fieldClassName =
    "block w-full rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 py-3 text-base text-[var(--site-text)] shadow-sm outline-none transition focus:border-[var(--site-accent)] focus:ring-2 focus:ring-[var(--site-accent-soft)]";
  const sectionClassName =
    "rounded-3xl border border-[var(--site-border)] bg-[var(--site-panel)] p-6 shadow-sm";

  const addProduct = async () => {
    if (
      !product.merchantId ||
      product.title === "" ||
      product.manufacturer === "" ||
      product.description === "" ||
      product.slug === ""
    ) {
      toast.error("Please enter values in input fields");
      return;
    }

    try {
      let mainImagePath = product.mainImage;

      if (pendingMainImageFile) {
        mainImagePath = await uploadFile(pendingMainImageFile, product.id);
        if (!mainImagePath) {
          toast.error("Failed to upload main image");
          return;
        }
      }

      const sanitizedProduct = sanitizeFormData({
        ...product,
        // send null to server when no category selected
        categoryId: product.categoryId === "" ? null : product.categoryId,
        mainImage: mainImagePath,
      });
      const response = await apiClient.post(`/api/products`, sanitizedProduct);

      if (response.status === 201) {
        await response.json();

        const uploadedGalleryImages: OtherImages[] = [];
        for (const image of pendingGalleryImages) {
          const uploadedPath = await uploadGalleryFile(image.file, product.id);
          if (!uploadedPath) {
            continue;
          }

          const imageResponse = await apiClient.post("/api/images", {
            productID: product.id,
            image: uploadedPath,
          });
          const imageRecord = await imageResponse.json();

          if (imageResponse.ok) {
            uploadedGalleryImages.push(imageRecord);
          }
        }

        if (mainImagePreviewUrl) {
          URL.revokeObjectURL(mainImagePreviewUrl);
        }
        pendingGalleryImages.forEach((image) => {
          URL.revokeObjectURL(image.previewUrl);
        });
        toast.success("Product added successfully");
        setProduct({
          ...createEmptyProduct(),
          merchantId: merchants[0]?.id || "",
        });
        setPendingMainImageFile(null);
        setMainImagePreviewUrl("");
        setPendingGalleryImages([]);
        setOtherImages([]);
        if (uploadedGalleryImages.length > 0) {
          toast.success(
            `${uploadedGalleryImages.length} gallery image${
              uploadedGalleryImages.length > 1 ? "s were" : " was"
            } added`
          );
        }
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
      setProduct((prev) => ({
        ...prev,
        merchantId: prev.merchantId || merchantsData[0]?.id || "",
      }));
    } catch (e) {
      toast.error("Failed to load merchants");
    }
  };

  const uploadFile = async (file: File, productId: string) => {
    const formData = new FormData();
    formData.append("uploadedFile", file);
    formData.append("productId", productId);

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

  const uploadGalleryFile = async (file: File, productId: string) => {
    const formData = new FormData();
    formData.append("uploadedFile", file);
    formData.append("productId", productId);
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
    } catch (error) {
      console.error("Error happened while sending gallery request:", error);
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
    const { categoryId, ...nextFields } = fields;

    setProduct((currentProduct) => ({
      ...currentProduct,
      ...nextFields,
      ...(categoryId !== undefined ? { categoryId: categoryId || "" } : {}),
      slug: fields.title
        ? convertSlugToURLFriendly(fields.title.toLowerCase())
        : currentProduct.slug,
    }));
  };

  useEffect(() => {
    fetchCategories();
    fetchMerchants();
  }, []);

  const removePendingGalleryImage = (imageId: string) => {
    setPendingGalleryImages((currentImages) => {
      const imageToRemove = currentImages.find((image) => image.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      return currentImages.filter((image) => image.id !== imageId);
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
                  value={product?.merchantId}
                  onChange={(e) => setProduct({ ...product, merchantId: e.target.value })}
                >
                  {merchants.map((merchant) => (
                    <option key={merchant.id} value={merchant.id}>
                      {merchant.name}
                    </option>
                  ))}
                </select>
                {merchants.length === 0 && (
                  <span className="mt-2 block text-xs text-red-500">Please create a merchant first.</span>
                )}
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

            <section className={sectionClassName}>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold">Main image</h2>
                <p className="mt-2 text-sm text-[var(--site-muted)]">
                  Upload the primary storefront image and preview it before saving.
                </p>
              </div>

              <div className="space-y-5">
                <input
                  type="file"
                  className="file-input file-input-bordered file-input-lg w-full"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const selectedFile = e.target.files?.[0];
                    if (!selectedFile) return;

                    if (mainImagePreviewUrl) {
                      URL.revokeObjectURL(mainImagePreviewUrl);
                    }
                    setPendingMainImageFile(selectedFile);
                    setMainImagePreviewUrl(URL.createObjectURL(selectedFile));
                  }}
                />
                <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-[var(--site-border)] bg-[var(--site-panel-soft)] p-6">
                  {mainImagePreviewUrl || product?.mainImage ? (
                    <Image
                      src={mainImagePreviewUrl || `/${product?.mainImage}`}
                      alt={product?.title || "Product preview"}
                      className="h-auto max-h-[220px] w-auto object-contain"
                      width={220}
                      height={220}
                    />
                  ) : (
                    <p className="text-center text-sm text-[var(--site-muted)]">
                      Upload an image to preview it here.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className={sectionClassName}>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold">Gallery images</h2>
                <p className="mt-2 text-sm text-[var(--site-muted)]">
                  Add extra product shots. You can upload several images at once.
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
                  {pendingGalleryImages.length > 0 ? (
                    pendingGalleryImages.map((image) => (
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
                          alt="Gallery preview"
                          width={140}
                          height={140}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full flex items-center justify-center text-center text-sm text-[var(--site-muted)]">
                      Upload a few extra angles to build the product gallery.
                    </div>
                  )}
                </div>
              </div>
            </section>

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
