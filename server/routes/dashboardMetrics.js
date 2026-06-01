const express = require("express");
const { getDashboardMetrics } = require("../controllers/dashboardMetrics");

const router = express.Router();

router.get("/", getDashboardMetrics);

module.exports = router;
