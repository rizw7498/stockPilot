const express = require("express");
const { z } = require("zod");
const transferController = require("./transfer.controller");
const authMiddleware = require("../../middleware/auth");
const tenantMiddleware = require("../../middleware/tenant");
const { requirePermission } = require("../../middleware/permissions");
const { PERMISSIONS } = require("../../shared/constants/roles");
const validate = require("../../middleware/validate");

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

const createTransferSchema = {
  body: z.object({
    fromWarehouseId: z.string().min(1),
    toWarehouseId: z.string().min(1),
    notes: z.string().optional(),
    lines: z
      .array(
        z.object({
          productId: z.string().min(1),
          requestedQty: z.number().min(1),
        }),
      )
      .min(1),
  }),
};

router.get(
  "/",
  requirePermission(PERMISSIONS.INVENTORY_READ),
  transferController.listTransfers,
);
router.get(
  "/:id",
  requirePermission(PERMISSIONS.INVENTORY_READ),
  transferController.getTransfer,
);
router.post(
  "/",
  requirePermission(PERMISSIONS.INVENTORY_TRANSFER),
  validate(createTransferSchema),
  transferController.createTransfer,
);
router.post(
  "/:id/approve",
  requirePermission(PERMISSIONS.INVENTORY_TRANSFER),
  transferController.approveTransfer,
);
router.post(
  "/:id/dispatch",
  requirePermission(PERMISSIONS.INVENTORY_TRANSFER),
  transferController.dispatchTransfer,
);
router.post(
  "/:id/receive",
  requirePermission(PERMISSIONS.INVENTORY_TRANSFER),
  transferController.receiveTransfer,
);

module.exports = router;
