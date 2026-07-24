const express = require('express');
const {
  listCategories,
  createCategory,
  deleteCategory,
} = require('../controllers/category.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.use(requireAuth);
router.get('/', asyncHandler(listCategories));
router.post('/', asyncHandler(createCategory));
router.delete('/:id', asyncHandler(deleteCategory));

module.exports = router;
