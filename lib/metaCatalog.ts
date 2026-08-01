import { getValidSalePrice } from "./productPrice";
import { sanitize } from "./sanitize";

const META_CATALOG_HEADERS = [
  "id",
  "title",
  "description",
  "availability",
  "condition",
  "price",
  "link",
  "image_link",
  "brand",
  "sale_price",
  "inventory",
  "product_type",
  "mpn",
] as const;

const normalizeText = (value: string | null | undefined) =>
  sanitize(value || "")
    .replace(/\s+/g, " ")
    .trim();

const toAbsoluteUrl = (value: string, siteUrl: string) => {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return new URL(value.startsWith("/") ? value : `/${value}`, siteUrl).toString();
};

const escapeCsvCell = (value: string | number) => {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export type MetaCatalogExport = {
  csv: string;
  exportedCount: number;
  skippedCount: number;
};

export function buildMetaCatalogCsv(
  products: Product[],
  siteUrl: string
): MetaCatalogExport {
  const normalizedSiteUrl = siteUrl.replace(/\/+$/, "");
  const rows: Array<Array<string | number>> = [];
  let skippedCount = 0;

  products.forEach((product) => {
    const title = normalizeText(product.title || product.model);
    const regularPrice = Number(product.price);

    if (
      !product.isActive ||
      !title ||
      !product.mainImage ||
      !Number.isFinite(regularPrice) ||
      regularPrice <= 0
    ) {
      skippedCount += 1;
      return;
    }

    const catalogId = product.sku?.trim() || product.id;
    const productPath = encodeURIComponent(product.slug?.trim() || product.id);
    const brand = normalizeText(product.manufacturer) || "Elite Setup";
    const description =
      normalizeText(product.description) || `${title} available from Elite Setup.`;
    const salePrice = getValidSalePrice(product);

    rows.push([
      catalogId,
      title,
      description,
      product.inStock > 0 ? "in stock" : "out of stock",
      "new",
      `${regularPrice.toFixed(2)} USD`,
      `${normalizedSiteUrl}/product/${productPath}`,
      toAbsoluteUrl(product.mainImage, normalizedSiteUrl),
      brand,
      salePrice === null ? "" : `${salePrice.toFixed(2)} USD`,
      Math.max(0, Math.trunc(Number(product.inStock) || 0)),
      normalizeText(product.category?.name),
      product.sku?.trim() || "",
    ]);
  });

  const csv = [META_CATALOG_HEADERS, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");

  return {
    csv,
    exportedCount: rows.length,
    skippedCount,
  };
}
