// ─── Super Admin Validators ───────────────────────────────────────────────────

const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT"];

const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "currentPassword and newPassword are required" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: "newPassword must be at least 6 characters" });
  }
  if (currentPassword === newPassword) {
    return res.status(400).json({ success: false, message: "New password must be different from current password" });
  }
  next();
};

const validateCreateRole = (req, res, next) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: "Role name is required" });
  }
  next();
};

const validateCreateStaff = (req, res, next) => {
  const { firstName, lastName, email, hireDate, employmentType, roleId, username, password } = req.body;
  if (!firstName || !firstName.trim())   return res.status(400).json({ success: false, message: "firstName is required" });
  if (!lastName  || !lastName.trim())    return res.status(400).json({ success: false, message: "lastName is required" });
  if (!email     || !email.trim())       return res.status(400).json({ success: false, message: "email is required" });
  if (!hireDate)                         return res.status(400).json({ success: false, message: "hireDate is required" });
  if (!employmentType || !EMPLOYMENT_TYPES.includes(employmentType)) {
    return res.status(400).json({ success: false, message: `employmentType must be one of: ${EMPLOYMENT_TYPES.join(", ")}` });
  }
  if (!roleId || isNaN(Number(roleId)))  return res.status(400).json({ success: false, message: "roleId must be a valid integer" });
  if (!username || !username.trim())     return res.status(400).json({ success: false, message: "username is required" });
  if (!password || password.length < 6) return res.status(400).json({ success: false, message: "password must be at least 6 characters" });
  next();
};

const validateResetPassword = (req, res, next) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: "newPassword must be at least 6 characters" });
  }
  next();
};

const validateGrantBranchAccess = (req, res, next) => {
  const { branchId } = req.body;
  if (!branchId || isNaN(Number(branchId))) {
    return res.status(400).json({ success: false, message: "branchId must be a valid integer" });
  }
  next();
};

module.exports = {
  validateChangePassword,
  validateCreateRole,
  validateCreateStaff,
  validateResetPassword,
  validateGrantBranchAccess,
};
