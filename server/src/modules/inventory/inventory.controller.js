const InventoryBalance = require('./inventoryBalance.model');
const StockMovement = require('./stockMovement.model');
const StockAdjustment = require('./stockAdjustment.model');
const Product = require('../products/product.model');
const inventoryService = require('./inventory.service');
const { successResponse } = require('../../shared/utils/response');
const { NotFoundError, ValidationError } = require('../../shared/errors');
const { v4: uuidv4 } = require('uuid');

const listInventory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, warehouseId, productId } = req.query;

    const query = {
      organizationId: req.organizationId,
    };

    if (warehouseId) query.warehouseId = warehouseId;
    if (productId) query.productId = productId;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [balances, total] = await Promise.all([
      InventoryBalance.find(query)
        .populate('productId', 'name sku unit costMinor priceMinor reorderLevel')
        .populate('warehouseId', 'name code')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      InventoryBalance.countDocuments(query),
    ]);

    return successResponse(res, balances, 200, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (error) {
    next(error);
  }
};

const listLedger = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, warehouseId, productId, type } = req.query;

    const query = {
      organizationId: req.organizationId,
    };

    if (warehouseId) query.warehouseId = warehouseId;
    if (productId) query.productId = productId;
    if (type) query.type = type;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [movements, total] = await Promise.all([
      StockMovement.find(query)
        .populate('productId', 'name sku unit')
        .populate('warehouseId', 'name code')
        .populate('actorId', 'name email')
        .sort({ occurredAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      StockMovement.countDocuments(query),
    ]);

    return successResponse(res, movements, 200, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (error) {
    next(error);
  }
};

const createAdjustment = async (req, res, next) => {
  try {
    const { warehouseId, reason, lines } = req.body;

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      throw new ValidationError('Adjustment lines must be provided');
    }

    const calculatedLines = await Promise.all(
      lines.map(async (line) => {
        const balance = await inventoryService.getOrCreateBalance(
          req.organizationId,
          warehouseId,
          line.productId
        );
        const bookQty = balance.onHand;
        const varianceQty = line.countedQty - bookQty;
        return {
          productId: line.productId,
          bookQty,
          countedQty: line.countedQty,
          varianceQty,
        };
      })
    );

    const adjustmentNumber = `ADJ-${Date.now().toString().slice(-6)}`;
    const adjustment = await StockAdjustment.create({
      organizationId: req.organizationId,
      adjustmentNumber,
      warehouseId,
      reason: reason || 'Physical Stock Count',
      lines: calculatedLines,
      requestedBy: req.user._id,
      status: 'SUBMITTED',
    });

    return successResponse(res, adjustment, 201);
  } catch (error) {
    next(error);
  }
};

const approveAdjustment = async (req, res, next) => {
  try {
    const adjustment = await StockAdjustment.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });

    if (!adjustment) {
      throw new NotFoundError('Stock adjustment not found');
    }

    if (adjustment.status === 'APPROVED') {
      throw new ValidationError('This adjustment has already been approved and posted');
    }

    for (const line of adjustment.lines) {
      await inventoryService.adjustStock({
        organizationId: req.organizationId,
        warehouseId: adjustment.warehouseId,
        productId: line.productId,
        countedQty: line.countedQty,
        sourceType: 'ADJUSTMENT',
        sourceId: adjustment._id,
        actorId: req.user._id,
        reason: adjustment.reason,
      });
    }

    adjustment.status = 'APPROVED';
    adjustment.approvedBy = req.user._id;
    adjustment.approvedAt = new Date();
    await adjustment.save();

    return successResponse(res, adjustment);
  } catch (error) {
    next(error);
  }
};

const listLowStock = async (req, res, next) => {
  try {
    const products = await Product.find({
      organizationId: req.organizationId,
      status: 'ACTIVE',
    });

    const lowStockItems = [];

    for (const prod of products) {
      const balances = await InventoryBalance.find({
        organizationId: req.organizationId,
        productId: prod._id,
      }).populate('warehouseId', 'name code');

      const totalOnHand = balances.reduce((acc, b) => acc + (b.onHand || 0), 0);
      const totalReserved = balances.reduce((acc, b) => acc + (b.reserved || 0), 0);
      const totalAvailable = Math.max(0, totalOnHand - totalReserved);

      if (totalAvailable <= (prod.reorderLevel || 10)) {
        lowStockItems.push({
          product: prod,
          totalOnHand,
          totalReserved,
          totalAvailable,
          reorderLevel: prod.reorderLevel,
          suggestedReorderQty: Math.max(0, (prod.reorderLevel || 10) * 2 - totalAvailable),
          warehouseBreakdown: balances,
        });
      }
    }

    return successResponse(res, lowStockItems);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listInventory,
  listLedger,
  createAdjustment,
  approveAdjustment,
  listLowStock,
};
