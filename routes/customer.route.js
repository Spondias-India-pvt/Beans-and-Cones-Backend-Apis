const express = require("express");
const router  = express.Router();
const ctrl    = require("../controller/customer.controller");
const { requireCustomer } = require("../middleware/auth.middleware");

// Public
router.post("/register",  ctrl.register);
router.post("/login",     ctrl.login);

// Requires customer login
router.get("/profile",              requireCustomer, ctrl.getProfile);
router.put("/profile",              requireCustomer, ctrl.updateProfile);
router.get("/addresses",            requireCustomer, ctrl.getAddresses);
router.post("/addresses",           requireCustomer, ctrl.addAddress);
router.delete("/addresses/:id",     requireCustomer, ctrl.deleteAddress);

module.exports = router;
