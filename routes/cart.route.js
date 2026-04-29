const express = require("express");
const router  = express.Router();
const ctrl    = require("../controller/cart.controller");
const { authenticateCustomer } = require("../middleware/auth.middleware");

// All cart routes allow both guest and logged-in customers
router.use(authenticateCustomer);

// ─── Cart management ──────────────────────────────────────────────────────────
router.get("/",                         ctrl.getCart);
router.post("/items",                   ctrl.addToCart);
router.put("/items/:itemId",            ctrl.updateCartItem);
router.delete("/items/:itemId",         ctrl.removeFromCart);

// ─── Coupon on cart ───────────────────────────────────────────────────────────
router.post("/:cartId/coupon",          ctrl.applyCoupon);
router.delete("/:cartId/coupon",        ctrl.removeCoupon);

// ─── Checkout from cart (all items at once) ───────────────────────────────────
router.post("/:cartId/checkout",        ctrl.checkoutFromCart);

// ─── Buy Now (single item, skip cart) ────────────────────────────────────────
router.post("/buy-now",                 ctrl.buyNow);

// ─── Clear cart ───────────────────────────────────────────────────────────────
router.delete("/:cartId",               ctrl.clearCart);

module.exports = router;
