const fs = require("fs");
const path = require("path");
const prisma = require("../utills/db");
const {
  convertPublicImageToWebp,
  writeWebpFromBuffer,
} = require("../utills/imageConversion");

function buildFileNameSeed(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

async function uploadMainImage(req, res) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ message: "No uploaded files were provided" });
  }

  const uploadedFile = req.files.uploadedFile;
  const safeName = uploadedFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const baseName = path.basename(safeName, path.extname(safeName)) || `image-${Date.now()}`;
  const requestedFileNameSeed =
    typeof req.body?.fileNameSeed === "string" ? req.body.fileNameSeed.trim() : "";
  const normalizedFileNameSeed = buildFileNameSeed(requestedFileNameSeed) || buildFileNameSeed(baseName);
  const productId = typeof req.body?.productId === "string" ? req.body.productId.trim() : "";
  const assetType =
    typeof req.body?.assetType === "string" && req.body.assetType.trim() === "gallery"
      ? "gallery"
      : "main";

  let uploadDir = path.join(__dirname, "..", "..", "public", "uploads");
  let relativePath;
  let destinationPath;
  let fileName;

  if (productId) {
    uploadDir = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "uploads",
      "products",
      productId
    );

    fileName =
      assetType === "gallery"
        ? `${normalizedFileNameSeed}-gallery-${Date.now()}.webp`
        : `${normalizedFileNameSeed}.webp`;
    relativePath = path.posix.join("uploads", "products", productId, fileName);
    destinationPath = path.join(uploadDir, fileName);
  } else {
    fileName = `${normalizedFileNameSeed || Date.now()}-${Date.now()}.webp`;
    relativePath = path.posix.join("uploads", fileName);
    destinationPath = path.join(uploadDir, fileName);
  }

  fs.mkdirSync(uploadDir, { recursive: true });

  if (productId && assetType === "main") {
    const existingMainImages = fs
      .readdirSync(uploadDir, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => path.join(uploadDir, entry.name));

    for (const existingFilePath of existingMainImages) {
      const existingFileName = path.basename(existingFilePath).toLowerCase();
      const isGalleryFile = existingFileName.includes("-gallery-");
      if (!isGalleryFile && existingFilePath !== destinationPath) {
        fs.rmSync(existingFilePath, { force: true });
      }
    }
  }

  try {
    await writeWebpFromBuffer(uploadedFile.data, destinationPath);
    return res.status(200).json({
      message: "File uploaded successfully",
      fileName,
      path: relativePath,
    });
  } catch (error) {
    console.error("Failed to convert uploaded image to WebP:", error);
    return res.status(500).json({ message: "Failed to convert and upload image" });
  }
}

async function convertStoredImageToWebp(req, res) {
  try {
    const imagePath = typeof req.body?.path === "string" ? req.body.path.trim() : "";
    const productId = typeof req.body?.productId === "string" ? req.body.productId.trim() : "";
    const imageId = typeof req.body?.imageId === "string" ? req.body.imageId.trim() : "";
    const assetType =
      typeof req.body?.assetType === "string" && req.body.assetType.trim() === "gallery"
        ? "gallery"
        : "main";

    if (!imagePath) {
      return res.status(400).json({ message: "Image path is required" });
    }

    const conversionResult = await convertPublicImageToWebp(imagePath, {
      preferredFileName:
        assetType === "main"
          ? `${buildFileNameSeed(
              typeof req.body?.fileNameSeed === "string" ? req.body.fileNameSeed.trim() : ""
            ) || "main-image"}.webp`
          : undefined,
    });

    if (conversionResult.changed) {
      if (assetType === "main" && productId) {
        await prisma.product.updateMany({
          where: {
            id: productId,
            mainImage: conversionResult.oldRelativePath,
          },
          data: {
            mainImage: conversionResult.relativePath,
          },
        });
      }

      if (assetType === "gallery" && imageId) {
        await prisma.image.update({
          where: { imageID: imageId },
          data: {
            image: conversionResult.relativePath,
          },
        });
      }
    }

    return res.status(200).json({
      message: conversionResult.changed ? "Image converted to WebP" : "Image already uses WebP",
      fileName: conversionResult.fileName,
      path: conversionResult.relativePath,
      changed: conversionResult.changed,
    });
  } catch (error) {
    console.error("Failed to convert stored image to WebP:", error);
    return res.status(500).json({ message: "Failed to convert image to WebP" });
  }
}

module.exports = {
  uploadMainImage,
  convertStoredImageToWebp,
};
