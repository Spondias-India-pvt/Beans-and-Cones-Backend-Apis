const express = require("express");
const router  = express.Router();
const ctrl    = require("../controller/customer.controller");
const { requireCustomer } = require("../middleware/auth.middleware");

// Public — no auth
router.post("/register",         ctrl.register);
router.post("/login",            ctrl.login);

// Forgot password — token link flow
router.post("/forgot-password",  ctrl.forgotPassword);     // Step 1: send reset link
router.post("/validate-token",   ctrl.validateResetToken);  // Step 2: validate token from link
router.patch("/reset-password",  ctrl.resetPassword);       // Step 3: reset with token

// Requires customer login
router.get("/profile",           requireCustomer, ctrl.getProfile);
router.put("/profile",           requireCustomer, ctrl.updateProfile);
router.get("/addresses",         requireCustomer, ctrl.getAddresses);
router.post("/addresses",        requireCustomer, ctrl.addAddress);
router.delete("/addresses/:id",  requireCustomer, ctrl.deleteAddress);

module.exports = router;
