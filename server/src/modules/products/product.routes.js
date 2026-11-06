const express = require('express');
const { z } = require('zod');
const productController = require('./product.controller');
const authMiddleware = require('../../middleware/auth');
const tenantMiddleware = require('../../middleware/tenant');
const { requirePermission } = require('../../middleware/permissions');
const { PERMISSIONS } = require('../../shared/constants/roles');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

const createProductSchema = {
  body: z.object({
    sku: z.string().min(1).max(50),
    name: z.string().min(1).max(150),
    barcode: z.string().optional(),
    categoryId: z.string().optional().nullable(),
    unit: z.string().optional(),
    costMinor: z.number().min(0).optional(),
    priceMinor: z.number().min(0).optional(),
    reorderLevel: z.number().min(0).optional(),
    description: z.string().optional(),
    initialStock: z.number().min(0).optional(),
    initialWarehouseId: z.string().optional(),
  }),
};

router.get('/', requirePermission(PERMISSIONS.PRODUCTS_READ), productController.listProducts);
router.get('/:id', requirePermission(PERMISSIONS.PRODUCTS_READ), productController.getProduct);
router.get('/:id/stock', requirePermission(PERMISSIONS.PRODUCTS_READ), productController.getProductStock);
router.post(
  '/',
  requirePermission(PERMISSIONS.PRODUCTS_CREATE),
  validate(createProductSchema),
  productController.createProduct
);
router.patch(
  '/:id',
  requirePermission(PERMISSIONS.PRODUCTS_UPDATE),
  productController.updateProduct
);
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.PRODUCTS_DELETE),
  productController.archiveProduct
);

module.exports = router;
