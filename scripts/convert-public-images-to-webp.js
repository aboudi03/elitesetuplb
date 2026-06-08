const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const sharp = require("sharp");
const { PrismaClient } = require("@prisma/client");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const prisma = new PrismaClient();
const projectRoot = path.join(__dirname, "..");
const publicRoot = path.join(projectRoot, "public");
const textExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".css",
  ".md",
  ".txt",
  ".html",
  ".csv",
  ".d.ts",
]);
const skipDirectories = new Set([".git", ".next", "node_modules", "server\\node_modules"]);

function toPosix(value) {
  return value.replace(/\\/g, "/");
}

async function walkFiles(directoryPath, results = []) {
  const entries = await fs.promises.readdir(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(directoryPath, entry.name);
    const relativePath = path.relative(projectRoot, absolutePath);

    if (entry.isDirectory()) {
      if (skipDirectories.has(relativePath) || skipDirectories.has(entry.name)) {
        continue;
      }

      await walkFiles(absolutePath, results);
      continue;
    }

    results.push(absolutePath);
  }

  return results;
}

async function convertPublicFiles() {
  const files = await walkFiles(publicRoot);
  const conversions = new Map();

  for (const absolutePath of files) {
    const extension = path.extname(absolutePath).toLowerCase();
    if (![".png", ".jpg", ".jpeg"].includes(extension)) {
      continue;
    }

    const targetAbsolutePath = absolutePath.replace(/\.(png|jpg|jpeg)$/i, ".webp");
    await sharp(absolutePath).rotate().webp({ quality: 82 }).toFile(targetAbsolutePath);
    await fs.promises.rm(absolutePath, { force: true });

    const oldRelativePath = toPosix(path.relative(publicRoot, absolutePath));
    const newRelativePath = toPosix(path.relative(publicRoot, targetAbsolutePath));
    conversions.set(oldRelativePath, newRelativePath);
  }

  return conversions;
}

async function updateTextReferences(conversions) {
  const files = await walkFiles(projectRoot);
  let updatedCount = 0;

  for (const absolutePath of files) {
    if (absolutePath.startsWith(publicRoot)) {
      continue;
    }

    const extension = path.extname(absolutePath).toLowerCase();
    if (!textExtensions.has(extension)) {
      continue;
    }

    let contents = await fs.promises.readFile(absolutePath, "utf8");
    let changed = false;

    for (const [oldRelativePath, newRelativePath] of conversions.entries()) {
      const replacements = [
        [oldRelativePath, newRelativePath],
        [`/${oldRelativePath}`, `/${newRelativePath}`],
      ];

      for (const [oldValue, newValue] of replacements) {
        if (contents.includes(oldValue)) {
          contents = contents.split(oldValue).join(newValue);
          changed = true;
        }
      }
    }

    if (changed) {
      await fs.promises.writeFile(absolutePath, contents, "utf8");
      updatedCount += 1;
    }
  }

  return updatedCount;
}

async function updateDatabaseReferences(conversions) {
  let updates = 0;

  for (const [oldRelativePath, newRelativePath] of conversions.entries()) {
    const [products, galleryImages, heroProductImages, heroBackgrounds, brands, categories] =
      await Promise.all([
        prisma.product.updateMany({
          where: { mainImage: oldRelativePath },
          data: { mainImage: newRelativePath },
        }),
        prisma.image.updateMany({
          where: { image: oldRelativePath },
          data: { image: newRelativePath },
        }),
        prisma.heroSlide.updateMany({
          where: { productImage: oldRelativePath },
          data: { productImage: newRelativePath },
        }),
        prisma.heroSlide.updateMany({
          where: { backgroundImage: oldRelativePath },
          data: { backgroundImage: newRelativePath },
        }),
        prisma.featuredBrand.updateMany({
          where: { logo: oldRelativePath },
          data: { logo: newRelativePath },
        }),
        prisma.category.updateMany({
          where: { menuImage: oldRelativePath },
          data: { menuImage: newRelativePath },
        }),
      ]);

    updates +=
      products.count +
      galleryImages.count +
      heroProductImages.count +
      heroBackgrounds.count +
      brands.count +
      categories.count;
  }

  return updates;
}

async function main() {
  try {
    const conversions = await convertPublicFiles();
    const updatedFiles = await updateTextReferences(conversions);
    const updatedRows = await updateDatabaseReferences(conversions);

    console.log(`Converted ${conversions.size} public images to WebP.`);
    console.log(`Updated ${updatedFiles} source files.`);
    console.log(`Updated ${updatedRows} database image references.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Failed to convert public images:", error);
  process.exitCode = 1;
});
