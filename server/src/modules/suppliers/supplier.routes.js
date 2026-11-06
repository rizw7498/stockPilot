const express = require('express');
const { z } = require('zod');
const supplierController = require('./supplier.controller');
const authMiddleware = require('../../middleware/auth');
const tenantMiddleware = require('../../middleware/tenant');
const { requirePermission } = require('../../middleware/permissions');
const { PERMISSIONS } = require('../../shared/constants/roles');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

const createSupplierSchema = {
  body: z.object({
    name: z.string().min(1),
    companyName: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z
      .object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
      })
      .optional(),
    paymentTerms: z.string().optional(),
  }),
};

router.get('/', requirePermission(PERMISSIONS.SUPPLIERS_READ), supplierController.listSuppliers);
router.get('/:id', requirePermission(PERMISSIONS.SUPPLIERS_READ), supplierController.getSupplier);
router.post(
  '/',
  requirePermission(PERMISSIONS.SUPPLIERS_CREATE),
  validate(createSupplierSchema),
  supplierController.createSupplier
);
router.patch(
  '/:id',
  requirePermission(PERMISSIONS.SUPPLIERS_UPDATE),
  supplierController.updateSupplier
);

module.exports = router;
