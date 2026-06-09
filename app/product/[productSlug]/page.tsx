import {
  StockAvailabillity,
  UrgencyText,
  ProductItem,
  ProductTabs,
  ProductImageGallery,
  SingleProductDynamicFields,
} from "@/components";
import apiClient from "@/lib/api";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import React from "react";
import { sanitize } from "@/lib/sanitize";
import {
  absoluteUrl,
  buildMetaDescription,
  productImageUrl,
  STORE_LOCATION,
  STORE_NAME,
  stripHtml,
} from "@/lib/seo";
import { FaStar } from "react-icons/fa6";
import Heading from "@/components/Heading";

interface ImageItem {
  imageID: string;
  productID: string;
  image: string;
}

interface SingleProductPageProps {
  params: Promise<{ productSlug: string }>;
}

async function getProductBySlug(productSlug: string) {
  const data = await apiClient.get(`/api/slugs/${productSlug}`, {
    cache: "no-store",
  });

  if (!data.ok) return null;
  const product = await data.json();
  return product?.error ? null : product;
}

async function getRelatedProducts(product: Product) {
  const desiredCount = 4;
  const collected = new Map<string, Product>();

  const collectProducts = (products: Product[]) => {
    for (const item of products) {
      if (!item?.id || item.id === product.id || collected.has(item.id)) {
        continue;
      }

      collected.set(item.id, item);

      if (collected.size >= desiredCount) {
        break;
      }
    }
  };

  if (product.categoryId) {
    const sameCategoryResponse = await apiClient.get(
      `/api/products?mode=admin&isActive=true&categoryId=${encodeURIComponent(product.categoryId)}&limit=8`
    );

    if (sameCategoryResponse.ok) {
      const sameCategoryData = await sameCategoryResponse.json();
      collectProducts(Array.isArray(sameCategoryData?.products) ? sameCategoryData.products : []);
    }
  }

  if (collected.size < desiredCount && product.manufacturer) {
    const sameManufacturerResponse = await apiClient.get(
      `/api/products?mode=admin&isActive=true&search=${encodeURIComponent(product.manufacturer)}&limit=8`
    );

    if (sameManufacturerResponse.ok) {
      const sameManufacturerData = await sameManufacturerResponse.json();
      collectProducts(
        Array.isArray(sameManufacturerData?.products) ? sameManufacturerData.products : []
      );
    }
  }

  if (collected.size < desiredCount) {
    const fallbackResponse = await apiClient.get(
      `/api/products?mode=admin&isActive=true&sortBy=createdAt&sortDirection=desc&limit=8`
    );

    if (fallbackResponse.ok) {
      const fallbackData = await fallbackResponse.json();
      collectProducts(Array.isArray(fallbackData?.products) ? fallbackData.products : []);
    }
  }

  return Array.from(collected.values()).slice(0, desiredCount);
}

