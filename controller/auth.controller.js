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

module.exports = { login, getMe };
