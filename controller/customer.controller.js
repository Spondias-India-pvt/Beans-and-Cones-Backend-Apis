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

module.exports = { register, login, getProfile, updateProfile, getAddresses, addAddress, deleteAddress };
