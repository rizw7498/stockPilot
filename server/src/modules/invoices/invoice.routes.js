const express = require('express');
const { z } = require('zod');
const invoiceController = require('./invoice.controller');
const authMiddleware = require('../../middleware/auth');
const tenantMiddleware = require('../../middleware/tenant');
const { requirePermission } = require('../../middleware/permissions');
const { PERMISSIONS } = require('../../shared/constants/roles');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

const createInvoiceSchema = {
  body: z.object({
    salesOrderId: z.string().min(1),
    dueDate: z.string().optional(),
  }),
};

router.get('/', requirePermission(PERMISSIONS.INVOICES_READ), invoiceController.listInvoices);
router.get('/:id', requirePermission(PERMISSIONS.INVOICES_READ), invoiceController.getInvoice);
router.post(
  '/',
  requirePermission(PERMISSIONS.INVOICES_CREATE),
  validate(createInvoiceSchema),
  invoiceController.createInvoiceFromSalesOrder
);

module.exports = router;
