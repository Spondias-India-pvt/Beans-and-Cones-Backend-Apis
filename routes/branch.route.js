const express      = require("express");
const router       = express.Router();
const ctrl         = require("../controller/branch.controller");
const { authenticate, isSuperAdmin } = require("../middleware/auth.middleware");
const {
  validateCreateBranch,
  validateCreateBranchAdmin,
  validateResetPassword,
  validateSalary,
} = require("../validators/branch.validator");

router.use(authenticate, isSuperAdmin);

// ─── Static routes MUST come before /:id to avoid conflicts ──────────────────

// Branch admins
router.post("/admins",                        validateCreateBranchAdmin, ctrl.createBranchAdmin);
router.get("/admins",                         ctrl.getAllBranchAdmins);

// Branch employees (static prefix)
router.get("/employees/:id",                  ctrl.getBranchEmployeeById);
router.put("/employees/:id",                  ctrl.updateBranchEmployee);
router.patch("/employees/:id/reset-password", validateResetPassword, ctrl.resetBranchEmployeePassword);
router.post("/employees/:id/salary",          validateSalary, ctrl.addOrUpdateSalary);
router.put("/employees/:id/salary",           validateSalary, ctrl.addOrUpdateSalary);
router.get("/employees/:id/salary",           ctrl.getSalary);

// ─── Branch CRUD (/:id must come after all static routes) ────────────────────
router.post("/addbranch",                     validateCreateBranch, ctrl.createBranch);
router.get("/",                               ctrl.getAllBranches);
router.get("/:id",                            ctrl.getBranchById);
router.put("/:id",                            ctrl.updateBranch);
router.delete("/:id",                         ctrl.deleteBranch);

// Branch employees list (/:id/employees after /:id)
router.get("/:id/employees",                  ctrl.getBranchEmployees);

module.exports = router;
