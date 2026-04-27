// ─── Employee Validators ──────────────────────────────────────────────────────

const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT"];
const SALARY_TYPES     = ["HOURLY", "WEEKLY", "MONTHLY"];

const validateCreateEmployee = (req, res, next) => {
  const { firstName, lastName, hireDate, employmentType, branchId, roleId } = req.body;
  if (!firstName || !firstName.trim())   return res.status(400).json({ success: false, message: "firstName is required" });
  if (!lastName  || !lastName.trim())    return res.status(400).json({ success: false, message: "lastName is required" });
  if (!hireDate)                         return res.status(400).json({ success: false, message: "hireDate is required" });
  if (!employmentType || !EMPLOYMENT_TYPES.includes(employmentType)) {
    return res.status(400).json({ success: false, message: `employmentType must be one of: ${EMPLOYMENT_TYPES.join(", ")}` });
  }
  if (!branchId || isNaN(Number(branchId))) return res.status(400).json({ success: false, message: "branchId must be a valid integer" });
  if (!roleId   || isNaN(Number(roleId)))   return res.status(400).json({ success: false, message: "roleId must be a valid integer" });
  next();
};

const validateUpdateEmployee = (req, res, next) => {
  const { employmentType, roleId, branchId } = req.body;
  if (employmentType && !EMPLOYMENT_TYPES.includes(employmentType)) {
    return res.status(400).json({ success: false, message: `employmentType must be one of: ${EMPLOYMENT_TYPES.join(", ")}` });
  }
  if (roleId   !== undefined && isNaN(Number(roleId)))   return res.status(400).json({ success: false, message: "roleId must be a valid integer" });
  if (branchId !== undefined && isNaN(Number(branchId))) return res.status(400).json({ success: false, message: "branchId must be a valid integer" });
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

module.exports = { validateCreateEmployee, validateUpdateEmployee, validateSalary };
