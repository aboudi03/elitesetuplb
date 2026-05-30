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
      <div className="flex min-h-36 flex-col items-center justify-center gap-y-4 rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] px-4 py-6 text-[var(--site-text)] transition hover:-translate-y-1 hover:border-[var(--site-accent)] hover:bg-[var(--site-panel-soft)]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--site-accent-soft)] p-3 transition group-hover:bg-[var(--site-accent)]">
        {children}
        </div>

        <h3 className="text-center text-base font-black uppercase">{title}</h3>
      </div>
    </Link>
  );
};

export default CategoryItem;
