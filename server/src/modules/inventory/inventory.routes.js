const express = require('express');
const { z } = require('zod');
const inventoryController = require('./inventory.controller');
const authMiddleware = require('../../middleware/auth');
const tenantMiddleware = require('../../middleware/tenant');
const { requirePermission } = require('../../middleware/permissions');
const { PERMISSIONS } = require('../../shared/constants/roles');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

const createAdjustmentSchema = {
  body: z.object({
    warehouseId: z.string().min(1),
    reason: z.string().min(1),
    lines: z.array(
      z.object({
        productId: z.string().min(1),
        countedQty: z.number().min(0),
      })
    ).min(1),
  }),
};

router.get('/', requirePermission(PERMISSIONS.INVENTORY_READ), inventoryController.listInventory);
router.get('/ledger', requirePermission(PERMISSIONS.INVENTORY_READ), inventoryController.listLedger);
router.get('/low-stock', requirePermission(PERMISSIONS.INVENTORY_READ), inventoryController.listLowStock);
router.post(
  '/adjustments',
  requirePermission(PERMISSIONS.INVENTORY_ADJUST),
  validate(createAdjustmentSchema),
  inventoryController.createAdjustment
);
router.post(
  '/adjustments/:id/approve',
  requirePermission(PERMISSIONS.INVENTORY_ADJUST),
  inventoryController.approveAdjustment
);

module.exports = router;
