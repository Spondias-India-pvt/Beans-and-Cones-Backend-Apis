const svc            = require("../service/coupon.service");
const { createAuditLog } = require("../utils/auditLog");

const toInt = (v) => Number(v);
const log   = (req, action, module, referenceId, details) =>
  createAuditLog({ userId: req.user.id, username: req.user.username, action, module, referenceId, details });

const getAllCoupons   = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getAllCoupons(req.query) }); } catch (e) { next(e); } };
const getCouponById  = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getCouponById(toInt(req.params.id)) }); } catch (e) { next(e); } };

const validateCoupon = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;
    const result = await svc.validateCoupon(code, Number(orderAmount));
    return res.json({ success: true, data: result });
  } catch (e) { next(e); }
};

const createCoupon = async (req, res, next) => {
  try {
    const coupon = await svc.createCoupon(req.body);
    await log(req, "CREATE_COUPON", "COUPON", coupon.id, `${req.user.username} created coupon: ${coupon.code}`);
    return res.status(201).json({ success: true, message: "Coupon created", data: coupon });
  } catch (e) { next(e); }
};

const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await svc.updateCoupon(toInt(req.params.id), req.body);
    await log(req, "UPDATE_COUPON", "COUPON", coupon.id, `${req.user.username} updated coupon: ${coupon.code}`);
    return res.json({ success: true, message: "Coupon updated", data: coupon });
  } catch (e) { next(e); }
};

const deleteCoupon = async (req, res, next) => {
  try {
    await svc.deleteCoupon(toInt(req.params.id));
    await log(req, "DELETE_COUPON", "COUPON", req.params.id, `${req.user.username} deactivated coupon ID: ${req.params.id}`);
    return res.json({ success: true, message: "Coupon deactivated" });
  } catch (e) { next(e); }
};

module.exports = { createCoupon, getAllCoupons, getCouponById, updateCoupon, deleteCoupon, validateCoupon };
