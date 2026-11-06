const mongoose = require("mongoose");
const { STOCK_MOVEMENT_TYPES } = require("../../shared/constants/statuses");

const stockMovementSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(STOCK_MOVEMENT_TYPES),
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    beforeOnHand: {
      type: Number,
      required: true,
    },
    afterOnHand: {
      type: Number,
      required: true,
    },
    sourceType: {
      type: String,
      required: true,
      trim: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    idempotencyKey: {
      type: String,
      default: null,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reason: {
      type: String,
      default: "",
      trim: true,
    },
    occurredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

stockMovementSchema.index({ organizationId: 1, productId: 1, occurredAt: -1 });
stockMovementSchema.index({
  organizationId: 1,
  warehouseId: 1,
  occurredAt: -1,
});

module.exports = mongoose.model("StockMovement", stockMovementSchema);
