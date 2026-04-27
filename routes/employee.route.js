const express      = require("express");
const router       = express.Router();
const ctrl         = require("../controller/employee.controller");
const { authenticate, canManageEmployees } = require("../middleware/auth.middleware");
const superAdminSvc = require("../service/superAdmin.service");
const {
  validateCreateEmployee,
  validateUpdateEmployee,
  validateSalary,
} = require("../validators/employee.validator");

// ─── Public to authenticated users: get roles for dropdown ───────────────────
router.get("/roles", authenticate, async (req, res, next) => {
  try {
    const roles = await superAdminSvc.getAllRoles();
    return res.json({ success: true, data: roles });
  } catch (e) { next(e); }
});

// Change own password — any authenticated user
router.patch("/change-password/:id", authenticate, ctrl.changeOwnPassword);

router.use(authenticate, canManageEmployees);

// ─── Employee CRUD ────────────────────────────────────────────────────────────
router.post("/addemployee",           validateCreateEmployee, ctrl.createEmployee);
router.get("/",                       ctrl.getAllEmployees);
router.get("/:id",                    ctrl.getEmployeeById);
router.put("/:id",                    validateUpdateEmployee, ctrl.updateEmployee);
router.delete("/:id",                 ctrl.deleteEmployee);

// ─── Salary ───────────────────────────────────────────────────────────────────
router.post("/:employeeId/salary",    validateSalary, ctrl.addOrUpdateSalary);
router.put("/:employeeId/salary",     validateSalary, ctrl.addOrUpdateSalary);
router.get("/:employeeId/salary",     ctrl.getSalary);

module.exports = router;
