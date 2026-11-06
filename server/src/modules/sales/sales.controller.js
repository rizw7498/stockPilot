const SalesOrder = require("./salesOrder.model");
const Fulfillment = require("./fulfillment.model");
const Customer = require("../customers/customer.model");
const Product = require("../products/product.model");
const Invoice = require("../invoices/invoice.model");
const inventoryService = require("../inventory/inventory.service");
const { successResponse } = require("../../shared/utils/response");
const {
  NotFoundError,
  ValidationError,
  InsufficientStockError,
} = require("../../shared/errors");
const { SALES_ORDER_STATUSES } = require("../../shared/constants/statuses");

const listSalesOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, customerId } = req.query;
    const query = { organizationId: req.organizationId };

    if (status && status !== "ALL") query.status = status;
    if (customerId) query.customerId = customerId;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [orders, total] = await Promise.all([
      SalesOrder.find(query)
        .populate("customerId", "name email phone")
        .populate("warehouseId", "name code")
        .populate("lines.productId", "name sku unit")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      SalesOrder.countDocuments(query),
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

const getSalesOrder = async (req, res, next) => {
  try {
    const order = await SalesOrder.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    })
      .populate("customerId")
      .populate("warehouseId")
      .populate("lines.productId")
      .populate("createdBy", "name email");

    if (!order) throw new NotFoundError("Sales order not found");

    const [fulfillments, invoice] = await Promise.all([
      Fulfillment.find({
        organizationId: req.organizationId,
        salesOrderId: order._id,
      }).populate("dispatchedBy", "name"),
      Invoice.findOne({
        organizationId: req.organizationId,
        salesOrderId: order._id,
      }),
    ]);

    return successResponse(res, { order, fulfillments, invoice });
  } catch (error) {
    next(error);
  }
};

const createSalesOrder = async (req, res, next) => {
  try {
    const {
      customerId,
      warehouseId,
      lines,
      taxMinor = 0,
      discountMinor = 0,
      notes,
    } = req.body;

    const customer = await Customer.findOne({
      _id: customerId,
      organizationId: req.organizationId,
    });
    if (!customer) throw new NotFoundError("Customer not found");

    if (!lines || lines.length === 0) {
      throw new ValidationError("At least one order line is required");
    }

    let subtotalMinor = 0;
    const processedLines = [];

    for (const line of lines) {
      const product = await Product.findOne({
        _id: line.productId,
        organizationId: req.organizationId,
      });
      if (!product)
        throw new NotFoundError(`Product not found: ${line.productId}`);

      const unitPriceMinor =
        line.unitPriceMinor !== undefined
          ? Math.round(line.unitPriceMinor)
          : product.priceMinor;
      const totalMinor = unitPriceMinor * line.orderedQty;
      subtotalMinor += totalMinor;

      processedLines.push({
        productId: product._id,
        orderedQty: line.orderedQty,
        reservedQty: 0,
        fulfilledQty: 0,
        unitPriceMinor,
        totalMinor,
      });
    }

    const totalAmountMinor = Math.max(
      0,
      subtotalMinor + (taxMinor || 0) - (discountMinor || 0),
    );
    const orderNumber = `SO-${Date.now().toString().slice(-6)}`;

    const order = await SalesOrder.create({
      organizationId: req.organizationId,
      orderNumber,
      customerId: customer._id,
      warehouseId,
      status: SALES_ORDER_STATUSES.DRAFT,
      lines: processedLines,
      subtotalMinor,
      taxMinor,
      discountMinor,
      totalAmountMinor,
      notes: notes || "",
      createdBy: req.user._id,
    });

    return successResponse(res, order, 201);
  } catch (error) {
    next(error);
  }
};

const confirmAndReserveOrder = async (req, res, next) => {
  try {
    const order = await SalesOrder.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!order) throw new NotFoundError("Sales order not found");

    if (
      order.status !== SALES_ORDER_STATUSES.DRAFT &&
      order.status !== SALES_ORDER_STATUSES.CONFIRMED
    ) {
      throw new ValidationError(
        `Order in state "${order.status}" cannot be confirmed/reserved`,
      );
    }

    // Attempt to reserve stock for each line
    for (const line of order.lines) {
      const neededReservation = line.orderedQty - line.reservedQty;
      if (neededReservation > 0) {
        await inventoryService.reserveStock({
          organizationId: req.organizationId,
          warehouseId: order.warehouseId,
          productId: line.productId,
          quantity: neededReservation,
          sourceType: "SALES_ORDER",
          sourceId: order._id,
          actorId: req.user._id,
          reason: `Reservation for ${order.orderNumber}`,
        });
        line.reservedQty = line.orderedQty;
      }
    }

    order.status = SALES_ORDER_STATUSES.RESERVED;
    await order.save();

    return successResponse(res, order);
  } catch (error) {
    next(error);
  }
};

