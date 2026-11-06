const StockTransfer = require("./stockTransfer.model");
const inventoryService = require("../inventory/inventory.service");
const { successResponse } = require("../../shared/utils/response");
const { NotFoundError, ValidationError } = require("../../shared/errors");
const { TRANSFER_STATUSES } = require("../../shared/constants/statuses");

const listTransfers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = { organizationId: req.organizationId };

    if (status) query.status = status;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [transfers, total] = await Promise.all([
      StockTransfer.find(query)
        .populate("fromWarehouseId", "name code")
        .populate("toWarehouseId", "name code")
        .populate("lines.productId", "name sku unit")
        .populate("requestedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      StockTransfer.countDocuments(query),
    ]);

    return successResponse(res, transfers, 200, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (error) {
    next(error);
  }
};

const getTransfer = async (req, res, next) => {
  try {
    const transfer = await StockTransfer.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    })
      .populate("fromWarehouseId")
      .populate("toWarehouseId")
      .populate("lines.productId")
      .populate("requestedBy", "name email");

    if (!transfer) throw new NotFoundError("Stock transfer not found");
    return successResponse(res, transfer);
  } catch (error) {
    next(error);
  }
};

const createTransfer = async (req, res, next) => {
  try {
    const { fromWarehouseId, toWarehouseId, lines, notes } = req.body;

    if (fromWarehouseId === toWarehouseId) {
      throw new ValidationError(
        "Source and destination warehouses must be different",
      );
    }

    if (!lines || lines.length === 0) {
      throw new ValidationError("Transfer lines must be provided");
    }

    const transferNumber = `TRF-${Date.now().toString().slice(-6)}`;
    const transfer = await StockTransfer.create({
      organizationId: req.organizationId,
      transferNumber,
      fromWarehouseId,
      toWarehouseId,
      lines: lines.map((l) => ({
        productId: l.productId,
        requestedQty: l.requestedQty,
        dispatchedQty: 0,
        receivedQty: 0,
      })),
      notes: notes || "",
      requestedBy: req.user._id,
      status: TRANSFER_STATUSES.DRAFT,
    });

    return successResponse(res, transfer, 201);
  } catch (error) {
    next(error);
  }
};

const approveTransfer = async (req, res, next) => {
  try {
    const transfer = await StockTransfer.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!transfer) throw new NotFoundError("Stock transfer not found");

    if (transfer.status !== TRANSFER_STATUSES.DRAFT) {
      throw new ValidationError("Only draft transfers can be approved");
    }

    transfer.status = TRANSFER_STATUSES.APPROVED;
    await transfer.save();

    return successResponse(res, transfer);
  } catch (error) {
    next(error);
  }
};

const dispatchTransfer = async (req, res, next) => {
  try {
    const transfer = await StockTransfer.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!transfer) throw new NotFoundError("Stock transfer not found");

    if (transfer.status !== TRANSFER_STATUSES.APPROVED) {
      throw new ValidationError("Transfer must be approved before dispatch");
    }

    // Deduct stock from source warehouse
    for (const line of transfer.lines) {
      await inventoryService.dispatchStock({
        organizationId: req.organizationId,
        warehouseId: transfer.fromWarehouseId,
        productId: line.productId,
        quantity: line.requestedQty,
        sourceType: "TRANSFER_OUT",
        sourceId: transfer._id,
        actorId: req.user._id,
        reason: `Transfer dispatched: ${transfer.transferNumber}`,
      });
      line.dispatchedQty = line.requestedQty;
    }

    transfer.status = TRANSFER_STATUSES.IN_TRANSIT;
    transfer.dispatchedAt = new Date();
    await transfer.save();

    return successResponse(res, transfer);
  } catch (error) {
    next(error);
  }
};

const receiveTransfer = async (req, res, next) => {
  try {
    const transfer = await StockTransfer.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!transfer) throw new NotFoundError("Stock transfer not found");

    if (transfer.status !== TRANSFER_STATUSES.IN_TRANSIT) {
      throw new ValidationError("Transfer must be in transit to receive");
    }

    // Add stock to destination warehouse
    for (const line of transfer.lines) {
      const qtyToReceive = line.dispatchedQty;
      await inventoryService.receiveStock({
        organizationId: req.organizationId,
        warehouseId: transfer.toWarehouseId,
        productId: line.productId,
        quantity: qtyToReceive,
        sourceType: "TRANSFER_IN",
        sourceId: transfer._id,
        actorId: req.user._id,
        reason: `Transfer received: ${transfer.transferNumber}`,
      });
      line.receivedQty = qtyToReceive;
    }

    transfer.status = TRANSFER_STATUSES.RECEIVED;
    transfer.receivedAt = new Date();
    await transfer.save();

    return successResponse(res, transfer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listTransfers,
  getTransfer,
  createTransfer,
  approveTransfer,
  dispatchTransfer,
  receiveTransfer,
};
