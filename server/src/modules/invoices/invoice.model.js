const mongoose = require('mongoose');
const { INVOICE_STATUSES } = require('../../shared/constants/statuses');

const invoiceLineSnapshotSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPriceMinor: { type: Number, required: true, min: 0 },
  totalMinor: { type: Number, required: true, min: 0 },
});

const invoiceSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
    },
    salesOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    linesSnapshot: [invoiceLineSnapshotSchema],
    subtotalMinor: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    taxMinor: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmountMinor: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    paidAmountMinor: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceDueMinor: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true,
      uppercase: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(INVOICE_STATUSES),
      default: INVOICE_STATUSES.ISSUED,
      index: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

invoiceSchema.index({ organizationId: 1, invoiceNumber: 1 }, { unique: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
