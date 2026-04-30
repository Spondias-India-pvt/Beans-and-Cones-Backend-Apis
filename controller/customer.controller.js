const svc   = require("../service/customer.service");
const https = require("https");

const toInt = (v) => Number(v);

// ─── Verify Google reCAPTCHA token ────────────────────────────────────────────
const verifyCaptcha = (token) => {
  return new Promise((resolve) => {
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    const url    = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`;

    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.success === true);
        } catch {
          resolve(false);
        }
      });
    }).on("error", () => resolve(false));
  });
};

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

// ─── Forgot Password — token link flow ───────────────────────────────────────

const forgotPassword = async (req, res, next) => {
  try {
    const { identifier, captchaToken } = req.body;
    if (!identifier) return res.status(400).json({ success: false, message: "phone or email is required" });

    // Verify reCAPTCHA (skip in dev mode)
    if (process.env.SKIP_CAPTCHA !== "true") {
      if (!captchaToken) return res.status(400).json({ success: false, message: "Please complete the CAPTCHA" });
      const captchaOk = await verifyCaptcha(captchaToken);
      if (!captchaOk) return res.status(400).json({ success: false, message: "CAPTCHA verification failed. Please try again." });
    }

    const result = await svc.forgotPassword(identifier);
    return res.json({ success: true, message: result.message });
  } catch (e) { next(e); }
};

const validateResetToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: "token is required" });
    const result = await svc.validateResetToken(token);
    return res.json({ success: true, message: result.message });
  } catch (e) { next(e); }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: "token and newPassword are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "newPassword must be at least 6 characters" });
    }
    const result = await svc.resetPassword(token, newPassword);
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

module.exports = {
  register, login,
  forgotPassword, validateResetToken, resetPassword,
  getProfile, updateProfile,
  getAddresses, addAddress, deleteAddress,
};
