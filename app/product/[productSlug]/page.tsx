import {
  StockAvailabillity,
  UrgencyText,

  ProductTabs,
  SingleProductDynamicFields,
  
} from "@/components";
import apiClient from "@/lib/api";
import Image from "next/image";
import { notFound } from "next/navigation";
import React from "react";
import { sanitize } from "@/lib/sanitize";

interface ImageItem {
  imageID: string;
  productID: string;
  image: string;
}

interface SingleProductPageProps {
  params: Promise<{  productSlug: string, id: string }>;
}

const SingleProductPage = async ({ params }: SingleProductPageProps) => {
  const paramsAwaited = await params;
  // sending API request for a single product with a given product slug
  const data = await apiClient.get(
    `/api/slugs/${paramsAwaited?.productSlug}`
  );
  const product = await data.json();

  // sending API request for more than 1 product image if it exists
  const imagesData = await apiClient.get(
    `/api/images/${paramsAwaited?.id}`
  );
  const images = await imagesData.json();

  if (!product || product.error) {
    notFound();
  }

  return (
    <div className="bg-[var(--site-bg)] text-[var(--site-text)]">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-x-16 gap-y-8 pt-10 max-lg:flex-col">
          <div className="w-full max-w-xl">
            <Image
              src={product?.mainImage ? `/${product?.mainImage}` : "/product_placeholder.jpg"}
              width={500}
              height={500}
              alt="main image"
              className="mx-auto h-auto max-h-[520px] w-auto max-w-full object-contain"
            />
            <div className="flex justify-around mt-5 flex-wrap gap-y-1 max-[500px]:justify-center max-[500px]:gap-x-1">
              {images?.map((imageItem: ImageItem, key: number) => (
                <Image
                  key={imageItem.imageID + key}
                  src={`/${imageItem.image}`}
                  width={100}
                  height={100}
                  alt="laptop image"
                  className="h-20 w-20 object-contain"
                />
              ))}
            </div>
          </div>
          <div className="flex w-full max-w-xl flex-col gap-y-7 max-[500px]:text-center">
        
            <h1 className="break-words text-3xl max-sm:text-2xl">{sanitize(product?.title)}</h1>
            <p className="text-xl font-semibold">${product?.price}</p>
            <StockAvailabillity stock={product?.inStock} inStock={product?.inStock} />
            {product?.inStock > 0 && <UrgencyText stock={product?.inStock} />}
            <div className="flex flex-col gap-y-2 max-[500px]:items-center">
              <p className="text-lg">
                SKU: <span className="ml-1">abccd-18</span>
              </p>
            </div>
            <SingleProductDynamicFields product={product} />
          </div>
        </div>
        <div className="py-16">
          <ProductTabs product={product} />
        </div>
      </div>
    </div>
  );
};

export default SingleProductPage;
