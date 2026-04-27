const prisma = require("../config/prisma");

const POINTS_VALUE = 0.01; // 1 point = $0.01

const getWallet = async (customerId) => {
  const customer = await prisma.customer.findUnique({
    where:  { id: Number(customerId) },
    select: { id: true, name: true, phone: true, loyaltyPoints: true },
  });
  if (!customer) throw new Error("Customer not found");
  return customer;
};

const getTransactionHistory = async (customerId) => {
  return await prisma.loyalty_transaction.findMany({
    where:   { customerId: Number(customerId) },
    include: { order: { select: { id: true, orderNumber: true, totalAmount: true } } },
    orderBy: { createdAt: "desc" },
  });
};

const addPoints = async (customerId, points, orderId = null) => {
  return await prisma.$transaction([
    prisma.customer.update({
      where: { id: Number(customerId) },
      data:  { loyaltyPoints: { increment: points } },
    }),
    prisma.loyalty_transaction.create({
      data: { customerId: Number(customerId), points, type: "EARN", orderId },
    }),
  ]);
};

const redeemPoints = async (customerId, points) => {
  const customer = await prisma.customer.findUnique({ where: { id: Number(customerId) } });
  if (!customer) throw new Error("Customer not found");
  if (Number(customer.loyaltyPoints) < points) throw new Error("Insufficient loyalty points");

  const dollarValue = (points * POINTS_VALUE).toFixed(2);

  return { pointsToRedeem: points, dollarValue: Number(dollarValue) };
};

module.exports = { getWallet, getTransactionHistory, addPoints, redeemPoints };
