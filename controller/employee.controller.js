const svc            = require("../service/employee.service");
const { createAuditLog } = require("../utils/auditLog");

const toInt = (v) => Number(v);
const log   = (req, action, module, referenceId, details) =>
  createAuditLog({ userId: req.user.id, username: req.user.username, action, module, referenceId, details });

// ─── Employee ─────────────────────────────────────────────────────────────────
const getAllEmployees  = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getAllEmployees(req.user, req.query) }); } catch (e) { next(e); } };
const getEmployeeById = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getEmployeeById(toInt(req.params.id)) }); } catch (e) { next(e); } };
const getSalary       = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getSalary(toInt(req.params.employeeId)) }); } catch (e) { next(e); } };

const createEmployee = async (req, res, next) => {
  try {
    const emp = await svc.createEmployee(req.body, req.user);
    await log(req, "CREATE_EMPLOYEE", "EMPLOYEE", emp.id, `${req.user.username} created employee: ${emp.firstName} ${emp.lastName} (${emp.employeeCode})`);
    return res.status(201).json({ success: true, message: "Employee created", data: emp });
  } catch (e) { next(e); }
};

const updateEmployee = async (req, res, next) => {
  try {
    const emp = await svc.updateEmployee(toInt(req.params.id), req.body, req.user);
    await log(req, "UPDATE_EMPLOYEE", "EMPLOYEE", emp.id, `${req.user.username} updated employee: ${emp.firstName} ${emp.lastName}`);
    return res.json({ success: true, message: "Employee updated", data: emp });
  } catch (e) { next(e); }
};

const deleteEmployee = async (req, res, next) => {
  try {
    await svc.deleteEmployee(toInt(req.params.id), req.user);
    await log(req, "DELETE_EMPLOYEE", "EMPLOYEE", req.params.id, `${req.user.username} deactivated employee ID: ${req.params.id}`);
    return res.json({ success: true, message: "Employee deactivated" });
  } catch (e) { next(e); }
};

const addOrUpdateSalary = async (req, res, next) => {
  try {
    const salary = await svc.addOrUpdateSalary(toInt(req.params.employeeId), req.body);
    await log(req, "UPSERT_SALARY", "EMPLOYEE", req.params.employeeId, `${req.user.username} updated salary for employee ID: ${req.params.employeeId}`);
    return res.json({ success: true, message: "Salary saved", data: salary });
  } catch (e) { next(e); }
};

const changeOwnPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "currentPassword and newPassword are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "newPassword must be at least 6 characters" });
    }
    const result = await svc.changeOwnPassword(req.user.id, { currentPassword, newPassword });
    await log(req, "CHANGE_PASSWORD", "EMPLOYEE", req.user.id, `${req.user.username} changed their password`);
    return res.json({ success: true, message: result.message });
  } catch (e) { next(e); }
};

module.exports = {
  createEmployee, getAllEmployees, getEmployeeById,
  updateEmployee, deleteEmployee,
  addOrUpdateSalary, getSalary,
  changeOwnPassword,
};
