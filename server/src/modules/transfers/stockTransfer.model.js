const mongoose = require("mongoose");
const { TRANSFER_STATUSES } = require("../../shared/constants/statuses");

const transferLineSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  requestedQty: {
    type: Number,
    required: true,
    min: 1,
  },
  dispatchedQty: {
    type: Number,
    default: 0,
    min: 0,
  },
  receivedQty: {
    type: Number,
    default: 0,
    min: 0,
  },
});

const stockTransferSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    transferNumber: {
      type: String,
      required: true,
      trim: true,
    },
    fromWarehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
      index: true,
    },
    toWarehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
      index: true,
    },
    lines: [transferLineSchema],
    status: {
      type: String,
      enum: Object.values(TRANSFER_STATUSES),
      default: TRANSFER_STATUSES.DRAFT,
      index: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dispatchedAt: {
      type: Date,
      default: null,
    },
    receivedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

stockTransferSchema.index(
  { organizationId: 1, transferNumber: 1 },
  { unique: true },
);

module.exports = mongoose.model("StockTransfer", stockTransferSchema);
