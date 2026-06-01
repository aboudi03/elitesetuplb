const fs = require("fs");
const path = require("path");

async function uploadMainImage(req, res) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ message: "No uploaded files were provided" });
  }

  const uploadedFile = req.files.uploadedFile;
  const uploadDir = path.join(__dirname, "..", "..", "public", "uploads");
  const safeName = uploadedFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const uniqueFileName = `${Date.now()}-${safeName}`;
  const relativePath = path.posix.join("uploads", uniqueFileName);
  const destinationPath = path.join(uploadDir, uniqueFileName);

  fs.mkdirSync(uploadDir, { recursive: true });

  uploadedFile.mv(destinationPath, (err) => {
    if (err) {
      return res.status(500).send(err);
    }

    return res.status(200).json({
      message: "File uploaded successfully",
      fileName: uniqueFileName,
      path: relativePath,
    });
  });
}

module.exports = {
  uploadMainImage,
};
