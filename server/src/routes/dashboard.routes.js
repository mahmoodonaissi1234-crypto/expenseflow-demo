const express = require('express');
const { getSummary } = require('../controllers/dashboard.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.use(requireAuth);
router.get('/summary', asyncHandler(getSummary));

module.exports = router;
