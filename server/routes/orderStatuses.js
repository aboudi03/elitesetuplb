const express = require("express");
const router = express.Router();
const { getOrderStatuses } = require("../controllers/orderStatuses");

router.route("/").get(getOrderStatuses);

module.exports = router;
