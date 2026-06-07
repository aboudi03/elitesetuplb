export interface ParsedProductColor {
  key: string;
  label: string;
  swatch: string;
}

const COLOR_NAME_TO_HEX: Record<string, string> = {
  black: "#111111",
  white: "#f8fafc",
  red: "#dc2626",
  blue: "#2563eb",
  green: "#16a34a",
  yellow: "#eab308",
  orange: "#f97316",
  purple: "#9333ea",
  pink: "#ec4899",
  gray: "#6b7280",
  grey: "#6b7280",
  silver: "#c0c0c0",
  gold: "#d4af37",
  navy: "#1e3a8a",
  beige: "#d6c5a4",
  brown: "#8b5e3c",
  cyan: "#06b6d4",
  magenta: "#d946ef",
  transparent: "transparent",
};

const COLOR_LINE_REGEX = /^\s*colors?\s*:\s*(.+)$/im;
const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const toLabel = (value: string) =>
  value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeColorToken = (value: string) => value.trim().toLowerCase();

const resolveColorSwatch = (value: string) => {
  const normalized = normalizeColorToken(value);
  if (HEX_COLOR_REGEX.test(value.trim())) {
    return value.trim();
  }

  return COLOR_NAME_TO_HEX[normalized] || "#d1d5db";
};

const parseOptionTokens = (value?: string | null) =>
  String(value || "")
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

export const getProductColorsFromDescription = (description?: string | null) => {
  if (!description) {
    return [] as ParsedProductColor[];
  }

  const match = description.match(COLOR_LINE_REGEX);
  if (!match?.[1]) {
    return [] as ParsedProductColor[];
  }

  return parseColorTokens(match[1]);
};

export const parseColorTokens = (value?: string | null) => {
  const tokens = parseOptionTokens(value);
  const seen = new Set<string>();

  return tokens.reduce<ParsedProductColor[]>((accumulator, token) => {
    const key = normalizeColorToken(token);
    if (!key || seen.has(key)) {
      return accumulator;
    }

    seen.add(key);
    accumulator.push({
      key,
      label: toLabel(token),
      swatch: resolveColorSwatch(token),
    });

    return accumulator;
  }, []);
};

export const getProductColors = (product?: Pick<Product, "colors" | "description"> | null) => {
  if (product?.colors && product.colors.trim().length > 0) {
    return parseColorTokens(product.colors);
  }

  return getProductColorsFromDescription(product?.description);
};

export const getProductSizes = (product?: Pick<Product, "sizes"> | null) => {
  const tokens = parseOptionTokens(product?.sizes);
  const seen = new Set<string>();

  return tokens.reduce<Array<{ key: string; label: string }>>((accumulator, token) => {
    const key = token.toLowerCase();
    if (!key || seen.has(key)) {
      return accumulator;
    }

    seen.add(key);
    accumulator.push({
      key,
      label: toLabel(token),
    });

    return accumulator;
  }, []);
};
