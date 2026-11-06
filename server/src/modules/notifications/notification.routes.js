const express = require("express");
const notificationController = require("./notification.controller");
const authMiddleware = require("../../middleware/auth");
const tenantMiddleware = require("../../middleware/tenant");

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.get("/", notificationController.listNotifications);
router.patch("/:id/read", notificationController.markAsRead);

module.exports = router;
