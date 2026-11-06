const express = require("express");
const { z } = require("zod");
const orgController = require("./organization.controller");
const authMiddleware = require("../../middleware/auth");
const tenantMiddleware = require("../../middleware/tenant");
const { requirePermission } = require("../../middleware/permissions");
const { PERMISSIONS } = require("../../shared/constants/roles");
const validate = require("../../middleware/validate");

const router = express.Router();

// Apply auth and tenant resolution to all org routes
router.use(authMiddleware, tenantMiddleware);

const updateOrgSchema = {
  body: z.object({
    name: z.string().min(1).optional(),
    currency: z.string().length(3).optional(),
    timezone: z.string().optional(),
    settings: z
      .object({
        reserveOnDraft: z.boolean().optional(),
        allowNegativeStock: z.boolean().optional(),
        lowStockNotificationEmail: z.boolean().optional(),
      })
      .optional(),
  }),
};

const inviteSchema = {
  body: z.object({
    email: z.string().email(),
    roleId: z.string().min(1),
    name: z.string().optional(),
  }),
};

router.get("/current", orgController.getCurrentOrganization);
router.patch(
  "/current",
  requirePermission(PERMISSIONS.SETTINGS_UPDATE),
  validate(updateOrgSchema),
  orgController.updateOrganization,
);
router.get(
  "/members",
  requirePermission(PERMISSIONS.USERS_READ),
  orgController.listMembers,
);
router.post(
  "/invite",
  requirePermission(PERMISSIONS.USERS_INVITE),
  validate(inviteSchema),
  orgController.inviteMember,
);
router.patch(
  "/members/:memberId/role",
  requirePermission(PERMISSIONS.USERS_UPDATE),
  orgController.updateMemberRole,
);
router.get("/roles", orgController.listRoles);

module.exports = router;
