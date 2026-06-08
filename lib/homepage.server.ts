import { unstable_cache } from "next/cache";
import prisma from "@/utils/db";
import { fallbackNavbarCategories, type NavbarCategoryItem } from "./navbarCategories";
import { readNavbarCategories } from "./navbarCategories.server";
import { formatCategoryName } from "@/utils/categoryFormating";

type HeroSlideViewModel = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  image: string;
  productImage: string;
  href: string;
  isActive: boolean;
  sortOrder: number;
  productWrapClassName: string;
  productImageClassName: string;
};

const heroSlideClasses = {
  productWrapClassName:
    "right-[12%] bottom-4 h-[72%] max-md:bottom-16 max-md:h-[34%] max-sm:bottom-14 max-sm:h-[30%]",
  productImageClassName:
    "max-h-full w-auto object-contain drop-shadow-[0_28px_35px_rgba(0,0,0,0.3)]",
};

const getCachedHeroSlides = unstable_cache(
  async (): Promise<HeroSlideViewModel[]> => {
    const slides = await prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return slides.map((slide) => ({
      id: slide.id,
      eyebrow: slide.eyebrow,
      title: slide.title,
      subtitle: slide.subtitle,
      image: `/${slide.backgroundImage}`,
      productImage: `/${slide.productImage}`,
      href: slide.href,
      isActive: slide.isActive,
      sortOrder: slide.sortOrder,
      ...heroSlideClasses,
    }));
  },
  ["homepage-hero-slides"],
  { revalidate: 60 }
);

const getCachedFeaturedProducts = unstable_cache(
  async (): Promise<Product[]> => {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        featured: true,
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        merchant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ featuredSortOrder: "asc" }, { createdAt: "desc" }],
    });

    return products.map((product) => ({
      ...product,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    }));
  },
  ["homepage-featured-products"],
  { revalidate: 60 }
);

const getCachedFeaturedBrands = unstable_cache(
  async (): Promise<FeaturedBrand[]> => {
    const brands = await prisma.featuredBrand.findMany({
      where: { isActive: true },
      include: {
        products: {
          orderBy: {
            sortOrder: "asc",
          },
          include: {
            product: {
              include: {
                category: {
                  select: {
                    name: true,
                  },
                },
                merchant: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return brands
      .map((brand) => ({
        id: brand.id,
        title: brand.title,
        logo: brand.logo,
        isActive: brand.isActive,
        sortOrder: brand.sortOrder,
        products: brand.products
          .filter((item) => item.product?.isActive)
          .map((item) => ({
            id: item.id,
            sortOrder: item.sortOrder,
            productId: item.productId,
            product: {
              ...item.product,
              createdAt: item.product.createdAt.toISOString(),
              updatedAt: item.product.updatedAt.toISOString(),
            },
          })),
      }))
      .filter((brand) => brand.products.length > 0);
  },
  ["homepage-featured-brands"],
  { revalidate: 60 }
);

const getCachedCategoryMenuItems = unstable_cache(
  async (): Promise<
    Array<{
      id: string;
      title: string;
      href: string;
      src: string;
    }>
  > => {
    const categories = await prisma.category.findMany({
      where: {
        menuImage: {
          not: null,
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        menuImage: true,
      },
    });

    return categories
      .filter((category) => category.menuImage)
      .map((category) => ({
        id: category.id,
        title: formatCategoryName(category.name),
        href: `/shop/${category.name}`,
        src: category.menuImage as string,
      }));
  },
  ["homepage-category-menu-items"],
  { revalidate: 60 }
);

const getCachedNavbarCategories = unstable_cache(
  async (): Promise<NavbarCategoryItem[]> => {
    const categories = await readNavbarCategories();
    return categories.length > 0 ? categories : fallbackNavbarCategories;
  },
  ["homepage-navbar-categories"],
  { revalidate: 60 }
);

export async function getHomepageData() {
  const [navbarCategories, heroSlides, menuItems, products, featuredBrands] = await Promise.all([
    getCachedNavbarCategories(),
    getCachedHeroSlides(),
    getCachedCategoryMenuItems(),
    getCachedFeaturedProducts(),
    getCachedFeaturedBrands(),
  ]);

  return {
    navbarCategories,
    heroSlides,
    menuItems,
    products,
    featuredBrands,
  };
}
