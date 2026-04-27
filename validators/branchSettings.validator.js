// ─── Branch Settings Validators ───────────────────────────────────────────────

const validateBranchSettings = (req, res, next) => {
  const { taxPercentage, serviceCharge, minOrderAmount } = req.body;
  if (taxPercentage  !== undefined && isNaN(Number(taxPercentage))) {
    return res.status(400).json({ success: false, message: "taxPercentage must be a valid number" });
  }
  if (serviceCharge  !== undefined && isNaN(Number(serviceCharge))) {
    return res.status(400).json({ success: false, message: "serviceCharge must be a valid number" });
  }
  if (minOrderAmount !== undefined && isNaN(Number(minOrderAmount))) {
    return res.status(400).json({ success: false, message: "minOrderAmount must be a valid number" });
  }
  next();
};

module.exports = { validateBranchSettings };
