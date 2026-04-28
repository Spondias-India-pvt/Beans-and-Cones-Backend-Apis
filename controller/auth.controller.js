const authService        = require("../service/auth.service");
const { createAuditLog } = require("../utils/auditLog");

// POST /auth/login
const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    await createAuditLog({
      userId:      result.user.id,
      username:    result.user.username,
      action:      "LOGIN",
      module:      "AUTH",
      referenceId: result.user.id,
      details:     `${result.user.username} logged in`,
    });
    return res.status(200).json({ success: true, message: "Login successful", data: result });
  } catch (error) {
    next(error);
  }
};

// GET /auth/me
const getMe = (req, res) => {
  return res.status(200).json({ success: true, data: req.user });
};

// POST /auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "email is required" });
    const result = await authService.forgotPassword(email);
    return res.json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

// POST /auth/verify-otp
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: "email and otp are required" });
    const result = await authService.verifyOtp(email, otp);
    return res.json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

// POST /auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "email, otp and newPassword are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "newPassword must be at least 6 characters" });
    }
    const result = await authService.resetPassword(email, otp, newPassword);
    return res.json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, getMe, forgotPassword, verifyOtp, resetPassword };
