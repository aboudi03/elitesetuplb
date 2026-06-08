const express = require("express");
const router = express.Router();
const { uploadMainImage, convertStoredImageToWebp } = require("../controllers/mainImages");

router.route("/convert").post(convertStoredImageToWebp);
router.route("/").post(uploadMainImage);

module.exports = router;
