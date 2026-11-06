const Return = require('./return.model');
const SalesOrder = require('../sales/salesOrder.model');
const PurchaseOrder = require('../purchases/purchaseOrder.model');
const inventoryService = require('../inventory/inventory.service');
const { successResponse } = require('../../shared/utils/response');
const { NotFoundError, ValidationError } = require('../../shared/errors');
const { RETURN_STATUSES, RETURN_DISPOSITIONS } = require('../../shared/constants/statuses');

const listReturns = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, returnType } = req.query;
    const query = { organizationId: req.organizationId };

    if (status) query.status = status;
    if (returnType) query.returnType = returnType;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [returns, total] = await Promise.all([
      Return.find(query)
        .populate('warehouseId', 'name code')
        .populate('lines.productId', 'name sku')
        .populate('requestedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Return.countDocuments(query),
    ]);

    return successResponse(res, returns, 200, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (error) {
    next(error);
  }
};

const getReturn = async (req, res, next) => {
  try {
    const ret = await Return.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    })
      .populate('warehouseId')
      .populate('lines.productId')
      .populate('requestedBy', 'name email');

    if (!ret) throw new NotFoundError('Return record not found');
    return successResponse(res, ret);
  } catch (error) {
    next(error);
  }
};

const createReturn = async (req, res, next) => {
  try {
    const {
      returnType,
      sourceId,
      warehouseId,
      lines,
      disposition = RETURN_DISPOSITIONS.RESTOCK,
      reason,
      refundMinor = 0,
    } = req.body;

    if (!lines || lines.length === 0) {
      throw new ValidationError('Return lines must be provided');
    }

    const returnNumber = `RET-${Date.now().toString().slice(-6)}`;
    const ret = await Return.create({
      organizationId: req.organizationId,
      returnNumber,
      returnType,
      sourceId,
      warehouseId,
      lines,
      disposition,
      status: RETURN_STATUSES.REQUESTED,
      reason: reason || 'Customer return',
      refundMinor: Math.round(refundMinor || 0),
      requestedBy: req.user._id,
    });

    return successResponse(res, ret, 201);
  } catch (error) {
    next(error);
  }
};

const approveReturn = async (req, res, next) => {
  try {
    const ret = await Return.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!ret) throw new NotFoundError('Return record not found');

    if (ret.status !== RETURN_STATUSES.REQUESTED) {
      throw new ValidationError('Only requested returns can be approved');
    }

    ret.status = RETURN_STATUSES.APPROVED;
    ret.approvedBy = req.user._id;
    await ret.save();

    return successResponse(res, ret);
  } catch (error) {
    next(error);
  }
};

const completeReturn = async (req, res, next) => {
  try {
    const ret = await Return.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!ret) throw new NotFoundError('Return record not found');

    if (ret.status === RETURN_STATUSES.COMPLETED) {
      throw new ValidationError('This return has already been completed');
    }

    // Process physical stock changes based on disposition
    if (ret.returnType === 'SALES_RETURN') {
      if (ret.disposition === RETURN_DISPOSITIONS.RESTOCK) {
        // Increases onHand stock because returned product is restocked
        for (const line of ret.lines) {
          await inventoryService.receiveStock({
            organizationId: req.organizationId,
            warehouseId: ret.warehouseId,
            productId: line.productId,
            quantity: line.returnedQty,
            sourceType: 'SALES_RETURN',
            sourceId: ret._id,
            actorId: req.user._id,
            reason: `Restocked items from return ${ret.returnNumber}`,
          });
        }
      }
      // If scrap or quarantine, sellable onHand is not increased per Section 7.5
    } else if (ret.returnType === 'PURCHASE_RETURN') {
      // Dispatches goods back to supplier: decreases onHand stock
      for (const line of ret.lines) {
        await inventoryService.dispatchStock({
          organizationId: req.organizationId,
          warehouseId: ret.warehouseId,
          productId: line.productId,
          quantity: line.returnedQty,
          sourceType: 'PURCHASE_RETURN',
          sourceId: ret._id,
          actorId: req.user._id,
          reason: `Goods returned to supplier on ${ret.returnNumber}`,
        });
      }
    }

    ret.status = RETURN_STATUSES.COMPLETED;
    ret.completedAt = new Date();
    await ret.save();

    return successResponse(res, ret);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listReturns,
  getReturn,
  createReturn,
  approveReturn,
  completeReturn,
};
