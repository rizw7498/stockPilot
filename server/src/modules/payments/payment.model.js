const mongoose = require("mongoose");
const { PAYMENT_STATUSES } = require("../../shared/constants/statuses");

const paymentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    paymentNumber: {
      type: String,
      required: true,
      trim: true,
    },
    direction: {
      type: String,
      enum: ["INCOMING", "OUTGOING"],
      required: true,
    },
    partyType: {
      type: String,
      enum: ["CUSTOMER", "SUPPLIER"],
      required: true,
    },
    partyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
      index: true,
    },
    purchaseOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      default: null,
    },
    amountMinor: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: "USD",
      trim: true,
      uppercase: true,
    },
    method: {
      type: String,
      enum: ["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "CHECK"],
      default: "BANK_TRANSFER",
    },
    reference: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUSES),
      default: PAYMENT_STATUSES.SUCCEEDED,
      index: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

paymentSchema.index({ organizationId: 1, paymentNumber: 1 }, { unique: true });

module.exports = mongoose.model("Payment", paymentSchema);
