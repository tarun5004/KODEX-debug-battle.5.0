const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getProducts, createProduct } = require('../controllers/productController');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .get(protect, getProducts)
  .post(protect, upload.single('image'), createProduct);

module.exports = router;
