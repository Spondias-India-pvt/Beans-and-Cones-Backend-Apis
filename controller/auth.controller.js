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
  } catch (error) { next(error); }
};

// Validate token — frontend calls this when user clicks the reset link
const validateResetToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: "token is required" });
    const result = await authService.validateResetToken(token);
    return res.json({ success: true, message: result.message, email: result.email });
  } catch (error) { next(error); }
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
    const result = await authService.resetPassword(token, newPassword);
    return res.json({ success: true, message: result.message });
  } catch (error) { next(error); }
};

module.exports = { login, getMe, forgotPassword, validateResetToken, resetPassword };
