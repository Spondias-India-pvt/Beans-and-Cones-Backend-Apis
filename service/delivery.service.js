const prisma = require("../config/prisma");

const createDelivery = async (orderId, deliveryAddress) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");
  if (order.orderType !== "DELIVERY") throw new Error("Order is not a delivery order");

  const existing = await prisma.delivery.findUnique({ where: { orderId } });
  if (existing) throw new Error("Delivery already exists for this order");

  return await prisma.delivery.create({
    data: { orderId, deliveryAddress, status: "pending" },
  });
};

const getDeliveryByOrder = async (orderId) => {
  const delivery = await prisma.delivery.findUnique({ where: { orderId } });
  if (!delivery) throw new Error("Delivery not found");
  return delivery;
};

const updateDeliveryStatus = async (orderId, { status, assignedTo, estimatedTime }) => {
  const delivery = await getDeliveryByOrder(orderId);

  const updateData = { status };
  if (assignedTo)    updateData.assignedTo    = Number(assignedTo);
  if (estimatedTime) updateData.estimatedTime = new Date(estimatedTime);
  if (status === "delivered") updateData.deliveredAt = new Date();

  return await prisma.delivery.update({ where: { orderId }, data: updateData });
};

const getAllDeliveries = async (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  return await prisma.delivery.findMany({
    where,
    include: { order: { select: { id: true, orderNumber: true, totalAmount: true, branch: { select: { branchName: true } } } } },
    orderBy: { id: "desc" },
  });
};

module.exports = { createDelivery, getDeliveryByOrder, updateDeliveryStatus, getAllDeliveries };
