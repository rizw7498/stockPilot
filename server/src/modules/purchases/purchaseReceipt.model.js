const mongoose = require('mongoose');

const receiptLineSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  receivedQty: {
    type: Number,
    required: true,
    min: 0,
  },
  damagedQty: {
    type: Number,
    default: 0,
    min: 0,
  },
  acceptedQty: {
    type: Number,
    required: true,
    min: 0,
  },
});

const purchaseReceiptSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    receiptNumber: {
      type: String,
      required: true,
      trim: true,
    },
    purchaseOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      required: true,
      index: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    lines: [receiptLineSchema],
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

purchaseReceiptSchema.index({ organizationId: 1, receiptNumber: 1 }, { unique: true });

module.exports = mongoose.model('PurchaseReceipt', purchaseReceiptSchema);
