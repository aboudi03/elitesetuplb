import { BuildPcFloatingButton, CategoryMenu, Hero, ProductsSection } from "@/components";
import apiClient from "@/lib/api";
import { readNavbarCategories } from "@/lib/navbarCategories.server";

export const dynamic = "force-dynamic";

async function getHeroSlides() {
  try {
    const response = await apiClient.get("/api/hero-slides", {
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const slides = await response.json();

    if (!Array.isArray(slides)) {
      return [];
    }

    return slides.map((slide: any) => ({
      id: slide.id,
      eyebrow: slide.eyebrow,
      title: slide.title,
      subtitle: slide.subtitle,
      image: `/${slide.backgroundImage}`,
      productImage: `/${slide.productImage}`,
      href: slide.href,
      isActive: slide.isActive,
      sortOrder: slide.sortOrder,
      productWrapClassName:
        "right-[12%] bottom-4 h-[72%] max-md:bottom-16 max-md:h-[34%] max-sm:bottom-14 max-sm:h-[30%]",
      productImageClassName:
        "max-h-full w-auto object-contain drop-shadow-[0_28px_35px_rgba(0,0,0,0.3)]",
    }));
  } catch (error) {
    console.error("Failed to load homepage hero slides:", error);
    return [];
  }
}

export default async function Home() {
  const [navbarCategories, heroSlides] = await Promise.all([
    readNavbarCategories(),
    getHeroSlides(),
  ]);

  return (
    <>
    <Hero initialNavbarCategories={navbarCategories} initialSlides={heroSlides} />
    <BuildPcFloatingButton />
    <CategoryMenu />
    <ProductsSection />
    </>
  );
}
