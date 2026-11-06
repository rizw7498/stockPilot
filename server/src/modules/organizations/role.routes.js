const express = require('express');
const { z } = require('zod');
const roleController = require('./role.controller');
const authMiddleware = require('../../middleware/auth');
const tenantMiddleware = require('../../middleware/tenant');
const { requirePermission } = require('../../middleware/permissions');
const { PERMISSIONS } = require('../../shared/constants/roles');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

const createRoleSchema = {
  body: z.object({
    name: z.string().min(2).max(50),
    permissions: z.array(z.string()).min(1),
  }),
};

const updateRoleSchema = {
  body: z.object({
    name: z.string().min(2).max(50).optional(),
    permissions: z.array(z.string()).optional(),
  }),
};

router.get('/permissions-catalog', roleController.getPermissionsCatalog);
router.get('/', requirePermission(PERMISSIONS.USERS_READ), roleController.listRoles);
router.get('/:id', requirePermission(PERMISSIONS.USERS_READ), roleController.getRole);
router.post(
  '/',
  requirePermission(PERMISSIONS.USERS_UPDATE),
  validate(createRoleSchema),
  roleController.createRole
);
router.patch(
  '/:id',
  requirePermission(PERMISSIONS.USERS_UPDATE),
  validate(updateRoleSchema),
  roleController.updateRole
);
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.USERS_UPDATE),
  roleController.deleteRole
);

module.exports = router;
