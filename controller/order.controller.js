const orderSvc    = require("../service/order.service");
const paymentSvc  = require("../service/payment.service");
const deliverySvc = require("../service/delivery.service");
const { createAuditLog } = require("../utils/auditLog");

const toInt = (v) => Number(v);
const log   = (req, action, module, referenceId, details) =>
  createAuditLog({ userId: req.user.id, username: req.user.username, action, module, referenceId, details });

// ─── Staff / POS Orders ───────────────────────────────────────────────────────

const getAllOrders = async (req, res, next) => {
  try { return res.json({ success: true, data: await orderSvc.getAllOrders(req.user, req.query) }); } catch (e) { next(e); }
};

const getOrderById = async (req, res, next) => {
  try { return res.json({ success: true, data: await orderSvc.getOrderById(toInt(req.params.id)) }); } catch (e) { next(e); }
};

const createOrder = async (req, res, next) => {
  try {
    const order = await orderSvc.checkout(req.body);
    await log(req, "CREATE_ORDER", "ORDER", order.id, `${req.user.username} created order: ${order.orderNumber}`);
    return res.status(201).json({ success: true, message: "Order created", data: order });
  } catch (e) { next(e); }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await orderSvc.updateOrderStatus(toInt(req.params.id), status, req.user.id);
    await log(req, "UPDATE_ORDER_STATUS", "ORDER", order.id, `${req.user.username} updated order to ${status}`);
    return res.json({ success: true, message: "Order status updated", data: order });
  } catch (e) { next(e); }
};

// Staff cancel — any status except COMPLETED
const cancelOrder = async (req, res, next) => {
  try {
    const order = await orderSvc.cancelOrder(toInt(req.params.id), { type: "STAFF", id: req.user.id });
    await log(req, "CANCEL_ORDER", "ORDER", order.id, `${req.user.username} cancelled order ID: ${order.id}`);
    return res.json({ success: true, message: "Order cancelled", data: order });
  } catch (e) { next(e); }
};

// ─── Customer self-service ────────────────────────────────────────────────────

// Customer places order themselves (token required)
const placeOrderByCustomer = async (req, res, next) => {
  try {
    if (!req.customer) return res.status(401).json({ success: false, message: "Customer login required" });
    const order = await orderSvc.checkout({ ...req.body, customerId: req.customer.id });
    return res.status(201).json({ success: true, message: "Order placed successfully", data: order });
  } catch (e) { next(e); }
};

// Customer views their own orders
const getMyOrders = async (req, res, next) => {
  try {
    if (!req.customer) return res.status(401).json({ success: false, message: "Customer login required" });
    const orders = await orderSvc.getAllOrders({ userType: "CUSTOMER" }, { ...req.query, customerId: req.customer.id });
    return res.json({ success: true, data: orders });
  } catch (e) { next(e); }
};

// Customer views single order
const getMyOrderById = async (req, res, next) => {
  try {
    if (!req.customer) return res.status(401).json({ success: false, message: "Customer login required" });
    const order = await orderSvc.getOrderById(toInt(req.params.id));
    if (order.customerId !== req.customer.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    return res.json({ success: true, data: order });
  } catch (e) { next(e); }
};

// Customer cancels own order — within 2-minute window, PENDING only
const cancelOrderByCustomer = async (req, res, next) => {
  try {
    if (!req.customer) return res.status(401).json({ success: false, message: "Customer login required" });
    const order = await orderSvc.cancelOrder(toInt(req.params.id), { type: "CUSTOMER", id: req.customer.id });
    return res.json({ success: true, message: "Order cancelled successfully", data: order });
  } catch (e) { next(e); }
};

// ─── Payments ─────────────────────────────────────────────────────────────────

const createPayment = async (req, res, next) => {
  try {
    const payment = await paymentSvc.createPayment(toInt(req.params.id), req.body);
    await log(req, "CREATE_PAYMENT", "ORDER", req.params.id, `${req.user.username} recorded payment for order ID: ${req.params.id}`);
    return res.status(201).json({ success: true, message: "Payment recorded", data: payment });
  } catch (e) { next(e); }
};

const refundPayment = async (req, res, next) => {
  try {
    const result = await paymentSvc.refundPayment(toInt(req.params.id));
    await log(req, "REFUND_PAYMENT", "ORDER", req.params.id, `${req.user.username} refunded payment for order ID: ${req.params.id}`);
    return res.json({ success: true, message: result.message });
  } catch (e) { next(e); }
};

const getPayment = async (req, res, next) => {
  try { return res.json({ success: true, data: await paymentSvc.getPaymentByOrder(toInt(req.params.id)) }); } catch (e) { next(e); }
};

// ─── Delivery ─────────────────────────────────────────────────────────────────

const createDelivery = async (req, res, next) => {
  try {
    const delivery = await deliverySvc.createDelivery(toInt(req.params.id), req.body.deliveryAddress);
    return res.status(201).json({ success: true, message: "Delivery created", data: delivery });
  } catch (e) { next(e); }
};

const updateDeliveryStatus = async (req, res, next) => {
  try {
    const delivery = await deliverySvc.updateDeliveryStatus(toInt(req.params.id), req.body);
    await log(req, "UPDATE_DELIVERY", "ORDER", req.params.id, `${req.user.username} updated delivery status to ${req.body.status}`);
    return res.json({ success: true, message: "Delivery updated", data: delivery });
  } catch (e) { next(e); }
};

const getDelivery = async (req, res, next) => {
  try { return res.json({ success: true, data: await deliverySvc.getDeliveryByOrder(toInt(req.params.id)) }); } catch (e) { next(e); }
};

const getAllDeliveries = async (req, res, next) => {
  try { return res.json({ success: true, data: await deliverySvc.getAllDeliveries(req.query) }); } catch (e) { next(e); }
};

module.exports = {
  createOrder, getAllOrders, getOrderById, updateOrderStatus,
  cancelOrder, cancelOrderByCustomer,
  placeOrderByCustomer, getMyOrders, getMyOrderById,
  createPayment, refundPayment, getPayment,
  createDelivery, updateDeliveryStatus, getDelivery, getAllDeliveries,
};
