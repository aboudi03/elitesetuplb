const express = require("express");
const { createCartEvent } = require("../controllers/cartEvents");

const router = express.Router();

router.post("/", createCartEvent);

module.exports = router;
