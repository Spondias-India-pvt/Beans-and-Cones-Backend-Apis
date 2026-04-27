const svc = require("../service/loyalty.service");

const getWallet = async (req, res, next) => {
  try {
    const customerId = req.params.customerId;
    return res.json({ success: true, data: await svc.getWallet(customerId) });
  } catch (e) { next(e); }
};

const getTransactionHistory = async (req, res, next) => {
  try {
    return res.json({ success: true, data: await svc.getTransactionHistory(req.params.customerId) });
  } catch (e) { next(e); }
};

const addPoints = async (req, res, next) => {
  try {
    await svc.addPoints(req.params.customerId, Number(req.body.points));
    return res.json({ success: true, message: "Points added" });
  } catch (e) { next(e); }
};

const calculateRedeem = async (req, res, next) => {
  try {
    const result = await svc.redeemPoints(req.params.customerId, Number(req.body.points));
    return res.json({ success: true, data: result });
  } catch (e) { next(e); }
};

module.exports = { getWallet, getTransactionHistory, addPoints, calculateRedeem };
