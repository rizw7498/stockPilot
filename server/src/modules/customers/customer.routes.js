const express = require('express');
const { z } = require('zod');
const customerController = require('./customer.controller');
const authMiddleware = require('../../middleware/auth');
const tenantMiddleware = require('../../middleware/tenant');
const { requirePermission } = require('../../middleware/permissions');
const { PERMISSIONS } = require('../../shared/constants/roles');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

const createCustomerSchema = {
  body: z.object({
    name: z.string().min(1),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    billingAddress: z
      .object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
      })
      .optional(),
    shippingAddress: z
      .object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
      })
      .optional(),
    creditLimitMinor: z.number().min(0).optional(),
  }),
};

router.get('/', requirePermission(PERMISSIONS.CUSTOMERS_READ), customerController.listCustomers);
router.get('/:id', requirePermission(PERMISSIONS.CUSTOMERS_READ), customerController.getCustomer);
router.post(
  '/',
  requirePermission(PERMISSIONS.CUSTOMERS_CREATE),
  validate(createCustomerSchema),
  customerController.createCustomer
);
router.patch(
  '/:id',
  requirePermission(PERMISSIONS.CUSTOMERS_UPDATE),
  customerController.updateCustomer
);

module.exports = router;
