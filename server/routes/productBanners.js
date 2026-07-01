const express = require("express");

const router = express.Router();
const {
  getAllProductBanners,
  getProductBannerById,
  createProductBanner,
  updateProductBanner,
  deleteProductBanner,
} = require("../controllers/productBanners");

router.route("/").get(getAllProductBanners).post(createProductBanner);
router.route("/:id").get(getProductBannerById).put(updateProductBanner).delete(deleteProductBanner);

module.exports = router;
