"use client";
import { DashboardSidebar } from "@/components";
import ProductResearchAssistant from "@/components/ProductResearchAssistant";
import apiClient from "@/lib/api";
import config from "@/lib/config";
import { sanitizeFormData } from "@/lib/form-sanitize";
import { convertCategoryNameToURLFriendly as convertSlugToURLFriendly } from "@/utils/categoryFormating";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const AddNewProduct = () => {
  const [product, setProduct] = useState<{
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
  }>({
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
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);

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
      const sanitizedProduct = sanitizeFormData(product);
      const response = await apiClient.post(`/api/products`, sanitizedProduct);

      if (response.status === 201) {
        await response.json();
        toast.success("Product added successfully");
        setProduct({
          merchantId: merchants[0]?.id || "",
          title: "",
          price: 0,
          taxRate: 0,
          manufacturer: "",
          inStock: 1,
          mainImage: "",
          description: "",
          slug: "",
          categoryId: categories[0]?.id || "",
          isActive: true,
        });
      } else {
        const errorData = await response.json();
        toast.error(`Error: ${errorData.message || "Failed to add product"}`);
      }
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Network error. Please try again.");
    }
  };

  const fetchMerchants = async () => {
    try {
      const res = await apiClient.get("/api/merchants");
      const data: Merchant[] = await res.json();
      setMerchants(data || []);
      setProduct((prev) => ({
        ...prev,
        merchantId: prev.merchantId || data?.[0]?.id || "",
      }));
    } catch (e) {
      toast.error("Failed to load merchants");
    }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("uploadedFile", file);

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/main-image`, {
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
        setCategories(data);
        setProduct((currentProduct) => ({
          ...currentProduct,
          categoryId: currentProduct.categoryId || data[0]?.id || "",
        }));
      });
  };

  const applyResearchFields = (fields: Partial<Product>) => {
    setProduct((currentProduct) => ({
      ...currentProduct,
      ...fields,
      slug: fields.title
        ? convertSlugToURLFriendly(fields.title.toLowerCase())
        : currentProduct.slug,
    }));
  };

  useEffect(() => {
    fetchCategories();
    fetchMerchants();
  }, []);

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

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-[var(--site-muted)]">Description</span>
                <textarea
                  className={`${fieldClassName} min-h-[190px]`}
                  value={product?.description}
                  onChange={(e) => setProduct({ ...product, description: e.target.value })}
                />
              </label>
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
                  onChange={async (e: any) => {
                    const selectedFile = e.target.files[0];
                    if (!selectedFile) return;

                    const uploadedPath = await uploadFile(selectedFile);
                    if (uploadedPath) {
                      setProduct({ ...product, mainImage: uploadedPath });
                    }
                  }}
                />
                <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-[var(--site-border)] bg-[var(--site-panel-soft)] p-6">
                  {product?.mainImage ? (
                    <Image
                      src={`/` + product?.mainImage}
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
