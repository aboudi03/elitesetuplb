const express = require("express");

const router = express.Router();

const {
  getCategory,
  createCategory,
  updateCategory,
  reorderCategories,
  deleteCategory,
  getAllCategories,
} = require("../controllers/category");

router.route("/").get(getAllCategories).post(createCategory);
router.route("/reorder").put(reorderCategories);

router
  .route("/:id")
  .get(getCategory)
  .put(updateCategory)
  .delete(deleteCategory);

module.exports = router;
