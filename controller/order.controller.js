const orderSvc   = require("../service/order.service");
const paymentSvc = require("../service/payment.service");
const deliverySvc = require("../service/delivery.service");
const { createAuditLog } = require("../utils/auditLog");

const toInt = (v) => Number(v);
const log   = (req, action, module, referenceId, details) =>
  createAuditLog({ userId: req.user.id, username: req.user.username, action, module, referenceId, details });

// ─── Orders ───────────────────────────────────────────────────────────────────
const getAllOrders  = async (req, res, next) => { try { return res.json({ success: true, data: await orderSvc.getAllOrders(req.user, req.query) }); } catch (e) { next(e); } };
const getOrderById = async (req, res, next) => { try { return res.json({ success: true, data: await orderSvc.getOrderById(toInt(req.params.id)) }); } catch (e) { next(e); } };

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
    const order = await orderSvc.updateOrderStatus(toInt(req.params.id), status);
    await log(req, "UPDATE_ORDER_STATUS", "ORDER", order.id, `${req.user.username} updated order ${order.orderNumber} to ${status}`);
    return res.json({ success: true, message: "Order status updated", data: order });
  } catch (e) { next(e); }
};

const cancelOrder = async (req, res, next) => {
  try {
    const order = await orderSvc.cancelOrder(toInt(req.params.id));
    await log(req, "CANCEL_ORDER", "ORDER", order.id, `${req.user.username} cancelled order ID: ${order.id}`);
    return res.json({ success: true, message: "Order cancelled", data: order });
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
  createOrder, getAllOrders, getOrderById, updateOrderStatus, cancelOrder,
  createPayment, refundPayment, getPayment,
  createDelivery, updateDeliveryStatus, getDelivery, getAllDeliveries,
};
