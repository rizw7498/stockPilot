const express = require("express");
const { z } = require("zod");
const warehouseController = require("./warehouse.controller");
const authMiddleware = require("../../middleware/auth");
const tenantMiddleware = require("../../middleware/tenant");
const { requirePermission } = require("../../middleware/permissions");
const { PERMISSIONS } = require("../../shared/constants/roles");
const validate = require("../../middleware/validate");

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

const createWarehouseSchema = {
  body: z.object({
    code: z.string().min(1).max(20),
    name: z.string().min(1).max(100),
    address: z
      .object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
      })
      .optional(),
    contactPhone: z.string().optional(),
    contactEmail: z.string().optional(),
    isDefault: z.boolean().optional(),
  }),
};

router.get(
  "/",
  requirePermission(PERMISSIONS.WAREHOUSES_READ),
  warehouseController.listWarehouses,
);
router.get(
  "/:id",
  requirePermission(PERMISSIONS.WAREHOUSES_READ),
  warehouseController.getWarehouse,
);
router.post(
  "/",
  requirePermission(PERMISSIONS.WAREHOUSES_CREATE),
  validate(createWarehouseSchema),
  warehouseController.createWarehouse,
);
router.patch(
  "/:id",
  requirePermission(PERMISSIONS.WAREHOUSES_UPDATE),
  warehouseController.updateWarehouse,
);

module.exports = router;
