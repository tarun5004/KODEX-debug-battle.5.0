const mongoose = require('mongoose');

const productVariantSchema = mongoose.Schema({
  sku: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  stock: {
    type: Number,
    default: 0,
  },
  size: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: '',
  }
});

const productSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
  },
  description: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    required: [true, 'Please add a product price'],
  },
  sku: {
    type: String,
    required: [true, 'Please add a product SKU'],
    unique: true,
  },
  category: {
    type: String,
    default: 'General',
  },
  image: {
    type: String,
    default: '',
  },
  variants: [productVariantSchema]
}, {
  timestamps: true,
});

module.exports = mongoose.model('Product', productSchema);
