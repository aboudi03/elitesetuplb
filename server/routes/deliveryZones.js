const express = require("express");
const { getDeliveryZones } = require("../controllers/deliveryZones");

const router = express.Router();

router.route("/").get(getDeliveryZones);

module.exports = router;
