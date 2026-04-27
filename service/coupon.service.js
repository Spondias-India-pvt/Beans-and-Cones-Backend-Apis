const prisma = require("../config/prisma");

const createCoupon = async (data) => {
  const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
  if (existing) throw new Error("Coupon code already exists");

  return await prisma.coupon.create({
    data: {
      code:          data.code,
      discountType:  data.discountType,
      discountValue: data.discountValue,
      minOrderValue: data.minOrderValue ?? null,
      maxUses:       data.maxUses       ?? null,
      isActive:      true,
      expiresAt:     data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });
};

const getAllCoupons = async (filters = {}) => {
  const where = {};
  if (filters.isActive !== undefined) where.isActive = filters.isActive === "true";
  return await prisma.coupon.findMany({ where, orderBy: { id: "desc" } });
};

const getCouponById = async (id) => {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new Error("Coupon not found");
  return coupon;
};

const updateCoupon = async (id, data) => {
  await getCouponById(id);
  const updateData = {};
  const fields = ["discountType","discountValue","minOrderValue","maxUses","isActive","expiresAt"];
  for (const f of fields) {
    if (data[f] !== undefined) {
      updateData[f] = f === "expiresAt" ? new Date(data[f]) : data[f];
    }
  }
  return await prisma.coupon.update({ where: { id }, data: updateData });
};

const deleteCoupon = async (id) => {
  await getCouponById(id);
  return await prisma.coupon.update({ where: { id }, data: { isActive: false } });
};

const validateCoupon = async (code, orderAmount) => {
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon)           throw new Error("Coupon not found");
  if (!coupon.isActive)  throw new Error("Coupon is inactive");
  if (coupon.expiresAt && new Date() > coupon.expiresAt) throw new Error("Coupon has expired");
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new Error("Coupon usage limit reached");
  if (coupon.minOrderValue && orderAmount < Number(coupon.minOrderValue)) {
    throw new Error(`Minimum order value is ${coupon.minOrderValue}`);
  }

  const discount = coupon.discountType === "PERCENTAGE"
    ? (orderAmount * Number(coupon.discountValue)) / 100
    : Number(coupon.discountValue);

  return { coupon, discount, finalAmount: Math.max(0, orderAmount - discount) };
};

module.exports = { createCoupon, getAllCoupons, getCouponById, updateCoupon, deleteCoupon, validateCoupon };
