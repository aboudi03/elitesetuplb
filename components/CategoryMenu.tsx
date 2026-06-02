// *********************
// Role of the component: Category wrapper that will contain title and category items
// Name of the component: CategoryMenu.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <CategoryMenu />
// Input parameters: no input parameters
// Output: section title and category items
// *********************

import React from "react";
import CategoryItem from "./CategoryItem";
import Image from "next/image";
import { categoryMenuList } from "@/lib/utils";

const CategoryMenu = () => {
  return (
    <section className="bg-[var(--site-bg)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-screen-2xl">
        <div className="mb-6 flex items-end justify-between gap-4 rounded-[1.75rem] border border-[var(--site-border)] bg-[linear-gradient(135deg,var(--site-panel),color-mix(in_srgb,var(--site-panel-soft)_72%,white_28%))] px-6 py-5 shadow-sm max-sm:flex-col max-sm:items-start">
          <div>
            <p className="text-sm font-bold uppercase text-[var(--site-accent)]">Shop fast</p>
            <h2 className="mt-2 text-3xl font-black uppercase text-[var(--site-text)] max-sm:text-2xl">
              Browse categories
            </h2>
          </div>
        </div>
      <div className="grid grid-cols-5 gap-4 max-lg:grid-cols-3 max-md:grid-cols-2 max-[450px]:grid-cols-1">
        {categoryMenuList.map((item) => (
          <CategoryItem title={item.title} key={item.id} href={item.href}>
            <Image src={item.src} width={48} height={48} alt={item.title} className="h-10 w-10 object-contain" />
          </CategoryItem>
        ))}
      </div>
      </div>
    </section>
  );
};

export default CategoryMenu;
