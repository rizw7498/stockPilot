const express = require('express');
const { z } = require('zod');
const salesController = require('./sales.controller');
const authMiddleware = require('../../middleware/auth');
const tenantMiddleware = require('../../middleware/tenant');
const { requirePermission } = require('../../middleware/permissions');
const { PERMISSIONS } = require('../../shared/constants/roles');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

const createSoSchema = {
  body: z.object({
    customerId: z.string().min(1),
    warehouseId: z.string().min(1),
    taxMinor: z.number().min(0).optional(),
    discountMinor: z.number().min(0).optional(),
    notes: z.string().optional(),
    lines: z.array(
      z.object({
        productId: z.string().min(1),
        orderedQty: z.number().min(1),
        unitPriceMinor: z.number().min(0).optional(),
      })
    ).min(1),
  }),
};

const fulfillSchema = {
  body: z.object({
    carrier: z.string().optional(),
    trackingNumber: z.string().optional(),
    lines: z.array(
      z.object({
        productId: z.string().min(1),
        fulfilledQty: z.number().min(1),
      })
    ).min(1),
  }),
};

router.get('/', requirePermission(PERMISSIONS.SALES_READ), salesController.listSalesOrders);
router.get('/:id', requirePermission(PERMISSIONS.SALES_READ), salesController.getSalesOrder);
router.post(
  '/',
  requirePermission(PERMISSIONS.SALES_CREATE),
  validate(createSoSchema),
  salesController.createSalesOrder
);
router.post(
  '/:id/confirm',
  requirePermission(PERMISSIONS.SALES_APPROVE),
  salesController.confirmAndReserveOrder
);
router.post(
  '/:id/fulfillments',
  requirePermission(PERMISSIONS.SALES_FULFILL),
  validate(fulfillSchema),
  salesController.createFulfillment
);
router.post(
  '/:id/cancel',
  requirePermission(PERMISSIONS.SALES_CANCEL),
  salesController.cancelSalesOrder
);

module.exports = router;
