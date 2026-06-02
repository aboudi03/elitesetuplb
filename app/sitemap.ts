import type { MetadataRoute } from "next";
import prisma from "@/utils/db";
import { absoluteUrl } from "@/lib/seo";

type SitemapProduct = {
  slug: string;
  updatedAt: Date;
};

type SitemapCategory = {
  name: string;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      priority: 1,
      changeFrequency: "daily",
    },
    {
      url: absoluteUrl("/shop"),
      priority: 0.9,
      changeFrequency: "daily",
    },
    {
      url: absoluteUrl("/build-a-pc"),
      priority: 0.8,
      changeFrequency: "weekly",
    },
  ];

  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: {
          isActive: true,
        },
        select: {
          slug: true,
          updatedAt: true,
        },
      }),
      prisma.category.findMany({
        select: {
          name: true,
        },
      }),
    ]);

    const productRoutes = (products as SitemapProduct[]).map((product) => ({
      url: absoluteUrl(`/product/${product.slug}`),
      lastModified: product.updatedAt,
      priority: 0.8,
      changeFrequency: "daily" as const,
    }));

    const categoryRoutes = (categories as SitemapCategory[]).map((category) => ({
      url: absoluteUrl(`/shop/${category.name}`),
      priority: 0.7,
      changeFrequency: "daily" as const,
    }));

    return [...staticRoutes, ...categoryRoutes, ...productRoutes];
  } catch (error) {
    console.error("Failed to build sitemap:", error);
    return staticRoutes;
  }
}
