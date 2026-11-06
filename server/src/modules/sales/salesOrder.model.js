const mongoose = require("mongoose");
const { SALES_ORDER_STATUSES } = require("../../shared/constants/statuses");

const soLineSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  orderedQty: {
    type: Number,
    required: true,
    min: 1,
  },
  reservedQty: {
    type: Number,
    default: 0,
    min: 0,
  },
  fulfilledQty: {
    type: Number,
    default: 0,
    min: 0,
  },
  unitPriceMinor: {
    type: Number,
    required: true,
    min: 0,
  },
  totalMinor: {
    type: Number,
    required: true,
    min: 0,
  },
});

const salesOrderSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      trim: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(SALES_ORDER_STATUSES),
      default: SALES_ORDER_STATUSES.DRAFT,
      index: true,
    },
    lines: [soLineSchema],
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
    discountMinor: {
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
    currency: {
      type: String,
      default: "USD",
      trim: true,
      uppercase: true,
    },
    orderedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

salesOrderSchema.index({ organizationId: 1, orderNumber: 1 }, { unique: true });

module.exports = mongoose.model("SalesOrder", salesOrderSchema);
