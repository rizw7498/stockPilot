const express = require('express');
const auditController = require('./audit.controller');
const authMiddleware = require('../../middleware/auth');
const tenantMiddleware = require('../../middleware/tenant');
const { requirePermission } = require('../../middleware/permissions');
const { PERMISSIONS } = require('../../shared/constants/roles');

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', requirePermission(PERMISSIONS.AUDIT_READ), auditController.listAuditLogs);

module.exports = router;

