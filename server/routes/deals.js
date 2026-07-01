const express = require("express");

const router = express.Router();
const {
  getAllDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
} = require("../controllers/deals");

router.route("/").get(getAllDeals).post(createDeal);
router.route("/:id").get(getDealById).put(updateDeal).delete(deleteDeal);

module.exports = router;
