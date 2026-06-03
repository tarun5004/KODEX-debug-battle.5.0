const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');
const Inventory = require('../models/inventoryModel');
const { cloudinary, isConfigured } = require('../config/cloudinary');
const { Readable } = require('stream');

const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({});
  const inventories = await Inventory.find({});

  const productsWithStock = products.map(product => {
    const baseInventories = inventories.filter(i =>
      i.product.toString() === product._id.toString() && !i.variantSku
    );
    const totalBaseStock = baseInventories.reduce((sum, inv) => sum + inv.quantity, 0);
    return {
      ...product.toObject(),
      // Dev note: filter array deta hai, single object nahi; isliye quantity nikalne ke liye base inventory rows ko sum kiya.
      stock: totalBaseStock,
      warehouse: baseInventories.length === 0 ? 'N/A' : baseInventories.length === 1 ? baseInventories[0].warehouse : `${baseInventories.length} warehouses`,
      inventoryId: baseInventories.length === 1 ? baseInventories[0]._id : null
    };
  });

  res.status(200).json(productsWithStock);
});

const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, sku, category, initialStock, warehouse, variants } = req.body;

  let parsedVariants = [];
  if (variants) {
    try {
      parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
      if (!Array.isArray(parsedVariants)) {
        throw new Error('Variants must be an array');
      }
    } catch (e) {
      res.status(400);
      throw new Error('Invalid variants payload');
    }
  }

  const hasVariants = parsedVariants.length > 0;
  const basePrice = price !== undefined && price !== '' ? Number(price) : Number(parsedVariants[0]?.price);

  if (!name || Number.isNaN(basePrice)) {
    res.status(400);
    // Dev note: variant product me base price empty ho sakta hai; first variant price se product price derive kiya.
    throw new Error('Please add name and price');
  }

  const productSku = sku || 'SKU-' + Math.random().toString(36).substr(2, 9).toUpperCase();

  const productExists = await Product.findOne({ sku: productSku });
  if (productExists) {
    res.status(400);
    throw new Error('Product with this SKU already exists');
  }

  let imageUrl = '';
  if (req.file) {
    if (isConfigured) {
      try {
        imageUrl = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'products' },
            (error, result) => {
              if (error) {
                console.error('Cloudinary stream upload error:', error);
                reject(error);
              } else {
                resolve(result.secure_url);
              }
            }
          );

          const stream = new Readable();
          stream._read = () => {};
          stream.push(req.file.buffer);
          stream.push(null);
          stream.pipe(uploadStream);
        });
      } catch (err) {
        res.status(500);
        throw new Error('Failed to upload image to cloud server.');
      }
    } else {
      imageUrl = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80';
    }
  } else {
    imageUrl = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=400&q=80';
  }

  const product = await Product.create({
    name,
    description,
    price: basePrice,
    sku: productSku,
    category: category || 'General',
    image: imageUrl,
    variants: parsedVariants
  });

  let totalStock = 0;
  if (hasVariants) {
    // Dev note: variant stock add hona chahiye tha; minus karne se inventory negative ban rahi thi.
    totalStock = parsedVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  } else {
    totalStock = initialStock !== undefined ? Number(initialStock) : 0;
  }

  const baseInventory = await Inventory.create({
    product: product._id,
    quantity: totalStock,
    warehouse: warehouse || 'Main Warehouse'
  });

  for (const variant of parsedVariants) {
    await Inventory.create({
      product: product._id,
      variantSku: variant.sku,
      quantity: variant.stock ? Number(variant.stock) : 0,
      warehouse: warehouse || 'Main Warehouse'
    });
  }

  res.status(201).json({
    ...product.toObject(),
    stock: baseInventory.quantity,
    warehouse: baseInventory.warehouse,
    inventoryId: baseInventory._id
  });
});

module.exports = {
  getProducts,
  createProduct
};
