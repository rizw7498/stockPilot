const Payment = require("./payment.model");
const Invoice = require("../invoices/invoice.model");
const Customer = require("../customers/customer.model");
const Supplier = require("../suppliers/supplier.model");
const { successResponse } = require("../../shared/utils/response");
const { NotFoundError, ValidationError } = require("../../shared/errors");
const {
  PAYMENT_STATUSES,
  INVOICE_STATUSES,
} = require("../../shared/constants/statuses");

const listPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, partyType, direction } = req.query;
    const query = { organizationId: req.organizationId };

    if (partyType) query.partyType = partyType;
    if (direction) query.direction = direction;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate("invoiceId", "invoiceNumber totalAmountMinor")
        .populate("recordedBy", "name email")
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Payment.countDocuments(query),
    ]);

    return successResponse(res, payments, 200, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (error) {
    next(error);
  }
};

const recordPayment = async (req, res, next) => {
  try {
    const {
      direction,
      partyType,
      partyId,
      invoiceId,
      purchaseOrderId,
      amountMinor,
      method,
      reference,
      notes,
    } = req.body;

    if (amountMinor <= 0) {
      throw new ValidationError("Payment amount must be positive");
    }

    let invoice = null;
    if (invoiceId) {
      invoice = await Invoice.findOne({
        _id: invoiceId,
        organizationId: req.organizationId,
      });
      if (!invoice) throw new NotFoundError("Invoice not found");

      if (amountMinor > invoice.balanceDueMinor) {
        throw new ValidationError(
          `Payment amount (${amountMinor}) exceeds invoice balance due (${invoice.balanceDueMinor})`,
        );
      }

      invoice.paidAmountMinor += amountMinor;
      invoice.balanceDueMinor = Math.max(
        0,
        invoice.balanceDueMinor - amountMinor,
      );
      invoice.status =
        invoice.balanceDueMinor === 0
          ? INVOICE_STATUSES.PAID
          : INVOICE_STATUSES.PARTIALLY_PAID;
      await invoice.save();

      // Reduce customer outstanding balance
      await Customer.updateOne(
        { _id: invoice.customerId },
        { $inc: { outstandingBalanceMinor: -amountMinor } },
      );
    } else if (partyType === "SUPPLIER" && partyId) {
      // Reduce supplier outstanding balance for outgoing payment
      await Supplier.updateOne(
        { _id: partyId },
        { $inc: { outstandingBalanceMinor: -amountMinor } },
      );
    }

    const paymentNumber = `PAY-${Date.now().toString().slice(-6)}`;
    const payment = await Payment.create({
      organizationId: req.organizationId,
      paymentNumber,
      direction: direction || "INCOMING",
      partyType: partyType || "CUSTOMER",
      partyId,
      invoiceId: invoiceId || null,
      purchaseOrderId: purchaseOrderId || null,
      amountMinor: Math.round(amountMinor),
      method: method || "BANK_TRANSFER",
      reference: reference || "",
      notes: notes || "",
      status: PAYMENT_STATUSES.SUCCEEDED,
      recordedBy: req.user._id,
    });

    return successResponse(res, { payment, invoice }, 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listPayments,
  recordPayment,
};
