const PurchaseOrder = require('./purchaseOrder.model');
const PurchaseReceipt = require('./purchaseReceipt.model');
const Supplier = require('../suppliers/supplier.model');
const Product = require('../products/product.model');
const inventoryService = require('../inventory/inventory.service');
const { successResponse } = require('../../shared/utils/response');
const { NotFoundError, ValidationError } = require('../../shared/errors');
const { PURCHASE_ORDER_STATUSES } = require('../../shared/constants/statuses');

const listPurchaseOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, supplierId } = req.query;
    const query = { organizationId: req.organizationId };

    if (status && status !== 'ALL') query.status = status;
    if (supplierId) query.supplierId = supplierId;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [orders, total] = await Promise.all([
      PurchaseOrder.find(query)
        .populate('supplierId', 'name companyName email')
        .populate('warehouseId', 'name code')
        .populate('lines.productId', 'name sku unit')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      PurchaseOrder.countDocuments(query),
    ]);

    return successResponse(res, orders, 200, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (error) {
    next(error);
  }
};

const getPurchaseOrder = async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    })
      .populate('supplierId')
      .populate('warehouseId')
      .populate('lines.productId')
      .populate('createdBy', 'name email');

    if (!order) throw new NotFoundError('Purchase order not found');

    const receipts = await PurchaseReceipt.find({
      organizationId: req.organizationId,
      purchaseOrderId: order._id,
    }).populate('receivedBy', 'name');

    return successResponse(res, { order, receipts });
  } catch (error) {
    next(error);
  }
};

const createPurchaseOrder = async (req, res, next) => {
  try {
    const { supplierId, warehouseId, lines, expectedDeliveryDate, notes } = req.body;

    const supplier = await Supplier.findOne({
      _id: supplierId,
      organizationId: req.organizationId,
    });
    if (!supplier) throw new NotFoundError('Supplier not found');

    if (!lines || lines.length === 0) {
      throw new ValidationError('At least one order line is required');
    }

    let calculatedTotalMinor = 0;
    const processedLines = [];

    for (const line of lines) {
      const product = await Product.findOne({
        _id: line.productId,
        organizationId: req.organizationId,
      });
      if (!product) throw new NotFoundError(`Product not found: ${line.productId}`);

      const unitCostMinor =
        line.unitCostMinor !== undefined ? Math.round(line.unitCostMinor) : product.costMinor;
      const totalMinor = unitCostMinor * line.orderedQty;
      calculatedTotalMinor += totalMinor;

      processedLines.push({
        productId: product._id,
        orderedQty: line.orderedQty,
        receivedQty: 0,
        unitCostMinor,
        totalMinor,
      });
    }

    const poNumber = `PO-${Date.now().toString().slice(-6)}`;
    const po = await PurchaseOrder.create({
      organizationId: req.organizationId,
      poNumber,
      supplierId: supplier._id,
      warehouseId,
      status: PURCHASE_ORDER_STATUSES.DRAFT,
      lines: processedLines,
      totalAmountMinor: calculatedTotalMinor,
      expectedDeliveryDate: expectedDeliveryDate || null,
      notes: notes || '',
      createdBy: req.user._id,
    });

    return successResponse(res, po, 201);
  } catch (error) {
    next(error);
  }
};

const submitPurchaseOrder = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!po) throw new NotFoundError('Purchase order not found');

    if (po.status !== PURCHASE_ORDER_STATUSES.DRAFT) {
      throw new ValidationError('Only draft orders can be submitted');
    }

    po.status = PURCHASE_ORDER_STATUSES.SUBMITTED;
    await po.save();

    return successResponse(res, po);
  } catch (error) {
    next(error);
  }
};

const approvePurchaseOrder = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!po) throw new NotFoundError('Purchase order not found');

    if (
      po.status !== PURCHASE_ORDER_STATUSES.SUBMITTED &&
      po.status !== PURCHASE_ORDER_STATUSES.DRAFT
    ) {
      throw new ValidationError('Order cannot be approved in current state');
    }

    po.status = PURCHASE_ORDER_STATUSES.ORDERED;
    po.orderedAt = new Date();
    await po.save();

    return successResponse(res, po);
  } catch (error) {
    next(error);
  }
};

