const express = require("express");
const router  = express.Router();
const ctrl    = require("../controller/coupon.controller");
const { authenticate, isSuperAdmin } = require("../middleware/auth.middleware");

// Validate coupon — accessible to anyone authenticated
router.post("/validate",          authenticate, ctrl.validateCoupon);

// CRUD — super admin only
router.post("/",                  authenticate, isSuperAdmin, ctrl.createCoupon);
router.get("/",                   authenticate, isSuperAdmin, ctrl.getAllCoupons);
router.get("/:id",                authenticate, isSuperAdmin, ctrl.getCouponById);
router.put("/:id",                authenticate, isSuperAdmin, ctrl.updateCoupon);
router.delete("/:id",             authenticate, isSuperAdmin, ctrl.deleteCoupon);

module.exports = router;
