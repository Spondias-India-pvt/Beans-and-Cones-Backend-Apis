const svc            = require("../service/branchSettings.service");
const { createAuditLog } = require("../utils/auditLog");

const toInt = (v) => Number(v);

const getSettings = async (req, res, next) => {
  try {
    return res.json({ success: true, data: await svc.getSettings(toInt(req.params.branchId)) });
  } catch (e) { next(e); }
};

const createOrUpdateSettings = async (req, res, next) => {
  try {
    const data = await svc.createOrUpdateSettings(toInt(req.params.branchId), req.body);
    await createAuditLog({
      userId:      req.user.id,
      username:    req.user.username,
      action:      "UPSERT_BRANCH_SETTINGS",
      module:      "BRANCH_SETTINGS",
      referenceId: req.params.branchId,
      details:     `${req.user.username} updated settings for branch ID: ${req.params.branchId}`,
    });
    return res.json({ success: true, message: "Branch settings saved", data });
  } catch (e) { next(e); }
};

module.exports = { getSettings, createOrUpdateSettings };
