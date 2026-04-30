const express           = require("express");
const router            = express.Router();
const ctrl              = require("../controller/auth.controller");
const { authenticate }  = require("../middleware/auth.middleware");
const { validateLogin } = require("../validators/auth.validator");

// Staff / Admin auth
router.post("/login",            validateLogin, ctrl.login);
router.get("/me",                authenticate,  ctrl.getMe);

// Forgot password — token link flow
router.post("/forgot-password",  ctrl.forgotPassword);    // Step 1: send reset link
router.post("/validate-token",   ctrl.validateResetToken); // Step 2: validate token from link
router.patch("/reset-password",  ctrl.resetPassword);      // Step 3: reset with token

module.exports = router;
