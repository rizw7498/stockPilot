const mongoose = require('mongoose');

const fulfillmentLineSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  fulfilledQty: {
    type: Number,
    required: true,
    min: 1,
  },
});

const fulfillmentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    fulfillmentNumber: {
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
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    lines: [fulfillmentLineSchema],
    carrier: {
      type: String,
      default: '',
      trim: true,
    },
    trackingNumber: {
      type: String,
      default: '',
      trim: true,
    },
    dispatchedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dispatchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

fulfillmentSchema.index({ organizationId: 1, fulfillmentNumber: 1 }, { unique: true });

module.exports = mongoose.model('Fulfillment', fulfillmentSchema);
