const Product = require('./product.model');
const InventoryBalance = require('../inventory/inventoryBalance.model');
const StockMovement = require('../inventory/stockMovement.model');
const Warehouse = require('../warehouses/warehouse.model');
const { successResponse } = require('../../shared/utils/response');
const { NotFoundError, ConflictError } = require('../../shared/errors');
const { STOCK_MOVEMENT_TYPES } = require('../../shared/constants/statuses');

const listProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, categoryId, status = 'ACTIVE' } = req.query;

    const query = {
      organizationId: req.organizationId,
    };

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { sku: regex }, { barcode: regex }];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('categoryId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Product.countDocuments(query),
    ]);

    // Attach total available / onHand stock across warehouses for quick overview
    const productIds = products.map((p) => p._id);
    const balances = await InventoryBalance.aggregate([
      { $match: { productId: { $in: productIds } } },
      {
        $group: {
          _id: '$productId',
          totalOnHand: { $sum: '$onHand' },
          totalReserved: { $sum: '$reserved' },
        },
      },
    ]);

    const balanceMap = {};
    balances.forEach((b) => {
      balanceMap[b._id.toString()] = {
        onHand: b.totalOnHand,
        reserved: b.totalReserved,
        available: Math.max(0, b.totalOnHand - b.totalReserved),
      };
    });

    const productsWithStock = products.map((p) => {
      const pObj = p.toObject();
      const stock = balanceMap[p._id.toString()] || { onHand: 0, reserved: 0, available: 0 };
      pObj.stock = stock;
      return pObj;
    });

    return successResponse(res, productsWithStock, 200, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (error) {
    next(error);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    }).populate('categoryId', 'name');

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return successResponse(res, product);
  } catch (error) {
    next(error);
  }
};

const getProductStock = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const balances = await InventoryBalance.find({
      organizationId: req.organizationId,
      productId: product._id,
    }).populate('warehouseId', 'name code isDefault');

    return successResponse(res, balances);
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const {
      sku,
      barcode,
      name,
      categoryId,
      unit,
      costMinor,
      priceMinor,
      reorderLevel,
      description,
      initialStock,
      initialWarehouseId,
    } = req.body;

    const existingSku = await Product.findOne({
      organizationId: req.organizationId,
      sku: sku.toUpperCase().trim(),
    });
    if (existingSku) {
      throw new ConflictError(`Product SKU "${sku}" already exists`);
    }

    const product = await Product.create({
      organizationId: req.organizationId,
      sku: sku.toUpperCase().trim(),
      barcode: barcode ? barcode.trim() : '',
      name: name.trim(),
      categoryId: categoryId || null,
      unit: unit || 'pcs',
      costMinor: costMinor !== undefined ? Math.round(costMinor) : 0,
      priceMinor: priceMinor !== undefined ? Math.round(priceMinor) : 0,
      reorderLevel: reorderLevel !== undefined ? reorderLevel : 10,
      description: description || '',
    });

    // If opening stock provided
    if (initialStock && initialStock > 0) {
      let targetWarehouseId = initialWarehouseId;
      if (!targetWarehouseId) {
        const defaultWh = await Warehouse.findOne({
          organizationId: req.organizationId,
          isDefault: true,
        });
        if (defaultWh) targetWarehouseId = defaultWh._id;
      }

      if (targetWarehouseId) {
        const balance = await InventoryBalance.create({
          organizationId: req.organizationId,
          warehouseId: targetWarehouseId,
          productId: product._id,
          onHand: initialStock,
          reserved: 0,
        });

        await StockMovement.create({
          organizationId: req.organizationId,
          warehouseId: targetWarehouseId,
          productId: product._id,
          type: STOCK_MOVEMENT_TYPES.OPENING_STOCK,
          quantity: initialStock,
          beforeOnHand: 0,
          afterOnHand: initialStock,
          sourceType: 'OPENING_STOCK',
          sourceId: product._id,
          actorId: req.user._id,
          reason: 'Initial Opening Stock upon Product Creation',
        });
      }
    }

    return successResponse(res, product, 201);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const {
      name,
      categoryId,
      unit,
      costMinor,
      priceMinor,
      reorderLevel,
      description,
      barcode,
      status,
    } = req.body;

    const product = await Product.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (name) product.name = name.trim();
    if (categoryId !== undefined) product.categoryId = categoryId || null;
    if (unit) product.unit = unit;
    if (costMinor !== undefined) product.costMinor = Math.round(costMinor);
    if (priceMinor !== undefined) product.priceMinor = Math.round(priceMinor);
    if (reorderLevel !== undefined) product.reorderLevel = reorderLevel;
    if (description !== undefined) product.description = description;
    if (barcode !== undefined) product.barcode = barcode.trim();
    if (status) product.status = status;

    await product.save();
    return successResponse(res, product);
  } catch (error) {
    next(error);
  }
};

const archiveProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    product.status = 'ARCHIVED';
    await product.save();

    return successResponse(res, { message: 'Product archived successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listProducts,
  getProduct,
  getProductStock,
  createProduct,
  updateProduct,
  archiveProduct,
};
