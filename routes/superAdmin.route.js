const express      = require("express");
const router       = express.Router();
const ctrl         = require("../controller/superAdmin.controller");
const { authenticate, isSuperAdmin } = require("../middleware/auth.middleware");
const {
  validateChangePassword,
  validateCreateRole,
  validateCreateStaff,
  validateResetPassword,
  validateGrantBranchAccess,
} = require("../validators/superAdmin.validator");

// All routes require super admin auth
router.use(authenticate, isSuperAdmin);

// ─── Profile ──────────────────────────────────────────────────────────────────
router.get("/profile",                        ctrl.getProfile);
router.put("/profile",                        ctrl.updateProfile);
router.patch("/change-password",              validateChangePassword, ctrl.changePassword);

// ─── Dashboard ────────────────────────────────────────────────────────────────
router.get("/dashboard",                      ctrl.getDashboardStats);

// ─── All users (staff + branch employees) ────────────────────────────────────
router.get("/users",                          ctrl.getAllUsers);

// ─── Roles ────────────────────────────────────────────────────────────────────
router.post("/roles/seed",                    ctrl.seedRoles);
router.post("/roles",                         validateCreateRole, ctrl.createRole);
router.get("/roles",                          ctrl.getAllRoles);
router.get("/roles/:id",                      ctrl.getRoleById);
router.put("/roles/:id",                      ctrl.updateRole);
router.delete("/roles/:id",                   ctrl.deleteRole);

// ─── Super admin staff ────────────────────────────────────────────────────────
router.post("/staff",                         validateCreateStaff, ctrl.createStaff);
router.get("/staff",                          ctrl.getAllStaff);
router.get("/staff/:id",                      ctrl.getStaffById);
router.put("/staff/:id",                      ctrl.updateStaff);
router.patch("/staff/:id/reset-password",     validateResetPassword, ctrl.resetStaffPassword);

// ─── Branch access for staff ──────────────────────────────────────────────────
router.post("/staff/:staffId/branch-access",             validateGrantBranchAccess, ctrl.grantBranchAccess);
router.delete("/staff/:staffId/branch-access/:branchId", ctrl.revokeBranchAccess);

module.exports = router;
