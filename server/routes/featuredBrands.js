const express = require("express");

const router = express.Router();
const {
  getFeaturedBrands,
  createFeaturedBrand,
  updateFeaturedBrand,
  deleteFeaturedBrand,
} = require("../controllers/featuredBrands");

router.route("/").get(getFeaturedBrands).post(createFeaturedBrand);
router.route("/:id").put(updateFeaturedBrand).delete(deleteFeaturedBrand);

module.exports = router;
