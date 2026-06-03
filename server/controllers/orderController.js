const asyncHandler = require('express-async-handler');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Inventory = require('../models/inventoryModel');

const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate('items.product');
  res.status(200).json(orders);
});

const createOrder = asyncHandler(async (req, res) => {
  try {
    const { customerName, items, status } = req.body;

    if (!customerName || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400);
      throw new Error('Please add customer name and at least one item');
    }

    const productsCache = new Map();
    const inventoryCache = new Map();
    const enrichedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const { productId, quantity, variantSku } = item;
      const quantityNum = Number(quantity);

      if (!productId || Number.isNaN(quantityNum) || quantityNum <= 0) {
        res.status(400);
        throw new Error('Invalid product ID or quantity');
      }

      let product;
      if (productsCache.has(productId)) {
        product = productsCache.get(productId);
      } else {
        product = await Product.findById(productId);
        if (!product) {
          res.status(404);
          throw new Error(`Product with ID ${productId} not found`);
        }
        productsCache.set(productId, product);
      }

      let itemPrice = product.price;
      let inventoryRecord = null;
      let baseInventoryRecord = null;

      if (variantSku) {
        const variant = product.variants.find(v => v.sku === variantSku);
        if (!variant) {
          res.status(404);
          throw new Error(`Variant SKU ${variantSku} not found for product ${product.name}`);
        }

        // Bug fix: reject only when stock is below the requested quantity.
        if (variant.stock < quantityNum) {
          res.status(400);
          throw new Error(`Insufficient stock for variant ${variantSku} of ${product.name}. Available: ${variant.stock}`);
        }

        itemPrice = variant.price;

        const variantInvKey = `variant_${productId}_${variantSku}`;
        if (inventoryCache.has(variantInvKey)) {
          inventoryRecord = inventoryCache.get(variantInvKey);
        } else {
          inventoryRecord = await Inventory.findOne({ product: productId, variantSku: variantSku });
          if (inventoryRecord) {
            inventoryCache.set(variantInvKey, inventoryRecord);
          }
        }

        if (!inventoryRecord || inventoryRecord.quantity < quantityNum) {
          res.status(400);
          throw new Error(`Insufficient inventory stock for variant SKU ${variantSku}. Available: ${inventoryRecord ? inventoryRecord.quantity : 0}`);
        }

        const baseInvKey = `base_${productId}`;
        if (inventoryCache.has(baseInvKey)) {
          baseInventoryRecord = inventoryCache.get(baseInvKey);
        } else {
          baseInventoryRecord = await Inventory.findOne({ 
            product: productId, 
            $or: [{ variantSku: '' }, { variantSku: { $exists: false } }] 
          });
          if (baseInventoryRecord) {
            inventoryCache.set(baseInvKey, baseInventoryRecord);
          }
        }

        if (!baseInventoryRecord || baseInventoryRecord.quantity < quantityNum) {
          res.status(400);
          throw new Error(`Insufficient base inventory stock for product ${product.name}. Available: ${baseInventoryRecord ? baseInventoryRecord.quantity : 0}`);
        }

        variant.stock -= quantityNum;
        inventoryRecord.quantity -= quantityNum;
        baseInventoryRecord.quantity -= quantityNum;

        enrichedItems.push({
          product: product._id,
          variantSku,
          quantity: quantityNum,
          price: itemPrice,
          inventoryRecord,
          baseInventoryRecord
        });
      } else {
        if (product.variants && product.variants.length > 0) {
          res.status(400);
          throw new Error(`Product ${product.name} has variations. Please select a specific variant.`);
        }

        const baseInvKey = `base_${productId}`;
        if (inventoryCache.has(baseInvKey)) {
          inventoryRecord = inventoryCache.get(baseInvKey);
        } else {
          inventoryRecord = await Inventory.findOne({ 
            product: productId, 
            $or: [{ variantSku: '' }, { variantSku: { $exists: false } }] 
          });
          if (inventoryRecord) {
            inventoryCache.set(baseInvKey, inventoryRecord);
          }
        }

        // Bug fix: reject only when base stock is below the requested quantity.
        if (!inventoryRecord || inventoryRecord.quantity < quantityNum) {
          res.status(400);
          throw new Error(`Insufficient stock for product: ${product.name}. Available: ${inventoryRecord ? inventoryRecord.quantity : 0}`);
        }

        inventoryRecord.quantity -= quantityNum;

        enrichedItems.push({
          product: product._id,
          variantSku: '',
          quantity: quantityNum,
          price: itemPrice,
          inventoryRecord
        });
      }

      // Bug fix: order totals must include quantity, not just one unit price.
      totalAmount += itemPrice * quantityNum;
    }

    for (const invDoc of inventoryCache.values()) {
      await invDoc.save();
    }

    for (const productDoc of productsCache.values()) {
      await productDoc.save();
    }

    const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

    const order = await Order.create({
      orderNumber,
      customerName,
      items: enrichedItems.map(item => ({
        product: item.product,
        variantSku: item.variantSku || '',
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount,
      status: status || 'Pending'
    });

    const populatedOrder = await Order.findById(order._id).populate('items.product');
    res.status(201).json(populatedOrder);
  } catch (error) {
    // Bug fix: preserve validation/business errors instead of masking them as a fake 500.
    throw error;
  }
});

module.exports = {
  getOrders,
  createOrder
};