const receiveGoods = async (req, res, next) => {
  try {
    const { lines, notes } = req.body;
    const po = await PurchaseOrder.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!po) throw new NotFoundError('Purchase order not found');

    if (
      po.status !== PURCHASE_ORDER_STATUSES.ORDERED &&
      po.status !== PURCHASE_ORDER_STATUSES.PARTIALLY_RECEIVED
    ) {
      throw new ValidationError(
        `Cannot receive goods for purchase order with status "${po.status}"`
      );
    }

    if (!lines || lines.length === 0) {
      throw new ValidationError('Receipt lines must be provided');
    }

    const receiptLines = [];

    for (const rLine of lines) {
      const poLine = po.lines.find(
        (l) => l.productId.toString() === rLine.productId.toString()
      );
      if (!poLine) {
        throw new ValidationError(`Product ${rLine.productId} not found in this purchase order`);
      }

      const remainingQty = poLine.orderedQty - poLine.receivedQty;
      const receivedQty = rLine.receivedQty || 0;
      const damagedQty = rLine.damagedQty || 0;
      const acceptedQty = Math.max(0, receivedQty - damagedQty);

      if (receivedQty > remainingQty) {
        throw new ValidationError(
          `Received quantity (${receivedQty}) exceeds remaining ordered quantity (${remainingQty}) for product ${poLine.productId}`
        );
      }

      if (acceptedQty > 0) {
        // Increment onHand stock via inventory service and log stock movement
        await inventoryService.receiveStock({
          organizationId: req.organizationId,
          warehouseId: po.warehouseId,
          productId: poLine.productId,
          quantity: acceptedQty,
          sourceType: 'PURCHASE_RECEIPT',
          sourceId: po._id,
          actorId: req.user._id,
          reason: `Goods receipt for ${po.poNumber}`,
        });
      }

      poLine.receivedQty += receivedQty;

      receiptLines.push({
        productId: poLine.productId,
        receivedQty,
        damagedQty,
        acceptedQty,
      });
    }

    // Determine new status
    const allReceived = po.lines.every((l) => l.receivedQty >= l.orderedQty);
    po.status = allReceived
      ? PURCHASE_ORDER_STATUSES.RECEIVED
      : PURCHASE_ORDER_STATUSES.PARTIALLY_RECEIVED;

    await po.save();

    // Create Goods Receipt Record
    const receiptNumber = `RCV-${Date.now().toString().slice(-6)}`;
    const receipt = await PurchaseReceipt.create({
      organizationId: req.organizationId,
      receiptNumber,
      purchaseOrderId: po._id,
      warehouseId: po.warehouseId,
      lines: receiptLines,
      receivedBy: req.user._id,
      notes: notes || '',
    });

    // Update supplier outstanding balance
    const totalReceivedValue = receiptLines.reduce((acc, rl) => {
      const poLine = po.lines.find((l) => l.productId.toString() === rl.productId.toString());
      return acc + (poLine ? poLine.unitCostMinor * rl.acceptedQty : 0);
    }, 0);

    if (totalReceivedValue > 0) {
      await Supplier.updateOne(
        { _id: po.supplierId },
        { $inc: { outstandingBalanceMinor: totalReceivedValue } }
      );
    }

    return successResponse(res, { order: po, receipt });
  } catch (error) {
    next(error);
  }
};

const cancelPurchaseOrder = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!po) throw new NotFoundError('Purchase order not found');

    if (
      po.status === PURCHASE_ORDER_STATUSES.RECEIVED ||
      po.status === PURCHASE_ORDER_STATUSES.PARTIALLY_RECEIVED
    ) {
      throw new ValidationError('Cannot cancel purchase order that has already received stock');
    }

    po.status = PURCHASE_ORDER_STATUSES.CANCELLED;
    await po.save();

    return successResponse(res, po);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  submitPurchaseOrder,
  approvePurchaseOrder,
  receiveGoods,
  cancelPurchaseOrder,
};