const createFulfillment = async (req, res, next) => {
  try {
    const { lines, carrier, trackingNumber } = req.body;
    const order = await SalesOrder.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!order) throw new NotFoundError("Sales order not found");

    if (
      order.status !== SALES_ORDER_STATUSES.RESERVED &&
      order.status !== SALES_ORDER_STATUSES.PARTIALLY_FULFILLED
    ) {
      throw new ValidationError(
        `Cannot fulfill order in "${order.status}" status. Ensure order is confirmed and stock reserved.`,
      );
    }

    if (!lines || lines.length === 0) {
      throw new ValidationError("Fulfillment lines must be provided");
    }

    const fulfillmentLines = [];

    for (const fLine of lines) {
      const soLine = order.lines.find(
        (l) => l.productId.toString() === fLine.productId.toString(),
      );
      if (!soLine) {
        throw new ValidationError(
          `Product ${fLine.productId} not found in this sales order`,
        );
      }

      const remainingToFulfill = soLine.orderedQty - soLine.fulfilledQty;
      const fulfillQty = fLine.fulfilledQty;

      if (fulfillQty <= 0) continue;

      if (fulfillQty > remainingToFulfill) {
        throw new ValidationError(
          `Requested fulfillment (${fulfillQty}) exceeds remaining unfulfilled quantity (${remainingToFulfill})`,
        );
      }

      // Dispatch stock: reduces onHand and reduces reserved, registers SALE_DISPATCH movement
      await inventoryService.dispatchStock({
        organizationId: req.organizationId,
        warehouseId: order.warehouseId,
        productId: soLine.productId,
        quantity: fulfillQty,
        sourceType: "SALE_DISPATCH",
        sourceId: order._id,
        actorId: req.user._id,
        reason: `Dispatch for ${order.orderNumber}`,
      });

      soLine.fulfilledQty += fulfillQty;
      soLine.reservedQty = Math.max(0, soLine.reservedQty - fulfillQty);

      fulfillmentLines.push({
        productId: soLine.productId,
        fulfilledQty: fulfillQty,
      });
    }

    const allFulfilled = order.lines.every(
      (l) => l.fulfilledQty >= l.orderedQty,
    );
    order.status = allFulfilled
      ? SALES_ORDER_STATUSES.FULFILLED
      : SALES_ORDER_STATUSES.PARTIALLY_FULFILLED;

    await order.save();

    // Create Fulfillment record
    const fulfillmentNumber = `FUL-${Date.now().toString().slice(-6)}`;
    const fulfillment = await Fulfillment.create({
      organizationId: req.organizationId,
      fulfillmentNumber,
      salesOrderId: order._id,
      warehouseId: order.warehouseId,
      lines: fulfillmentLines,
      carrier: carrier || "",
      trackingNumber: trackingNumber || "",
      dispatchedBy: req.user._id,
    });

    return successResponse(res, { order, fulfillment });
  } catch (error) {
    next(error);
  }
};

const cancelSalesOrder = async (req, res, next) => {
  try {
    const order = await SalesOrder.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!order) throw new NotFoundError("Sales order not found");

    if (
      order.status === SALES_ORDER_STATUSES.FULFILLED ||
      order.status === SALES_ORDER_STATUSES.PARTIALLY_FULFILLED
    ) {
      throw new ValidationError(
        "Cannot cancel order with fulfilled items. Use returns/refunds workflow instead.",
      );
    }

    // Release any reserved stock
    for (const line of order.lines) {
      if (line.reservedQty > 0) {
        await inventoryService.releaseStock({
          organizationId: req.organizationId,
          warehouseId: order.warehouseId,
          productId: line.productId,
          quantity: line.reservedQty,
          sourceType: "ORDER_CANCEL",
          sourceId: order._id,
          actorId: req.user._id,
          reason: `Cancelled order ${order.orderNumber}`,
        });
        line.reservedQty = 0;
      }
    }

    order.status = SALES_ORDER_STATUSES.CANCELLED;
    await order.save();

    return successResponse(res, order);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listSalesOrders,
  getSalesOrder,
  createSalesOrder,
  confirmAndReserveOrder,
  createFulfillment,
  cancelSalesOrder,
};
