import {
  StockAvailabillity,
  UrgencyText,

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

  // sending API request for more than 1 product image if it exists
  const imagesData = await apiClient.get(`/api/images/${normalizedProduct.id}`, {
    cache: "no-store",
  });
  const rawImages = imagesData.ok ? await imagesData.json() : [];
  const images: ImageItem[] = Array.isArray(rawImages) ? rawImages : [];

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
        <div className="flex items-center justify-center gap-x-16 gap-y-8 pt-10 max-lg:flex-col">
          <ProductImageGallery
            mainImage={normalizedProduct.mainImage}
            images={images}
            title={stripHtml(productName)}
          />
          <div className="flex w-full max-w-xl flex-col gap-y-7 max-[500px]:text-center">
        
            <h1 className="break-words text-3xl max-sm:text-2xl">{sanitize(productName)}</h1>
            <p className="text-xl font-semibold">${normalizedProduct.price.toFixed(2)}</p>
            <StockAvailabillity stock={normalizedProduct.inStock} inStock={normalizedProduct.inStock} />
            {normalizedProduct.inStock > 0 && normalizedProduct.inStock <= 5 && <UrgencyText stock={normalizedProduct.inStock} />}
            <div className="flex flex-col gap-y-2 max-[500px]:items-center">
              <p className="text-lg">
                SKU: <span className="ml-1">{normalizedProduct.sku || normalizedProduct.slug || "-"}</span>
              </p>
            </div>
            <SingleProductDynamicFields product={normalizedProduct} />
          </div>
        </div>
        <div className="py-16">
          <ProductTabs product={normalizedProduct} />
        </div>
      </div>
    </div>
  );
};

export default SingleProductPage;
