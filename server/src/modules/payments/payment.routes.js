const express = require("express");
const { z } = require("zod");
const paymentController = require("./payment.controller");
const authMiddleware = require("../../middleware/auth");
const tenantMiddleware = require("../../middleware/tenant");
const { requirePermission } = require("../../middleware/permissions");
const { PERMISSIONS } = require("../../shared/constants/roles");
const validate = require("../../middleware/validate");

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

const recordPaymentSchema = {
  body: z.object({
    direction: z.enum(["INCOMING", "OUTGOING"]),
    partyType: z.enum(["CUSTOMER", "SUPPLIER"]),
    partyId: z.string().min(1),
    invoiceId: z.string().optional().nullable(),
    purchaseOrderId: z.string().optional().nullable(),
    amountMinor: z.number().min(1),
    method: z
      .enum(["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "CHECK"])
      .optional(),
    reference: z.string().optional(),
    notes: z.string().optional(),
  }),
};

router.get(
  "/",
  requirePermission(PERMISSIONS.PAYMENTS_READ),
  paymentController.listPayments,
);
router.post(
  "/",
  requirePermission(PERMISSIONS.PAYMENTS_CREATE),
  validate(recordPaymentSchema),
  paymentController.recordPayment,
);

module.exports = router;
