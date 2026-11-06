const express = require('express');
const { z } = require('zod');
const categoryController = require('./category.controller');
const authMiddleware = require('../../middleware/auth');
const tenantMiddleware = require('../../middleware/tenant');
const { requirePermission } = require('../../middleware/permissions');
const { PERMISSIONS } = require('../../shared/constants/roles');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

const createCategorySchema = {
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    parentId: z.string().optional().nullable(),
  }),
};

router.get('/', requirePermission(PERMISSIONS.PRODUCTS_READ), categoryController.listCategories);
router.post(
  '/',
  requirePermission(PERMISSIONS.PRODUCTS_CREATE),
  validate(createCategorySchema),
  categoryController.createCategory
);
router.patch(
  '/:id',
  requirePermission(PERMISSIONS.PRODUCTS_UPDATE),
  categoryController.updateCategory
);
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.PRODUCTS_DELETE),
  categoryController.deleteCategory
);

module.exports = router;
