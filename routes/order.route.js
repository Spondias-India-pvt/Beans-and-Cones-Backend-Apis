const express = require("express");
const router  = express.Router();
const ctrl    = require("../controller/order.controller");
const { authenticate, canManageEmployees, isSuperAdmin, authenticateCustomer } = require("../middleware/auth.middleware");

// ─── Customer self-service (must be before /:id routes) ──────────────────────
router.post("/customer/place",                authenticateCustomer, ctrl.placeOrderByCustomer);
router.get("/customer/my-orders",             authenticateCustomer, ctrl.getMyOrders);
router.get("/customer/my-orders/:id",         authenticateCustomer, ctrl.getMyOrderById);

// ─── Staff / POS Orders ───────────────────────────────────────────────────────
router.post("/",                              authenticate, canManageEmployees, ctrl.createOrder);
router.get("/",                               authenticate, canManageEmployees, ctrl.getAllOrders);
router.get("/deliveries",                     authenticate, canManageEmployees, ctrl.getAllDeliveries);
router.get("/:id",                            authenticate, canManageEmployees, ctrl.getOrderById);
router.patch("/:id/status",                   authenticate, canManageEmployees, ctrl.updateOrderStatus);

// Staff cancel (any status except COMPLETED)
router.patch("/:id/cancel",                   authenticate, canManageEmployees, ctrl.cancelOrder);

// Customer cancel (within 2-minute window, PENDING only)
router.patch("/:id/customer-cancel",          authenticateCustomer, ctrl.cancelOrderByCustomer);

// ─── Payments ─────────────────────────────────────────────────────────────────
router.post("/:id/payment",                   authenticate, canManageEmployees, ctrl.createPayment);
router.get("/:id/payment",                    authenticate, canManageEmployees, ctrl.getPayment);
router.patch("/:id/payment/refund",           authenticate, isSuperAdmin, ctrl.refundPayment);

// ─── Delivery ─────────────────────────────────────────────────────────────────
router.post("/:id/delivery",                  authenticate, canManageEmployees, ctrl.createDelivery);
router.get("/:id/delivery",                   authenticate, canManageEmployees, ctrl.getDelivery);
router.patch("/:id/delivery/status",          authenticate, canManageEmployees, ctrl.updateDeliveryStatus);

module.exports = router;
