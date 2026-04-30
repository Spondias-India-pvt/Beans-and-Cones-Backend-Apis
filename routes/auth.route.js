const express          = require("express");
const router           = express.Router();
const ctrl             = require("../controller/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { validateLogin } = require("../validators/auth.validator");

// Staff / Admin auth
router.post("/login",           validateLogin, ctrl.login);
router.get("/me",               authenticate,  ctrl.getMe);

// Forgot password flow
router.post("/forgot-password",  ctrl.forgotPassword);
router.post("/verify-otp",       ctrl.verifyOtp);
router.patch("/reset-password",  ctrl.resetPassword);

module.exports = router;
