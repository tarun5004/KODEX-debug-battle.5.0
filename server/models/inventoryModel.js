const mongoose = require('mongoose');

const inventorySchema = mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  variantSku: {
    type: String,
    default: '',
  },
  quantity: {
    type: Number,
    required: [true, 'Please add stock quantity'],
    default: 0,
  },
  warehouse: {
    type: String,
    default: 'Main Warehouse',
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Inventory', inventorySchema);
