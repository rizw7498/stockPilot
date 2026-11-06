const express = require("express");
const { z } = require("zod");
const returnController = require("./return.controller");
const authMiddleware = require("../../middleware/auth");
const tenantMiddleware = require("../../middleware/tenant");
const { requirePermission } = require("../../middleware/permissions");
const { PERMISSIONS } = require("../../shared/constants/roles");
const validate = require("../../middleware/validate");

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

const createReturnSchema = {
  body: z.object({
    returnType: z.enum(["SALES_RETURN", "PURCHASE_RETURN"]),
    sourceId: z.string().min(1),
    warehouseId: z.string().min(1),
    disposition: z
      .enum(["RESTOCK", "QUARANTINE", "SCRAP", "REPAIR"])
      .optional(),
    reason: z.string().min(1),
    refundMinor: z.number().min(0).optional(),
    lines: z
      .array(
        z.object({
          productId: z.string().min(1),
          returnedQty: z.number().min(1),
          unitPriceOrCostMinor: z.number().min(0),
        }),
      )
      .min(1),
  }),
};

router.get(
  "/",
  requirePermission(PERMISSIONS.RETURNS_READ),
  returnController.listReturns,
);
router.get(
  "/:id",
  requirePermission(PERMISSIONS.RETURNS_READ),
  returnController.getReturn,
);
router.post(
  "/",
  requirePermission(PERMISSIONS.RETURNS_CREATE),
  validate(createReturnSchema),
  returnController.createReturn,
);
router.post(
  "/:id/approve",
  requirePermission(PERMISSIONS.RETURNS_APPROVE),
  returnController.approveReturn,
);
router.post(
  "/:id/complete",
  requirePermission(PERMISSIONS.RETURNS_APPROVE),
  returnController.completeReturn,
);

module.exports = router;
