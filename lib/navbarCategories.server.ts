import { readFile } from "fs/promises";
import path from "path";
import { fallbackNavbarCategories, type NavbarCategoryItem } from "./navbarCategories";

const navbarCategoriesFilePath = path.join(
  process.cwd(),
  "data",
  "navbar-categories.json"
);

export async function readNavbarCategories(): Promise<NavbarCategoryItem[]> {
  try {
    const fileContents = await readFile(navbarCategoriesFilePath, "utf8");
    const parsed = JSON.parse(fileContents);
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : fallbackNavbarCategories;
  } catch {
    return fallbackNavbarCategories;
  }
}
