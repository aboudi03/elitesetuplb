// *********************
// Role of the component: Category Item that will display category icon, category name and link to the category
// Name of the component: CategoryItem.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <CategoryItem title={title} href={href} ><Image /></CategoryItem>
// Input parameters: CategoryItemProps interface
// Output: Category icon, category name and link to the category
// *********************

import Link from "next/link";
import React, { type ReactNode } from "react";

interface CategoryItemProps {
  children: ReactNode;
  title: string;
  href: string;
}

const CategoryItem = ({ title, children, href }: CategoryItemProps) => {
  return (
    <Link href={href} className="group">
      <div className="flex min-h-36 flex-col items-center justify-center gap-y-4 rounded-2xl border border-[var(--site-border)] bg-[linear-gradient(180deg,var(--site-panel),var(--site-panel-soft))] px-4 py-6 text-[var(--site-text)] shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-[var(--site-accent)] hover:bg-[var(--site-panel-soft)] hover:shadow-[0_20px_44px_rgba(0,0,0,0.16)]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(225,29,46,0.3)] bg-[rgba(225,29,46,0.18)] p-3 transition duration-300 group-hover:scale-105 group-hover:border-[rgba(225,29,46,0.5)] group-hover:bg-[rgba(225,29,46,0.28)]">
        {children}
        </div>

        <h3 className="text-center text-base font-black uppercase tracking-[0.08em]">{title}</h3>
      </div>
    </Link>
  );
};

export default CategoryItem;
