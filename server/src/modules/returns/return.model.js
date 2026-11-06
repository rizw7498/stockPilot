const mongoose = require("mongoose");
const {
  RETURN_STATUSES,
  RETURN_DISPOSITIONS,
} = require("../../shared/constants/statuses");

const returnLineSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  returnedQty: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPriceOrCostMinor: {
    type: Number,
    required: true,
    min: 0,
  },
});

const returnSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    returnNumber: {
      type: String,
      required: true,
      trim: true,
    },
    returnType: {
      type: String,
      enum: ["SALES_RETURN", "PURCHASE_RETURN"],
      required: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    lines: [returnLineSchema],
    disposition: {
      type: String,
      enum: Object.values(RETURN_DISPOSITIONS),
      default: RETURN_DISPOSITIONS.RESTOCK,
    },
    status: {
      type: String,
      enum: Object.values(RETURN_STATUSES),
      default: RETURN_STATUSES.REQUESTED,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    refundMinor: {
      type: Number,
      default: 0,
      min: 0,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

returnSchema.index({ organizationId: 1, returnNumber: 1 }, { unique: true });

module.exports = mongoose.model("Return", returnSchema);
