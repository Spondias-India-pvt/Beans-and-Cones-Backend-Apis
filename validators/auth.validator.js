// ─── Auth Validators ──────────────────────────────────────────────────────────

const validateLogin = (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !username.trim()) {
    return res.status(400).json({ success: false, message: "username is required" });
  }
  if (!password || !password.trim()) {
    return res.status(400).json({ success: false, message: "password is required" });
  }
  next();
};

module.exports = { validateLogin };
