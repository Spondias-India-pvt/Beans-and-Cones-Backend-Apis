const express = require("express");
const router  = express.Router();
const ctrl    = require("../controller/cart.controller");
const { authenticateCustomer } = require("../middleware/auth.middleware");

// All cart routes allow both guest and logged-in customers
router.use(authenticateCustomer);

router.get("/",                       ctrl.getCart);
router.post("/items",                 ctrl.addToCart);
router.put("/items/:itemId",          ctrl.updateCartItem);
router.delete("/items/:itemId",       ctrl.removeFromCart);
router.post("/:cartId/coupon",        ctrl.applyCoupon);
router.delete("/:cartId",             ctrl.clearCart);

module.exports = router;
