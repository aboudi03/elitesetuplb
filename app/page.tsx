import { BuildPcFloatingButton, CategoryMenu, Hero, ProductsSection } from "@/components";
import { getHomepageData } from "@/lib/homepage.server";

export const revalidate = 60;

export default async function Home() {
  const { navbarCategories, heroSlides, menuItems, products, featuredBrands } =
    await getHomepageData();

  return (
    <>
    <Hero initialNavbarCategories={navbarCategories} initialSlides={heroSlides} />
    <BuildPcFloatingButton />
    <CategoryMenu menuItems={menuItems} />
    <ProductsSection products={products} featuredBrands={featuredBrands} />
    </>
  );
}
