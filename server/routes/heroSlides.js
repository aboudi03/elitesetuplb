const express = require("express");
const router = express.Router();
const {
  getHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
} = require("../controllers/heroSlides");

router.route("/").get(getHeroSlides).post(createHeroSlide);
router.route("/:id").put(updateHeroSlide).delete(deleteHeroSlide);

module.exports = router;
