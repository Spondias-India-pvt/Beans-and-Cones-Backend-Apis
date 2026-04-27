const svc            = require("../service/branch.service");
const { createAuditLog } = require("../utils/auditLog");

const toInt = (v) => Number(v);
const log   = (req, action, module, referenceId, details) =>
  createAuditLog({ userId: req.user.id, username: req.user.username, action, module, referenceId, details });

// ─── Branch ───────────────────────────────────────────────────────────────────
const getAllBranches      = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getAllBranches() }); } catch (e) { next(e); } };
const getBranchById      = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getBranchById(toInt(req.params.id)) }); } catch (e) { next(e); } };
const getAllBranchAdmins  = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getAllBranchAdmins() }); } catch (e) { next(e); } };
const getBranchEmployeeById = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getBranchEmployeeById(toInt(req.params.id)) }); } catch (e) { next(e); } };
const getBranchEmployees = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getBranchEmployees(toInt(req.params.id), req.query) }); } catch (e) { next(e); } };
const getSalary          = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getSalary(toInt(req.params.id)) }); } catch (e) { next(e); } };

const createBranch = async (req, res, next) => {
  try {
    const branch = await svc.createBranch(req.body);
    await log(req, "CREATE_BRANCH", "BRANCH", branch.id, `${req.user.username} created branch: ${branch.branchName} (${branch.branchCode})`);
    return res.status(201).json({ success: true, message: "Branch created", data: branch });
  } catch (e) { next(e); }
};

const updateBranch = async (req, res, next) => {
  try {
    const branch = await svc.updateBranch(toInt(req.params.id), req.body);
    await log(req, "UPDATE_BRANCH", "BRANCH", branch.id, `${req.user.username} updated branch: ${branch.branchName}`);
    return res.json({ success: true, message: "Branch updated", data: branch });
  } catch (e) { next(e); }
};

const deleteBranch = async (req, res, next) => {
  try {
    await svc.deleteBranch(toInt(req.params.id));
    await log(req, "DELETE_BRANCH", "BRANCH", req.params.id, `${req.user.username} deleted branch ID: ${req.params.id}`);
    return res.json({ success: true, message: "Branch deleted" });
  } catch (e) { next(e); }
};

const createBranchAdmin = async (req, res, next) => {
  try {
    const admin = await svc.createBranchAdmin(req.body);
    await log(req, "CREATE_BRANCH_ADMIN", "BRANCH", admin.id, `${req.user.username} created branch admin: ${admin.firstName} ${admin.lastName} (${admin.employeeCode}) for branch ${admin.branch?.branchName}`);
    return res.status(201).json({ success: true, message: "Branch admin created", data: admin });
  } catch (e) { next(e); }
};

const updateBranchEmployee = async (req, res, next) => {
  try {
    const emp = await svc.updateBranchEmployee(toInt(req.params.id), req.body);
    await log(req, "UPDATE_BRANCH_EMPLOYEE", "BRANCH", emp.id, `${req.user.username} updated employee: ${emp.firstName} ${emp.lastName} (${emp.employeeCode})`);
    return res.json({ success: true, message: "Updated successfully", data: emp });
  } catch (e) { next(e); }
};

const resetBranchEmployeePassword = async (req, res, next) => {
  try {
    const result = await svc.resetBranchEmployeePassword(toInt(req.params.id), req.body.newPassword);
    await log(req, "RESET_PASSWORD", "BRANCH", req.params.id, `${req.user.username} reset password for employee ID: ${req.params.id}`);
    return res.json({ success: true, message: result.message });
  } catch (e) { next(e); }
};

const addOrUpdateSalary = async (req, res, next) => {
  try {
    const salary = await svc.addOrUpdateSalary(toInt(req.params.id), req.body);
    await log(req, "UPSERT_SALARY", "BRANCH", req.params.id, `${req.user.username} updated salary for employee ID: ${req.params.id}`);
    return res.json({ success: true, message: "Salary saved", data: salary });
  } catch (e) { next(e); }
};

module.exports = {
  createBranch, getAllBranches, getBranchById, updateBranch, deleteBranch,
  createBranchAdmin, getAllBranchAdmins,
  getBranchEmployeeById, getBranchEmployees, updateBranchEmployee, resetBranchEmployeePassword,
  addOrUpdateSalary, getSalary,
};
