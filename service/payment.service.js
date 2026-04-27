const prisma = require("../config/prisma");

const createPayment = async (orderId, { method, transactionId }) => {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
  if (!order) throw new Error("Order not found");
  if (order.payment) throw new Error("Payment already exists for this order");
  if (order.status === "CANCELLED") throw new Error("Cannot pay for a cancelled order");

  const payment = await prisma.payment.create({
    data: {
      orderId,
      amount:        order.totalAmount,
      method,
      status:        "PAID",
      transactionId: transactionId ?? null,
      paidAt:        new Date(),
    },
  });

  // Update order payment status
  await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: "PAID" } });

  return payment;
};

const refundPayment = async (orderId) => {
  const payment = await prisma.payment.findUnique({ where: { orderId } });
  if (!payment) throw new Error("Payment not found");
  if (payment.status === "REFUNDED") throw new Error("Payment already refunded");
  if (payment.status !== "PAID") throw new Error("Only paid payments can be refunded");

  await prisma.payment.update({ where: { orderId }, data: { status: "REFUNDED" } });
  await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: "REFUNDED" } });

  return { message: "Payment refunded successfully" };
};

const getPaymentByOrder = async (orderId) => {
  const payment = await prisma.payment.findUnique({ where: { orderId } });
  if (!payment) throw new Error("Payment not found");
  return payment;
};

module.exports = { createPayment, refundPayment, getPaymentByOrder };
