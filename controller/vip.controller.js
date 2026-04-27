const svc            = require("../service/vip.service");
const { createAuditLog } = require("../utils/auditLog");

const toInt = (v) => Number(v);
const log   = (req, action, module, referenceId, details) =>
  createAuditLog({ userId: req.user.id, username: req.user.username, action, module, referenceId, details });

const getAllVipPlans  = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getAllVipPlans() }); } catch (e) { next(e); } };
const getVipPlanById = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getVipPlanById(toInt(req.params.id)) }); } catch (e) { next(e); } };

const createVipPlan = async (req, res, next) => {
  try {
    const plan = await svc.createVipPlan(req.body);
    await log(req, "CREATE_VIP_PLAN", "VIP", plan.id, `${req.user.username} created VIP plan: ${plan.name}`);
    return res.status(201).json({ success: true, message: "VIP plan created", data: plan });
  } catch (e) { next(e); }
};

const updateVipPlan = async (req, res, next) => {
  try {
    const plan = await svc.updateVipPlan(toInt(req.params.id), req.body);
    await log(req, "UPDATE_VIP_PLAN", "VIP", plan.id, `${req.user.username} updated VIP plan: ${plan.name}`);
    return res.json({ success: true, message: "VIP plan updated", data: plan });
  } catch (e) { next(e); }
};

const deleteVipPlan = async (req, res, next) => {
  try {
    await svc.deleteVipPlan(toInt(req.params.id));
    return res.json({ success: true, message: "VIP plan deactivated" });
  } catch (e) { next(e); }
};

module.exports = { createVipPlan, getAllVipPlans, getVipPlanById, updateVipPlan, deleteVipPlan };
