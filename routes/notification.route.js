const express = require("express");
const router  = express.Router();
const ctrl    = require("../controller/notification.controller");
const { authenticate, isSuperAdmin } = require("../middleware/auth.middleware");

router.post("/",              authenticate, isSuperAdmin, ctrl.createNotification);
router.get("/",               authenticate, ctrl.getAllNotifications);
router.patch("/read-all",     authenticate, ctrl.markAllAsRead);
router.patch("/:id/read",     authenticate, ctrl.markAsRead);
router.delete("/:id",         authenticate, isSuperAdmin, ctrl.deleteNotification);

module.exports = router;
