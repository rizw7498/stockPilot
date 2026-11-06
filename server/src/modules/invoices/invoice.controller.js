const Invoice = require('./invoice.model');
const SalesOrder = require('../sales/salesOrder.model');
const Customer = require('../customers/customer.model');
const Payment = require('../payments/payment.model');
const { successResponse } = require('../../shared/utils/response');
const { NotFoundError, ValidationError, ConflictError } = require('../../shared/errors');
const { INVOICE_STATUSES } = require('../../shared/constants/statuses');

const listInvoices = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, customerId } = req.query;
    const query = { organizationId: req.organizationId };

    if (status && status !== 'ALL') query.status = status;
    if (customerId) query.customerId = customerId;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate('customerId', 'name email phone')
        .populate('salesOrderId', 'orderNumber status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Invoice.countDocuments(query),
    ]);

    return successResponse(res, invoices, 200, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (error) {
    next(error);
  }
};

const getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    })
      .populate('customerId')
      .populate('salesOrderId');

    if (!invoice) throw new NotFoundError('Invoice not found');

    const payments = await Payment.find({
      organizationId: req.organizationId,
      invoiceId: invoice._id,
    }).populate('recordedBy', 'name');

    return successResponse(res, { invoice, payments });
  } catch (error) {
    next(error);
  }
};

const createInvoiceFromSalesOrder = async (req, res, next) => {
  try {
    const { salesOrderId, dueDate } = req.body;

    const salesOrder = await SalesOrder.findOne({
      _id: salesOrderId,
      organizationId: req.organizationId,
    }).populate('lines.productId');

    if (!salesOrder) throw new NotFoundError('Sales order not found');

    const existingInvoice = await Invoice.findOne({
      salesOrderId: salesOrder._id,
      organizationId: req.organizationId,
    });
    if (existingInvoice) {
      throw new ConflictError(
        `Invoice ${existingInvoice.invoiceNumber} has already been issued for this sales order`
      );
    }

    // Snapshot lines from sales order
    const linesSnapshot = salesOrder.lines.map((l) => ({
      productId: l.productId._id,
      sku: l.productId.sku,
      name: l.productId.name,
      quantity: l.orderedQty,
      unitPriceMinor: l.unitPriceMinor,
      totalMinor: l.totalMinor,
    }));

    const due = dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    const invoice = await Invoice.create({
      organizationId: req.organizationId,
      invoiceNumber,
      salesOrderId: salesOrder._id,
      customerId: salesOrder.customerId,
      linesSnapshot,
      subtotalMinor: salesOrder.subtotalMinor,
      taxMinor: salesOrder.taxMinor,
      totalAmountMinor: salesOrder.totalAmountMinor,
      paidAmountMinor: 0,
      balanceDueMinor: salesOrder.totalAmountMinor,
      currency: salesOrder.currency,
      dueDate: due,
      status: INVOICE_STATUSES.ISSUED,
    });

    // Update customer outstanding balance
    await Customer.updateOne(
      { _id: salesOrder.customerId },
      { $inc: { outstandingBalanceMinor: salesOrder.totalAmountMinor } }
    );

    return successResponse(res, invoice, 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listInvoices,
  getInvoice,
  createInvoiceFromSalesOrder,
};
