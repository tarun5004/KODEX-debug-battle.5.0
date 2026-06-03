const asyncHandler = require('express-async-handler');
const Inventory = require('../models/inventoryModel');
const Product = require('../models/productModel');

// @desc    Get all inventory records
// @route   GET /api/inventory
// @access  Private
const getInventory = asyncHandler(async (req, res) => {
  const inventory = await Inventory.find({}).populate('product');
  res.status(200).json(inventory);
});

// @desc    Create/Upsert an inventory record (increment stock)
// @route   POST /api/inventory
// @access  Private
const createInventory = asyncHandler(async (req, res) => {
  const { productId, variantSku, quantity, warehouse } = req.body;

  if (!productId || quantity === undefined) {
    res.status(400);
    throw new Error('Please add product ID and quantity');
  }

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const skuToUse = variantSku || '';
  const targetWarehouse = warehouse || 'Main Warehouse';

  // Check if inventory already exists for this product/variant in this warehouse
  let inventory = await Inventory.findOne({ 
    product: productId, 
    variantSku: skuToUse, 
    warehouse: targetWarehouse 
  });

  if (inventory) {
    inventory.quantity += Number(quantity);
    await inventory.save();
  } else {
    inventory = await Inventory.create({
      product: productId,
      variantSku: skuToUse,
      quantity: Number(quantity),
      warehouse: targetWarehouse
    });
  }

  // Synchronize back to Product and Base Inventory
  if (skuToUse) {
    // 1. Update the variant's stock in the product document (sum of that variant across all warehouses)
    const allVariantInvs = await Inventory.find({ product: productId, variantSku: skuToUse });
    const totalVariantStock = allVariantInvs.reduce((sum, inv) => sum + inv.quantity, 0);

    const variant = product.variants.find(v => v.sku === skuToUse);
    if (variant) {
      variant.stock = totalVariantStock;
      await product.save();
    }

    // 2. Update the base inventory record for this warehouse to be the sum of all variant inventories in this warehouse
    const baseInv = await Inventory.findOne({ 
      product: productId, 
      variantSku: '', 
      warehouse: targetWarehouse 
    });
    if (baseInv) {
      const warehouseVariantInvs = await Inventory.find({ 
        product: productId, 
        warehouse: targetWarehouse, 
        variantSku: { $ne: '' } 
      });
      baseInv.quantity = warehouseVariantInvs.reduce((sum, inv) => sum + inv.quantity, 0);
      await baseInv.save();
    }
  } else {
    // If updating base stock directly (only makes sense if product has no variants,
    // but if it does have variants, base stock should be recalculated as sum of all variant stock in warehouse)
    if (product.variants && product.variants.length > 0) {
      // Re-sum variants in this warehouse to ensure it's not manually overwritten incorrectly
      const warehouseVariantInvs = await Inventory.find({ 
        product: productId, 
        warehouse: targetWarehouse, 
        variantSku: { $ne: '' } 
      });
      inventory.quantity = warehouseVariantInvs.reduce((sum, inv) => sum + inv.quantity, 0);
      await inventory.save();
    }
  }

  const populatedInv = await Inventory.findById(inventory._id).populate('product');
  res.status(201).json(populatedInv);
});

// @desc    Update stock quantity directly
// @route   PUT /api/inventory/:id
// @access  Private
const updateInventory = asyncHandler(async (req, res) => {
  const { quantity, warehouse } = req.body;

  const inventory = await Inventory.findById(req.params.id);

  if (!inventory) {
    res.status(404);
    throw new Error('Inventory record not found');
  }

  const oldWarehouse = inventory.warehouse;
  const oldVariantSku = inventory.variantSku;
  const productId = inventory.product;

  if (quantity !== undefined) {
    inventory.quantity = Number(quantity);
  }
  if (warehouse) {
    inventory.warehouse = warehouse;
  }

  const updatedInventory = await inventory.save();

  // Synchronize back to Product and Base Inventory
  if (oldVariantSku) {
    // 1. Update the variant's stock in the product document
    const product = await Product.findById(productId);
    if (product) {
      const allVariantInvs = await Inventory.find({ product: productId, variantSku: oldVariantSku });
      const totalVariantStock = allVariantInvs.reduce((sum, inv) => sum + inv.quantity, 0);

      const variant = product.variants.find(v => v.sku === oldVariantSku);
      if (variant) {
        variant.stock = totalVariantStock;
        await product.save();
      }
    }

    // 2. Update the base inventory record for target and old warehouses
    const warehousesToUpdate = new Set([oldWarehouse, inventory.warehouse]);
    for (const wh of warehousesToUpdate) {
      const baseInv = await Inventory.findOne({ 
        product: productId, 
        variantSku: '', 
        warehouse: wh 
      });
      if (baseInv) {
        const warehouseVariantInvs = await Inventory.find({ 
          product: productId, 
          warehouse: wh, 
          variantSku: { $ne: '' } 
        });
        baseInv.quantity = warehouseVariantInvs.reduce((sum, inv) => sum + inv.quantity, 0);
        await baseInv.save();
      }
    }
  } else {
    // If it's a base product inventory update, check if product has variants.
    // If so, force the base product inventory quantity to match the sum of variants in this warehouse.
    const product = await Product.findById(productId);
    if (product && product.variants && product.variants.length > 0) {
      const warehouseVariantInvs = await Inventory.find({ 
        product: productId, 
        warehouse: inventory.warehouse, 
        variantSku: { $ne: '' } 
      });
      inventory.quantity = warehouseVariantInvs.reduce((sum, inv) => sum + inv.quantity, 0);
      await inventory.save();
    }
  }

  const populatedInv = await Inventory.findById(updatedInventory._id).populate('product');

  res.status(200).json(populatedInv);
});

module.exports = {
  getInventory,
  createInventory,
  updateInventory
};
