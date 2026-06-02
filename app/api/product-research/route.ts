import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

type SearchResult = {
  title: string;
  url: string;
  snippet: string;
};

type ImageSuggestion = {
  url: string;
  source?: string;
};

type ResearchCategory = {
  id: string;
  name: string;
};

export const runtime = "nodejs";

const MAX_QUERY_LENGTH = 120;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(value: string) {
  return decodeHtml(value.replace(/<[^>]*>/g, " "));
}

function cleanUrl(value: string) {
  const decoded = decodeHtml(value);
  try {
    const url = new URL(decoded, "https://duckduckgo.com");
    const duckTarget = url.searchParams.get("uddg");
    return duckTarget ? decodeURIComponent(duckTarget) : decoded;
  } catch {
    return decoded;
  }
}

function cleanTitle(value: string) {
  return decodeHtml(value)
    .replace(/\s+[-|]\s+(Amazon|eBay|Best Buy|Walmart|YouTube|Reddit).*$/i, "")
    .replace(/\s+[-|]\s+Official.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferManufacturer(query: string, titles: string[]) {
  const knownBrands = [
    "Apple",
    "Samsung",
    "Sony",
    "Logitech",
    "HyperX",
    "Razer",
    "Corsair",
    "SteelSeries",
    "ASUS",
    "Acer",
    "Lenovo",
    "HP",
    "Dell",
    "MSI",
    "Gigabyte",
    "Intel",
    "AMD",
    "NVIDIA",
    "PlayStation",
    "Xbox",
    "Canon",
    "Nikon",
    "JBL",
    "Anker",
  ];
  const haystack = `${query} ${titles.join(" ")}`;
  const brand = knownBrands.find((entry) => new RegExp(`\\b${entry}\\b`, "i").test(haystack));
  return brand || query.trim().split(/\s+/)[0] || "";
}

function guessCategory(query: string, categories: ResearchCategory[] = []) {
  const normalizedQuery = query.toLowerCase();
  const keywordMap: Record<string, string[]> = {
    laptop: ["laptop", "notebook", "macbook"],
    "gaming-laptops": ["gaming laptop", "rog", "legion", "predator", "katana"],
    "gaming-mice": ["mouse", "mice", "superlight", "deathadder", "viper"],
    "gaming-keyboards": ["keyboard", "keychron", "alloy", "huntsman"],
    "gaming-headsets": ["headset", "headphone", "earbuds", "cloud", "arctis"],
    "gaming-monitors": ["monitor", "display", "odyssey"],
    "gaming-pcs": ["gaming pc", "desktop pc", "prebuilt"],
    "pc-components": ["gpu", "graphics card", "cpu", "processor", "motherboard", "ram", "ssd"],
    phones: ["iphone", "galaxy", "phone", "smartphone"],
    tablets: ["ipad", "tablet"],
    cameras: ["camera", "canon", "nikon", "sony alpha"],
  };

  for (const category of categories) {
    const categoryName = category.name.toLowerCase();
    const terms = [categoryName, categoryName.replace(/-/g, " "), ...(keywordMap[categoryName] || [])];
    if (terms.some((term) => normalizedQuery.includes(term))) {
      return category.id;
    }
  }

  return "";
}

function buildDescription(title: string, manufacturer: string, snippets: string[]) {
  const featureText = snippets.join(" ");
  const features = [
    "gaming",
    "wireless",
    "bluetooth",
    "rgb",
    "lightweight",
    "4k",
    "oled",
    "noise cancelling",
    "fast charging",
    "mechanical",
    "ssd",
    "ddr5",
    "144hz",
    "240hz",
  ].filter((term) => new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(featureText));

  const featureSentence =
    features.length > 0
      ? ` Key highlights include ${features.slice(0, 5).join(", ")}.`
      : "";

  return `${title} is a ${manufacturer ? `${manufacturer} ` : ""}product built for customers who want dependable performance and a polished everyday experience.${featureSentence} Add it to your setup for a practical balance of quality, usability, and value.`;
}

async function fetchSearchResults(query: string): Promise<SearchResult[]> {
  const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(`${query} official product specs`)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
  });

  if (!response.ok) return [];

  const html = await response.text();
  const results: SearchResult[] = [];
  const resultRegex =
    /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  let match;

  while ((match = resultRegex.exec(html)) && results.length < 6) {
    results.push({
      title: cleanTitle(stripTags(match[2])),
      url: cleanUrl(match[1]),
      snippet: stripTags(match[3]),
    });
  }

  return results;
}

async function fetchImageSuggestions(query: string): Promise<ImageSuggestion[]> {
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(`${query} product`)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
  });

  if (!response.ok) return [];

  const html = await response.text();
  const imageUrls = new Set<string>();
  const imageRegex = /murl&quot;:&quot;(https?:\/\/.*?)(?:&quot;|")/g;
  let match;

  while ((match = imageRegex.exec(html)) && imageUrls.size < 8) {
    imageUrls.add(decodeHtml(match[1]).replace(/\\\//g, "/"));
  }

  return [...imageUrls].map((imageUrl) => ({ url: imageUrl }));
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return (session as any)?.user?.role === "admin";
}

async function researchProduct(request: Request) {
  const body = await request.json();
  const query = String(body.query || "").trim().slice(0, MAX_QUERY_LENGTH);
  const categories = Array.isArray(body.categories) ? body.categories : [];

  if (!query) {
    return NextResponse.json({ error: "Product name or model is required." }, { status: 400 });
  }

  const [searchResults, imageSuggestions] = await Promise.all([
    fetchSearchResults(query),
    fetchImageSuggestions(query),
  ]);

  const titleSuggestions = [
    ...new Set([query, ...searchResults.map((result) => result.title).filter(Boolean)]),
  ].slice(0, 5);
  const preferredTitle = titleSuggestions[0] || query;
  const manufacturer = inferManufacturer(query, titleSuggestions);

  return NextResponse.json({
    query,
    titleSuggestions,
    manufacturerSuggestions: manufacturer ? [manufacturer] : [],
    categoryId: guessCategory(query, categories),
    descriptionSuggestions: [
      buildDescription(preferredTitle, manufacturer, searchResults.map((result) => result.snippet)),
    ],
    imageSuggestions,
    sources: searchResults,
  });
}

async function importImage(request: Request) {
  const body = await request.json();
  const imageUrl = String(body.imageUrl || "").trim();
  const fileNameSeed = String(body.fileNameSeed || "product").trim();

  if (!/^https?:\/\//i.test(imageUrl)) {
    return NextResponse.json({ error: "A valid image URL is required." }, { status: 400 });
  }

  const response = await fetch(imageUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Could not download that image." }, { status: 400 });
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "The selected URL is not an image." }, { status: 400 });
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image is too large. Choose another photo." }, { status: 400 });
  }

  const extension = contentType.includes("png")
    ? "png"
    : contentType.includes("webp")
      ? "webp"
      : "jpg";
  const safeName = fileNameSeed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const fileName = `${Date.now()}-${safeName || "product"}.${extension}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const destinationPath = path.join(uploadDir, fileName);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(destinationPath, bytes);

  return NextResponse.json({
    path: path.posix.join("uploads", fileName),
  });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = await request.clone().json().catch(() => ({}));
  const action = String(body.action || "research");

  if (action === "importImage") {
    return importImage(request);
  }

  return researchProduct(request);
}
