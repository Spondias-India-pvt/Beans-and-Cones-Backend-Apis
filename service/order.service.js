const prisma = require("../config/prisma");

// ─── Constants ────────────────────────────────────────────────────────────────
const POINTS_PER_DOLLAR   = 1;     // earn 1 point per $1 spent
const POINTS_VALUE        = 0.01;  // 1 point = $0.01
const MAX_LOYALTY_PERCENT = 20;    // max 20% of order can be paid with points

// ─── Auto-generate order number ───────────────────────────────────────────────

const generateOrderNumber = async () => {
  const count = await prisma.order.count();
  const date  = new Date();
  return `ORD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${String(count + 1).padStart(5, "0")}`;
};

// ─── Checkout ─────────────────────────────────────────────────────────────────
// Supports: logged-in customer, guest (guestToken), branch staff POS

const checkout = async (data) => {
  const {
    branchId, orderType, items,
    customerId, guestToken,
    customerName, customerPhone,
    couponCode,
    loyaltyPointsToRedeem = 0,
    notes,
  } = data;

  if (!items || items.length === 0) throw new Error("At least one item is required");

  const isGuest    = !customerId;
  const isLoggedIn = !!customerId;

  // Guests cannot use loyalty
  if (isGuest && loyaltyPointsToRedeem > 0) {
    throw new Error("Guests cannot use loyalty points");
  }

  const branch = await prisma.branch.findUnique({
    where:   { id: Number(branchId) },
    include: { settings: true },
  });
  if (!branch) throw new Error("Branch not found");

  // ── Build order items + calculate subtotal ────────────────────────────────
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where:   { id: Number(item.productId) },
      include: { variants: true },
    });
    if (!product || !product.isActive) throw new Error(`Product ${item.productId} not found or inactive`);

    let price = 0;
    if (item.variantId) {
      const variant = product.variants.find((v) => v.id === Number(item.variantId) && v.isActive);
      if (!variant) throw new Error(`Variant ${item.variantId} not found`);
      price = Number(variant.price);
    } else {
      const defaultVariant = product.variants.find((v) => v.isActive);
      if (!defaultVariant) throw new Error(`Product "${product.name}" has no active variants`);
      price = Number(defaultVariant.price);
    }

    subtotal += price * item.quantity;
    orderItems.push({
      productId: Number(item.productId),
      variantId: item.variantId ? Number(item.variantId) : null,
      quantity:  item.quantity,
      price,
    });
  }

  // ── Tax calculation ───────────────────────────────────────────────────────
  const taxRate  = branch.settings ? Number(branch.settings.taxPercentage) / 100 : 0;
  const taxAmount = subtotal * taxRate;

  // ── Coupon validation (both guest and logged-in) ──────────────────────────
  let couponDiscount = 0;
  let couponId       = null;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    if (!coupon || !coupon.isActive)  throw new Error("Invalid or expired coupon");
    if (coupon.expiresAt && new Date() > coupon.expiresAt) throw new Error("Coupon has expired");
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new Error("Coupon usage limit reached");
    if (coupon.minOrderValue && subtotal < Number(coupon.minOrderValue)) {
      throw new Error(`Minimum order value for this coupon is ${coupon.minOrderValue}`);
    }

    couponDiscount = coupon.discountType === "PERCENTAGE"
      ? (subtotal * Number(coupon.discountValue)) / 100
      : Number(coupon.discountValue);

    couponId = coupon.id;
  }

  // ── Loyalty points redemption (logged-in only) ────────────────────────────
  let loyaltyDiscount = 0;
  let pointsToRedeem  = 0;

  if (isLoggedIn && loyaltyPointsToRedeem > 0) {
    const customer = await prisma.customer.findUnique({ where: { id: Number(customerId) } });
    if (!customer) throw new Error("Customer not found");

    const availablePoints = Number(customer.loyaltyPoints);
    if (loyaltyPointsToRedeem > availablePoints) {
      throw new Error(`Insufficient loyalty points. Available: ${availablePoints}`);
    }

    // Max loyalty discount = 20% of subtotal
    const maxLoyaltyDiscount = (subtotal * MAX_LOYALTY_PERCENT) / 100;
    const requestedDiscount  = loyaltyPointsToRedeem * POINTS_VALUE;
    loyaltyDiscount = Math.min(requestedDiscount, maxLoyaltyDiscount);
    pointsToRedeem  = Math.ceil(loyaltyDiscount / POINTS_VALUE);
  }

  // ── Final total ───────────────────────────────────────────────────────────
  const totalAmount = Math.max(0, subtotal + taxAmount - couponDiscount - loyaltyDiscount);
  const orderNumber = await generateOrderNumber();

  // ── Create order in transaction ───────────────────────────────────────────
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        branchId:           Number(branchId),
        customerId:         isLoggedIn ? Number(customerId) : null,
        guestToken:         isGuest ? (guestToken ?? null) : null,
        customerName:       customerName ?? null,
        customerPhone:      customerPhone ?? null,
        orderType,
        status:             "PENDING",
        paymentStatus:      "PENDING",
        subtotal,
        taxAmount,
        couponDiscount,
        loyaltyDiscount,
        loyaltyPointsUsed:  pointsToRedeem,
        totalAmount,
        couponId,
        notes:              notes ?? null,
        items: { create: orderItems },
      },
      include: {
        items:   { include: { product: { select: { id: true, name: true } } } },
        branch:  { select: { id: true, branchName: true } },
        coupon:  { select: { id: true, code: true } },
      },
    });

    // Save order status history
    await tx.order_status_history.create({
      data: { orderId: newOrder.id, status: "PENDING" },
    });

    // Increment coupon usage count + save coupon_usage record
    if (couponId) {
      await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
      await tx.coupon_usage.create({
        data: {
          couponId,
          customerId: isLoggedIn ? Number(customerId) : null,
          guestToken: isGuest ? (guestToken ?? null) : null,
          orderId:    newOrder.id,
        },
      });
    }

    // Deduct loyalty points
    if (isLoggedIn && pointsToRedeem > 0) {
      await tx.customer.update({
        where: { id: Number(customerId) },
        data:  { loyaltyPoints: { decrement: pointsToRedeem } },
      });
      await tx.loyalty_transaction.create({
        data: {
          customerId: Number(customerId),
          points:     -pointsToRedeem,
          type:       "REDEEM",
          orderId:    newOrder.id,
        },
      });
    }

    return newOrder;
  });

  return order;
};

