const express = require("express");
const router = express.Router();
const { uploadMainImage, convertStoredImageToWebp, renameStoredImage } = require("../controllers/mainImages");

router.route("/convert").post(convertStoredImageToWebp);
router.route("/rename").post(renameStoredImage);
router.route("/").post(uploadMainImage);

module.exports = router;
