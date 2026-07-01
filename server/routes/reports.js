const express = require("express");
const { getSalesProfitReport } = require("../controllers/reports");

const router = express.Router();

router.get("/sales-profit", getSalesProfitReport);

module.exports = router;
