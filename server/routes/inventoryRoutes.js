const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getInventory, createInventory, updateInventory } = require('../controllers/inventoryController');

router.route('/')
  .get(protect, getInventory)
  .post(protect, createInventory);

router.route('/:id')
  .put(protect, updateInventory);

module.exports = router;
