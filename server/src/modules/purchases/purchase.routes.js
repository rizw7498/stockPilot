const express = require("express");
const { z } = require("zod");
const purchaseController = require("./purchase.controller");
const authMiddleware = require("../../middleware/auth");
const tenantMiddleware = require("../../middleware/tenant");
const { requirePermission } = require("../../middleware/permissions");
const { PERMISSIONS } = require("../../shared/constants/roles");
const validate = require("../../middleware/validate");

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

const createPoSchema = {
  body: z.object({
    supplierId: z.string().min(1),
    warehouseId: z.string().min(1),
    expectedDeliveryDate: z.string().optional(),
    notes: z.string().optional(),
    lines: z
      .array(
        z.object({
          productId: z.string().min(1),
          orderedQty: z.number().min(1),
          unitCostMinor: z.number().min(0).optional(),
        }),
      )
      .min(1),
  }),
};

const receiveSchema = {
  body: z.object({
    notes: z.string().optional(),
    lines: z
      .array(
        z.object({
          productId: z.string().min(1),
          receivedQty: z.number().min(1),
          damagedQty: z.number().min(0).optional(),
        }),
      )
      .min(1),
  }),
};

router.get(
  "/",
  requirePermission(PERMISSIONS.PURCHASES_READ),
  purchaseController.listPurchaseOrders,
);
router.get(
  "/:id",
  requirePermission(PERMISSIONS.PURCHASES_READ),
  purchaseController.getPurchaseOrder,
);
router.post(
  "/",
  requirePermission(PERMISSIONS.PURCHASES_CREATE),
  validate(createPoSchema),
  purchaseController.createPurchaseOrder,
);
router.post(
  "/:id/submit",
  requirePermission(PERMISSIONS.PURCHASES_CREATE),
  purchaseController.submitPurchaseOrder,
);
router.post(
  "/:id/approve",
  requirePermission(PERMISSIONS.PURCHASES_APPROVE),
  purchaseController.approvePurchaseOrder,
);
router.post(
  "/:id/receipts",
  requirePermission(PERMISSIONS.PURCHASES_RECEIVE),
  validate(receiveSchema),
  purchaseController.receiveGoods,
);
router.post(
  "/:id/cancel",
  requirePermission(PERMISSIONS.PURCHASES_CANCEL),
  purchaseController.cancelPurchaseOrder,
);

module.exports = router;
