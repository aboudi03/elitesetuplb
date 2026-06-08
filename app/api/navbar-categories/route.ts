import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { NavbarCategoryItem } from "@/lib/navbarCategories";
import { readNavbarCategories } from "@/lib/navbarCategories.server";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const dataDirectory = path.join(process.cwd(), "data");
const navbarCategoriesFilePath = path.join(dataDirectory, "navbar-categories.json");

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return (session as any)?.user?.role === "admin";
}

function sanitizeCategoryItem(item: any): NavbarCategoryItem | null {
  if (!item || typeof item !== "object") return null;

  const id = String(item.id || "").trim();
  const label = String(item.label || "").trim();
  const href = String(item.href || "").trim();

  if (!id || !label || !href) {
    return null;
  }

  const children = Array.isArray(item.children)
    ? item.children
        .map((child: unknown) => sanitizeCategoryItem(child))
        .filter((child: NavbarCategoryItem | null): child is NavbarCategoryItem => Boolean(child))
    : undefined;

  return {
    id,
    label,
    href,
    ...(children && children.length > 0 ? { children } : {}),
  };
}

function sanitizeNavbarCategories(payload: any): NavbarCategoryItem[] {
  if (!Array.isArray(payload)) return [];

  return payload
    .map((item) => sanitizeCategoryItem(item))
    .filter((item): item is NavbarCategoryItem => Boolean(item));
}

export async function GET() {
  const categories = await readNavbarCategories();
  return NextResponse.json(categories);
}

export async function PUT(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const categories = sanitizeNavbarCategories(body?.categories);

  if (categories.length === 0) {
    return NextResponse.json(
      { error: "At least one navbar category is required." },
      { status: 400 }
    );
  }

  await mkdir(dataDirectory, { recursive: true });
  await writeFile(navbarCategoriesFilePath, `${JSON.stringify(categories, null, 2)}\n`, "utf8");

  return NextResponse.json({ success: true, categories });
}
