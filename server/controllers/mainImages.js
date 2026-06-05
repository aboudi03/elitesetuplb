const fs = require("fs");
const path = require("path");

async function uploadMainImage(req, res) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ message: "No uploaded files were provided" });
  }

  const uploadedFile = req.files.uploadedFile;
  const safeName = uploadedFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const productId = typeof req.body?.productId === "string" ? req.body.productId.trim() : "";
  const fileExtension = path.extname(safeName) || ".jpg";

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

    fileName = `main-image${fileExtension}`;
    relativePath = path.posix.join("uploads", "products", productId, fileName);
    destinationPath = path.join(uploadDir, fileName);
  } else {
    fileName = `${Date.now()}-${safeName}`;
    relativePath = path.posix.join("uploads", fileName);
    destinationPath = path.join(uploadDir, fileName);
  }

  fs.mkdirSync(uploadDir, { recursive: true });

  if (productId) {
    const existingMainImages = fs
      .readdirSync(uploadDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && /^main-image\./.test(entry.name))
      .map((entry) => path.join(uploadDir, entry.name));

    for (const existingFilePath of existingMainImages) {
      if (existingFilePath !== destinationPath) {
        fs.rmSync(existingFilePath, { force: true });
      }
    }
  }

  uploadedFile.mv(destinationPath, (err) => {
    if (err) {
      return res.status(500).send(err);
    }

    return res.status(200).json({
      message: "File uploaded successfully",
      fileName,
      path: relativePath,
    });
  });
}

module.exports = {
  uploadMainImage,
};
