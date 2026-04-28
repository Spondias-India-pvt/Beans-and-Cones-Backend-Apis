const svc = require("../service/customer.service");
const jwt = require("jsonwebtoken");

const toInt = (v) => Number(v);

// ─── Auth ─────────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const customer = await svc.register(req.body);
    return res.status(201).json({ success: true, message: "Registration successful", data: customer });
  } catch (e) { next(e); }
};

const login = async (req, res, next) => {
  try {
    const result = await svc.login(req.body);
    return res.json({ success: true, message: "Login successful", data: result });
  } catch (e) { next(e); }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { identifier } = req.body; // phone or email
    if (!identifier) return res.status(400).json({ success: false, message: "phone or email is required" });
    const result = await svc.forgotPassword(identifier);
    return res.json({ success: true, message: result.message });
  } catch (e) { next(e); }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { identifier, otp } = req.body;
    if (!identifier || !otp) return res.status(400).json({ success: false, message: "identifier and otp are required" });
    const result = await svc.verifyOtp(identifier, otp);
    return res.json({ success: true, message: result.message });
  } catch (e) { next(e); }
};

const resetPassword = async (req, res, next) => {
  try {
    const { identifier, otp, newPassword } = req.body;
    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "identifier, otp and newPassword are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "newPassword must be at least 6 characters" });
    }
    const result = await svc.resetPassword(identifier, otp, newPassword);
    return res.json({ success: true, message: result.message });
  } catch (e) { next(e); }
};

// ─── Profile ──────────────────────────────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    return res.json({ success: true, data: await svc.getProfile(req.customer.id) });
  } catch (e) { next(e); }
};

const updateProfile = async (req, res, next) => {
  try {
    const data = await svc.updateProfile(req.customer.id, req.body);
    return res.json({ success: true, message: "Profile updated", data });
  } catch (e) { next(e); }
};

// ─── Addresses ────────────────────────────────────────────────────────────────
const getAddresses = async (req, res, next) => {
  try { return res.json({ success: true, data: await svc.getAddresses(req.customer.id) }); } catch (e) { next(e); }
};

const addAddress = async (req, res, next) => {
  try {
    const addr = await svc.addAddress(req.customer.id, req.body);
    return res.status(201).json({ success: true, message: "Address added", data: addr });
  } catch (e) { next(e); }
};

const deleteAddress = async (req, res, next) => {
  try {
    await svc.deleteAddress(req.customer.id, toInt(req.params.id));
    return res.json({ success: true, message: "Address deleted" });
  } catch (e) { next(e); }
};

module.exports = { register, login, forgotPassword, verifyOtp, resetPassword, getProfile, updateProfile, getAddresses, addAddress, deleteAddress };
