const mongoose = require('mongoose');

const stockAdjustmentLineSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  bookQty: {
    type: Number,
    required: true,
  },
  countedQty: {
    type: Number,
    required: true,
  },
  varianceQty: {
    type: Number,
    required: true,
  },
});

const stockAdjustmentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    adjustmentNumber: {
      type: String,
      required: true,
      trim: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'],
      default: 'DRAFT',
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    lines: [stockAdjustmentLineSchema],
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

stockAdjustmentSchema.index({ organizationId: 1, adjustmentNumber: 1 }, { unique: true });

module.exports = mongoose.model('StockAdjustment', stockAdjustmentSchema);
