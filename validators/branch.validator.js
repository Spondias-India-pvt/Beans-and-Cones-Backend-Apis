// ─── Branch Validators ────────────────────────────────────────────────────────

const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT"];
const SALARY_TYPES     = ["HOURLY", "WEEKLY", "MONTHLY"];

const validateCreateBranch = (req, res, next) => {
  const { branchName, city } = req.body;
  if (!branchName || !branchName.trim()) return res.status(400).json({ success: false, message: "branchName is required" });
  if (!city       || !city.trim())       return res.status(400).json({ success: false, message: "city is required" });
  next();
};

const validateCreateBranchAdmin = (req, res, next) => {
  const { firstName, lastName, email, hireDate, employmentType, branchId, username, password } = req.body;
  if (!firstName || !firstName.trim())   return res.status(400).json({ success: false, message: "firstName is required" });
  if (!lastName  || !lastName.trim())    return res.status(400).json({ success: false, message: "lastName is required" });
  if (!email     || !email.trim())       return res.status(400).json({ success: false, message: "email is required" });
  if (!hireDate)                         return res.status(400).json({ success: false, message: "hireDate is required" });
  if (!employmentType || !EMPLOYMENT_TYPES.includes(employmentType)) {
    return res.status(400).json({ success: false, message: `employmentType must be one of: ${EMPLOYMENT_TYPES.join(", ")}` });
  }
  if (!branchId || isNaN(Number(branchId))) return res.status(400).json({ success: false, message: "branchId must be a valid integer" });
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

const validateSalary = (req, res, next) => {
  const { salaryType, baseSalary, effectiveFrom } = req.body;
  if (!salaryType || !SALARY_TYPES.includes(salaryType)) {
    return res.status(400).json({ success: false, message: `salaryType must be one of: ${SALARY_TYPES.join(", ")}` });
  }
  if (baseSalary === undefined || isNaN(Number(baseSalary))) {
    return res.status(400).json({ success: false, message: "baseSalary must be a valid number" });
  }
  if (!effectiveFrom) return res.status(400).json({ success: false, message: "effectiveFrom is required" });
  next();
};

module.exports = {
  validateCreateBranch,
  validateCreateBranchAdmin,
  validateResetPassword,
  validateSalary,
};
