import config from "@/lib/config";

export const STORE_NAME = "Elite Setup";
export const STORE_LOCATION = "Lebanon";

export const siteUrl = config.nextAuthUrl;

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function stripHtml(value: string | null | undefined) {
  return (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(value: string, maxLength = 155) {
  if (value.length <= maxLength) return value;
  const trimmed = value.slice(0, maxLength - 1).trimEnd();
  return `${trimmed}...`;
}

export function toTitleCase(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function productImageUrl(image: string | null | undefined) {
  return absoluteUrl(image ? `/${image.replace(/^\/+/, "")}` : "/product_placeholder.webp");
}

export function buildMetaDescription(
  fallback: string,
  description?: string | null,
  maxLength = 155
) {
  const cleanDescription = stripHtml(description);
  return truncate(cleanDescription || fallback, maxLength);
}
