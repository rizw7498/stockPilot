const express = require("express");
const reportController = require("./report.controller");
const authMiddleware = require("../../middleware/auth");
const tenantMiddleware = require("../../middleware/tenant");
const { requirePermission } = require("../../middleware/permissions");
const { PERMISSIONS } = require("../../shared/constants/roles");

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.get("/dashboard", reportController.getDashboardSummary);
router.get(
  "/stock-valuation",
  requirePermission(PERMISSIONS.REPORTS_READ),
  reportController.getStockValuationReport,
);

module.exports = router;
