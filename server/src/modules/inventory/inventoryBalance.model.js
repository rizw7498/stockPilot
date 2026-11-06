const mongoose = require('mongoose');

const inventoryBalanceSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    onHand: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },
    reserved: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

inventoryBalanceSchema.virtual('available').get(function () {
  return Math.max(0, (this.onHand || 0) - (this.reserved || 0));
});

inventoryBalanceSchema.index(
  { organizationId: 1, warehouseId: 1, productId: 1 },
  { unique: true }
);

module.exports = mongoose.model('InventoryBalance', inventoryBalanceSchema);

