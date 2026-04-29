const svc            = require("../service/superAdmin.service");
const { createAuditLog } = require("../utils/auditLog");

const toInt = (v) => Number(v);
const log   = (req, action, module, referenceId, details) =>
  createAuditLog({ userId: req.user.id, username: req.user.username, action, module, referenceId, details });

// ─── Bootstrap ────────────────────────────────────────────────────────────────
const bootstrapSuperAdmin = async (req, res, next) => {
  try {
    return res.json({ success: true, data: await svc.bootstrapSuperAdmin() });
  } catch (e) { next(e); }
};

// ─── Profile ──────────────────────────────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    return res.json({ success: true, data: await svc.getSuperAdminProfile(req.user.id) });
  } catch (e) { next(e); }
};

const updateProfile = async (req, res, next) => {
  try {
    const data = await svc.updateSuperAdminProfile(req.user.id, req.body);
    await log(req, "UPDATE_PROFILE", "SUPER_ADMIN", req.user.id, `${req.user.username} updated their profile`);
    return res.json({ success: true, message: "Profile updated", data });
  } catch (e) { next(e); }
};

const changePassword = async (req, res, next) => {
  try {
    const result = await svc.changePassword(req.user.id, req.body);
    await log(req, "CHANGE_PASSWORD", "SUPER_ADMIN", req.user.id, `${req.user.username} changed their password`);
    return res.json({ success: true, message: result.message });
  } catch (e) { next(e); }
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const getDashboardStats = async (req, res, next) => {
  try {
    return res.json({ success: true, data: await svc.getDashboardStats() });
  } catch (e) { next(e); }
};

// ─── Roles ────────────────────────────────────────────────────────────────────
const seedRoles  = async (req, res, next) => { try { return res.json({ success: true, data: await svc.seedRoles() }); } catch (e) { next(e); } };
const getAllRoles = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getAllRoles() }); } catch (e) { next(e); } };
const getRoleById = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getRoleById(toInt(req.params.id)) }); } catch (e) { next(e); } };

const createRole = async (req, res, next) => {
  try {
    const role = await svc.createRole(req.body);
    await log(req, "CREATE_ROLE", "ROLE", role.id, `${req.user.username} created role: ${role.name}`);
    return res.status(201).json({ success: true, message: "Role created", data: role });
  } catch (e) { next(e); }
};

const updateRole = async (req, res, next) => {
  try {
    const role = await svc.updateRole(toInt(req.params.id), req.body);
    await log(req, "UPDATE_ROLE", "ROLE", role.id, `${req.user.username} updated role: ${role.name}`);
    return res.json({ success: true, message: "Role updated", data: role });
  } catch (e) { next(e); }
};

const deleteRole = async (req, res, next) => {
  try {
    await svc.deleteRole(toInt(req.params.id));
    await log(req, "DELETE_ROLE", "ROLE", req.params.id, `${req.user.username} deleted role ID: ${req.params.id}`);
    return res.json({ success: true, message: "Role deleted" });
  } catch (e) { next(e); }
};

// ─── Staff ────────────────────────────────────────────────────────────────────
const getAllStaff  = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getAllStaff() }); } catch (e) { next(e); } };
const getStaffById = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getStaffById(toInt(req.params.id)) }); } catch (e) { next(e); } };
const getAllUsers   = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getAllUsers(req.query) }); } catch (e) { next(e); } };

const createStaff = async (req, res, next) => {
  try {
    const staff = await svc.createStaff(req.user.id, req.body);
    await log(req, "CREATE_STAFF", "SUPER_ADMIN", staff.id, `${req.user.username} created staff: ${staff.firstName} ${staff.lastName} (${staff.staffCode})`);
    return res.status(201).json({ success: true, message: "Staff created", data: staff });
  } catch (e) { next(e); }
};

const updateStaff = async (req, res, next) => {
  try {
    const staff = await svc.updateStaff(toInt(req.params.id), req.body);
    await log(req, "UPDATE_STAFF", "SUPER_ADMIN", staff.id, `${req.user.username} updated staff: ${staff.firstName} ${staff.lastName}`);
    return res.json({ success: true, message: "Staff updated", data: staff });
  } catch (e) { next(e); }
};

const resetStaffPassword = async (req, res, next) => {
  try {
    const result = await svc.resetStaffPassword(toInt(req.params.id), req.body.newPassword);
    await log(req, "RESET_STAFF_PASSWORD", "SUPER_ADMIN", req.params.id, `${req.user.username} reset password for staff ID: ${req.params.id}`);
    return res.json({ success: true, message: result.message });
  } catch (e) { next(e); }
};

// ─── Branch access ────────────────────────────────────────────────────────────
const grantBranchAccess = async (req, res, next) => {
  try {
    const access = await svc.grantBranchAccess(toInt(req.params.staffId), toInt(req.body.branchId));
    await log(req, "GRANT_BRANCH_ACCESS", "SUPER_ADMIN", req.params.staffId, `${req.user.username} granted branch ${req.body.branchId} access to staff ${req.params.staffId}`);
    return res.json({ success: true, message: "Branch access granted", data: access });
  } catch (e) { next(e); }
};

const revokeBranchAccess = async (req, res, next) => {
  try {
    await svc.revokeBranchAccess(toInt(req.params.staffId), toInt(req.params.branchId));
    await log(req, "REVOKE_BRANCH_ACCESS", "SUPER_ADMIN", req.params.staffId, `${req.user.username} revoked branch ${req.params.branchId} access from staff ${req.params.staffId}`);
    return res.json({ success: true, message: "Branch access revoked" });
  } catch (e) { next(e); }
};

module.exports = {
  bootstrapSuperAdmin, getProfile, updateProfile, changePassword, getDashboardStats,
  seedRoles, getAllRoles, getRoleById, createRole, updateRole, deleteRole,
  getAllStaff, getStaffById, createStaff, updateStaff, resetStaffPassword,
  grantBranchAccess, revokeBranchAccess,
  getAllUsers,
};
