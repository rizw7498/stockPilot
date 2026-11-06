const mongoose = require('mongoose');
const InventoryBalance = require('./inventoryBalance.model');
const StockMovement = require('./stockMovement.model');
const Product = require('../products/product.model');
const { InsufficientStockError, ValidationError } = require('../../shared/errors');
const { STOCK_MOVEMENT_TYPES } = require('../../shared/constants/statuses');

/**
 * Reusable inventory operations ensuring atomicity, validation, and ledger movement creation.
 */

// Get or initialize an inventory balance record
const getOrCreateBalance = async (organizationId, warehouseId, productId, session = null) => {
  let balance = await InventoryBalance.findOne({
    organizationId,
    warehouseId,
    productId,
  }).session(session);

  if (!balance) {
    balance = new InventoryBalance({
      organizationId,
      warehouseId,
      productId,
      onHand: 0,
      reserved: 0,
    });
  }

  return balance;
};

// 1. Receive stock (Increases onHand) - used in Purchase receiving, opening stock, etc.
const receiveStock = async ({
  organizationId,
  warehouseId,
  productId,
  quantity,
  sourceType,
  sourceId,
  actorId,
  reason = '',
  idempotencyKey = null,
  session = null,
}) => {
  if (quantity <= 0) {
    throw new ValidationError('Received quantity must be positive');
  }

  const balance = await getOrCreateBalance(organizationId, warehouseId, productId, session);
  const beforeOnHand = balance.onHand;
  balance.onHand += quantity;
  await balance.save({ session });

  const [movement] = await StockMovement.create(
    [
      {
        organizationId,
        warehouseId,
        productId,
        type: STOCK_MOVEMENT_TYPES.PURCHASE_RECEIPT,
        quantity,
        beforeOnHand,
        afterOnHand: balance.onHand,
        sourceType,
        sourceId,
        actorId,
        reason,
        idempotencyKey,
      },
    ],
    { session }
  );

  return { balance, movement };
};

// 2. Reserve stock (Increases reserved; validates available stock >= quantity)
const reserveStock = async ({
  organizationId,
  warehouseId,
  productId,
  quantity,
  sourceType,
  sourceId,
  actorId,
  reason = '',
  session = null,
}) => {
  if (quantity <= 0) {
    throw new ValidationError('Reservation quantity must be positive');
  }

  const balance = await getOrCreateBalance(organizationId, warehouseId, productId, session);
  const available = balance.onHand - balance.reserved;

  if (available < quantity) {
    throw new InsufficientStockError(
      `Insufficient available stock for product ${productId}. Available: ${available}, Requested: ${quantity}`
    );
  }

  balance.reserved += quantity;
  await balance.save({ session });

  return balance;
};

// 3. Release reserved stock (Decreases reserved) - used on Order cancellation
const releaseStock = async ({
  organizationId,
  warehouseId,
  productId,
  quantity,
  sourceType,
  sourceId,
  actorId,
  reason = '',
  session = null,
}) => {
  if (quantity <= 0) {
    throw new ValidationError('Release quantity must be positive');
  }

  const balance = await getOrCreateBalance(organizationId, warehouseId, productId, session);
  balance.reserved = Math.max(0, balance.reserved - quantity);
  await balance.save({ session });

  return balance;
};

// 4. Dispatch stock (Reduces onHand and reserved atomically) - used on fulfillment
const dispatchStock = async ({
  organizationId,
  warehouseId,
  productId,
  quantity,
  sourceType,
  sourceId,
  actorId,
  reason = '',
  idempotencyKey = null,
  session = null,
}) => {
  if (quantity <= 0) {
    throw new ValidationError('Dispatched quantity must be positive');
  }

  const balance = await getOrCreateBalance(organizationId, warehouseId, productId, session);

  if (balance.onHand < quantity) {
    throw new InsufficientStockError(
      `Cannot dispatch ${quantity} units: only ${balance.onHand} on hand`
    );
  }

  const beforeOnHand = balance.onHand;
  balance.onHand -= quantity;
  balance.reserved = Math.max(0, balance.reserved - quantity);
  await balance.save({ session });

  const [movement] = await StockMovement.create(
    [
      {
        organizationId,
        warehouseId,
        productId,
        type: STOCK_MOVEMENT_TYPES.SALE_DISPATCH,
        quantity: -quantity,
        beforeOnHand,
        afterOnHand: balance.onHand,
        sourceType,
        sourceId,
        actorId,
        reason,
        idempotencyKey,
      },
    ],
    { session }
  );

  return { balance, movement };
};

// 5. Adjust stock (Posts manual stock adjustment)
const adjustStock = async ({
  organizationId,
  warehouseId,
  productId,
  countedQty,
  sourceType = 'ADJUSTMENT',
  sourceId = null,
  actorId,
  reason = '',
  session = null,
}) => {
  const balance = await getOrCreateBalance(organizationId, warehouseId, productId, session);
  const beforeOnHand = balance.onHand;
  const varianceQty = countedQty - beforeOnHand;

  balance.onHand = countedQty;
  await balance.save({ session });

  const [movement] = await StockMovement.create(
    [
      {
        organizationId,
        warehouseId,
        productId,
        type: STOCK_MOVEMENT_TYPES.ADJUSTMENT,
        quantity: varianceQty,
        beforeOnHand,
        afterOnHand: countedQty,
        sourceType,
        sourceId,
        actorId,
        reason,
      },
    ],
    { session }
  );

  return { balance, movement, varianceQty };
};

module.exports = {
  getOrCreateBalance,
  receiveStock,
  reserveStock,
  releaseStock,
  dispatchStock,
  adjustStock,
};
