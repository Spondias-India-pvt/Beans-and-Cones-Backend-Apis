const express = require("express");
const router  = express.Router();
const ctrl    = require("../controller/loyalty.controller");
const { authenticate, isSuperAdmin } = require("../middleware/auth.middleware");

// Get wallet and history — super admin or branch admin
router.get("/:customerId",              authenticate, ctrl.getWallet);
router.get("/:customerId/history",      authenticate, ctrl.getTransactionHistory);

// Add points manually — super admin only
router.post("/:customerId/add",         authenticate, isSuperAdmin, ctrl.addPoints);

// Calculate redeem value — authenticated
router.post("/:customerId/calculate",   authenticate, ctrl.calculateRedeem);

module.exports = router;