// ─── After order COMPLETED — earn loyalty points ──────────────────────────────

const earnLoyaltyOnCompletion = async (orderId) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || !order.customerId) return; // guests don't earn points

  const pointsEarned = Math.floor(Number(order.totalAmount) * POINTS_PER_DOLLAR);
  if (pointsEarned <= 0) return;

  await prisma.$transaction([
    prisma.customer.update({
      where: { id: order.customerId },
      data:  { loyaltyPoints: { increment: pointsEarned } },
    }),
    prisma.loyalty_transaction.create({
      data: {
        customerId: order.customerId,
        points:     pointsEarned,
        type:       "EARN",
        orderId,
      },
    }),
  ]);

  return pointsEarned;
};

// ─── Get all orders ───────────────────────────────────────────────────────────

const getAllOrders = async (actingUser, filters = {}) => {
  const where = {};

  if (actingUser.userType === "BRANCH_EMPLOYEE") {
    const emp = await prisma.branch_employee.findUnique({ where: { userId: actingUser.id } });
    where.branchId = emp.branchId;
  }

  if (filters.branchId)      where.branchId      = Number(filters.branchId);
  if (filters.status)        where.status        = filters.status;
  if (filters.orderType)     where.orderType     = filters.orderType;
  if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;
  if (filters.customerId)    where.customerId    = Number(filters.customerId);

  return await prisma.order.findMany({
    where,
    include: {
      items:    { include: { product: { select: { id: true, name: true } } } },
      branch:   { select: { id: true, branchName: true } },
      payment:  true,
      customer: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { id: "desc" },
  });
};

const getOrderById = async (id) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items:         { include: { product: { select: { id: true, name: true } } } },
      branch:        { select: { id: true, branchName: true } },
      payment:       true,
      delivery:      true,
      coupon:        { select: { id: true, code: true, discountType: true, discountValue: true } },
      customer:      { select: { id: true, name: true, phone: true, email: true } },
      statusHistory: { orderBy: { changedAt: "asc" } },
    },
  });
  if (!order) throw new Error("Order not found");
  return order;
};

const updateOrderStatus = async (id, status, changedBy = null) => {
  const order = await getOrderById(id);
  if (order.status === "COMPLETED" || order.status === "CANCELLED") {
    throw new Error(`Cannot update a ${order.status} order`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id },
      data:  { status },
      include: { items: true, payment: true },
    });

    await tx.order_status_history.create({
      data: { orderId: id, status, changedBy },
    });

    return updatedOrder;
  });

  // Earn loyalty points when order is completed
  if (status === "COMPLETED") {
    await earnLoyaltyOnCompletion(id);
  }

  return updated;
};

const cancelOrder = async (id, cancelledBy) => {
  // cancelledBy: { type: "STAFF" | "CUSTOMER", id: number }
  const order = await getOrderById(id);

  if (order.status === "COMPLETED") throw new Error("Cannot cancel a completed order");
  if (order.status === "CANCELLED") throw new Error("Order already cancelled");

  // Customer can only cancel PENDING orders
  if (cancelledBy.type === "CUSTOMER") {
    if (order.customerId !== cancelledBy.id) {
      throw new Error("You can only cancel your own orders");
    }
    if (order.status !== "PENDING") {
      throw new Error(`Cannot cancel — order is already ${order.status}. Please contact the branch.`);
    }
  }

  // Restore loyalty points if they were used
  const loyaltyPointsUsed = Number(order.loyaltyPointsUsed);

  return await prisma.$transaction(async (tx) => {
    const cancelled = await tx.order.update({
      where: { id },
      data:  { status: "CANCELLED" },
    });

    await tx.order_status_history.create({
      data: { orderId: id, status: "CANCELLED", changedBy: cancelledBy.id ?? null },
    });

    // Refund loyalty points if used
    if (loyaltyPointsUsed > 0 && order.customerId) {
      await tx.customer.update({
        where: { id: order.customerId },
        data:  { loyaltyPoints: { increment: loyaltyPointsUsed } },
      });
      await tx.loyalty_transaction.create({
        data: {
          customerId: order.customerId,
          points:     loyaltyPointsUsed,
          type:       "REFUND",
          orderId:    id,
        },
      });
    }

    return cancelled;
  });
};

module.exports = {
  checkout, getAllOrders, getOrderById, updateOrderStatus, cancelOrder, earnLoyaltyOnCompletion,
};