export async function generateMetadata({
  params,
}: SingleProductPageProps): Promise<Metadata> {
  const { productSlug } = await params;
  const product = await getProductBySlug(productSlug);

  if (!product) {
    return {
      title: "Product Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const productName = product.title || product.model || "Product";
  const title = `${stripHtml(productName)} in ${STORE_LOCATION}`;
  const description = buildMetaDescription(
    `Buy ${stripHtml(productName)} in ${STORE_LOCATION} from ${STORE_NAME}. Check price, stock, and delivery options.`,
    product.description
  );
  const url = absoluteUrl(`/product/${product.slug}`);
  const image = productImageUrl(product.mainImage);

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      images: [
        {
          url: image,
          alt: stripHtml(productName),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

const SingleProductPage = async ({ params }: SingleProductPageProps) => {
  const paramsAwaited = await params;
  // sending API request for a single product with a given product slug
  const product = await getProductBySlug(paramsAwaited?.productSlug);

  if (!product || product.error) {
    notFound();
  }
  const normalizedProduct = {
    ...product,
    title: product.title || "",
    model: product.model || "",
    slug: product.slug || paramsAwaited?.productSlug || "",
    description: product.description || "",
    manufacturer: product.manufacturer || "",
    mainImage: product.mainImage || null,
    sku: product.sku || "",
    price: Number(product.price || 0),
    inStock: Number(product.inStock || 0),
    category:
      product.category && typeof product.category === "object" ? product.category : null,
  };
  const productName = normalizedProduct.title || normalizedProduct.model || "Product";
  const plainDescription = stripHtml(normalizedProduct.description || "");
  const shortDescription = plainDescription.length > 260
    ? `${plainDescription.slice(0, 257).trimEnd()}...`
    : plainDescription;

  // sending API request for more than 1 product image if it exists
  const imagesData = await apiClient.get(`/api/images/${normalizedProduct.id}`, {
    cache: "no-store",
  });
  const rawImages = imagesData.ok ? await imagesData.json() : [];
  const images: ImageItem[] = Array.isArray(rawImages) ? rawImages : [];
  const relatedProducts = await getRelatedProducts(normalizedProduct);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: stripHtml(productName),
    image: [productImageUrl(normalizedProduct.mainImage)],
    description: buildMetaDescription(
      `Buy ${stripHtml(productName)} in ${STORE_LOCATION} from ${STORE_NAME}.`,
      normalizedProduct.description,
      500
    ),
    sku: normalizedProduct.sku || normalizedProduct.slug,
    brand: normalizedProduct.manufacturer
      ? {
          "@type": "Brand",
          name: stripHtml(normalizedProduct.manufacturer),
        }
      : undefined,
    category: normalizedProduct.category?.name,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/product/${normalizedProduct.slug}`),
      priceCurrency: "USD",
      price: normalizedProduct.price,
      availability:
        normalizedProduct.inStock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <div className="bg-[var(--site-bg)] text-[var(--site-text)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 pb-8 pt-8 lg:grid-cols-[minmax(0,1.18fr)_minmax(380px,0.82fr)] lg:items-start lg:gap-14 xl:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <ProductImageGallery
              mainImage={normalizedProduct.mainImage}
              images={images}
              title={stripHtml(productName)}
            />
          </div>

          <div className="flex w-full max-w-2xl flex-col gap-6 max-lg:max-w-none">
            <div className="space-y-4 border-b border-[var(--site-border)] pb-6">
              {normalizedProduct.manufacturer ? (
                <p className="text-sm font-black uppercase tracking-[0.22em] text-[var(--site-muted)]">
                  {sanitize(normalizedProduct.manufacturer)}
                </p>
              ) : null}
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <h1 className="max-w-3xl break-words text-3xl font-black leading-[1.08] text-[var(--site-text)] sm:text-4xl xl:text-[2.7rem]">
                  {sanitize(productName)}
                </h1>
                <p className="shrink-0 text-3xl font-black text-[var(--site-accent)] sm:text-4xl">
                  ${normalizedProduct.price.toFixed(2)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-[var(--site-muted)]">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-[var(--site-accent)]">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <FaStar
                        key={index}
                        className={`h-4 w-4 ${
                          index < Math.round(Number(normalizedProduct.rating || 0))
                            ? "opacity-100"
                            : "opacity-25"
                        }`}
                      />
                    ))}
                  </div>
                  <span>{Number(normalizedProduct.rating || 0).toFixed(1)} / 5</span>
                </div>
                <span>Including VAT</span>
              </div>

              {shortDescription ? (
                <p className="max-w-3xl text-base leading-7 text-[var(--site-muted)] sm:text-lg">
                  {sanitize(shortDescription)}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2 text-base leading-7 text-[var(--site-text)] sm:text-lg">
              <p>
                <span className="font-black">SKU:</span>{" "}
                <span className="text-[var(--site-muted)]">
                  {sanitize(normalizedProduct.sku || normalizedProduct.slug || "-")}
                </span>
              </p>
              <p>
                <span className="font-black">Category:</span>{" "}
                <span className="text-[var(--site-muted)]">
                  {sanitize(normalizedProduct.category?.name || "No category")}
                </span>
              </p>
            </div>

            <div className="border-t border-[var(--site-border)] pt-5">
              <div className="flex flex-col gap-3 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <StockAvailabillity
                  stock={normalizedProduct.inStock}
                  inStock={normalizedProduct.inStock}
                />
                {normalizedProduct.inStock > 0 && normalizedProduct.inStock <= 5 ? (
                  <UrgencyText stock={normalizedProduct.inStock} />
                ) : null}
              </div>
              <div className="border-t border-[var(--site-border)] pt-5">
                <SingleProductDynamicFields product={normalizedProduct} />
              </div>
            </div>
          </div>
        </div>
        <div className="py-12 sm:py-16">
          <ProductTabs product={normalizedProduct} />
        </div>

        {relatedProducts.length > 0 ? (
          <section className="border-t border-[var(--site-border)] py-12 sm:py-16">
            <div className="mb-6 flex flex-col gap-2">
              <p className="text-sm font-bold uppercase text-[var(--site-accent)]">
                More like this
              </p>
              <Heading
                title={
                  normalizedProduct.category?.name
                    ? `More ${normalizedProduct.category.name}`
                    : "Recommended gear"
                }
              />
              <p className="max-w-2xl text-sm text-[var(--site-muted)] sm:text-base">
                Similar products picked mainly from the same category, with close brand matches
                mixed in when available.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {relatedProducts.map((relatedProduct) => (
                <ProductItem key={relatedProduct.id} product={relatedProduct} quickAddEnabled />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default SingleProductPage;
