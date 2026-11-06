const mongoose = require('mongoose');
const { PURCHASE_ORDER_STATUSES } = require('../../shared/constants/statuses');

const poLineSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  orderedQty: {
    type: Number,
    required: true,
    min: 1,
  },
  receivedQty: {
    type: Number,
    default: 0,
    min: 0,
  },
  unitCostMinor: {
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

const purchaseOrderSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    poNumber: {
      type: String,
      required: true,
      trim: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      index: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(PURCHASE_ORDER_STATUSES),
      default: PURCHASE_ORDER_STATUSES.DRAFT,
      index: true,
    },
    lines: [poLineSchema],
    totalAmountMinor: {
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
    orderedAt: {
      type: Date,
      default: null,
    },
    expectedDeliveryDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

purchaseOrderSchema.index({ organizationId: 1, poNumber: 1 }, { unique: true });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
