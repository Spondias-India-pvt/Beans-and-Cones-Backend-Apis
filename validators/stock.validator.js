// ─── Stock Validators ─────────────────────────────────────────────────────────

const STOCK_UNITS       = ["kg", "g", "litre", "ml", "piece", "pack"];
const DISPATCH_STATUSES = ["pending", "dispatched", "received", "rejected"];

const validateCreateCategory = (req, res, next) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: "Category name is required" });
  }
  next();
};

const validateCreateStockItem = (req, res, next) => {
  const { name, unit, reorderLevel, unitCost, categoryId } = req.body;
  if (!name || !name.trim())   return res.status(400).json({ success: false, message: "name is required" });
  if (!unit || !STOCK_UNITS.includes(unit)) {
    return res.status(400).json({ success: false, message: `unit must be one of: ${STOCK_UNITS.join(", ")}` });
  }
  if (reorderLevel === undefined || isNaN(Number(reorderLevel))) {
    return res.status(400).json({ success: false, message: "reorderLevel must be a valid number" });
  }
  if (unitCost === undefined || isNaN(Number(unitCost))) {
    return res.status(400).json({ success: false, message: "unitCost must be a valid number" });
  }
  if (!categoryId || isNaN(Number(categoryId))) {
    return res.status(400).json({ success: false, message: "categoryId must be a valid integer" });
  }
  next();
};

const validateCreateDispatch = (req, res, next) => {
  const { toBranchId, dispatchDate, items } = req.body;
  if (!toBranchId || isNaN(Number(toBranchId))) {
    return res.status(400).json({ success: false, message: "toBranchId must be a valid integer" });
  }
  if (!dispatchDate) return res.status(400).json({ success: false, message: "dispatchDate is required" });
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "items must be a non-empty array" });
  }
  for (const item of items) {
    if (!item.stockItemId || isNaN(Number(item.stockItemId))) {
      return res.status(400).json({ success: false, message: "Each item must have a valid stockItemId" });
    }
    if (!item.quantitySent || isNaN(Number(item.quantitySent))) {
      return res.status(400).json({ success: false, message: "Each item must have a valid quantitySent" });
    }
    if (!item.unitCost || isNaN(Number(item.unitCost))) {
      return res.status(400).json({ success: false, message: "Each item must have a valid unitCost" });
    }
  }
  next();
};

const validateUpdateDispatchStatus = (req, res, next) => {
  const { status } = req.body;
  const BRANCH_STATUSES = ["received", "rejected"];
  if (!status || !BRANCH_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: `status must be one of: ${BRANCH_STATUSES.join(", ")}` });
  }
  next();
};

module.exports = {
  validateCreateCategory,
  validateCreateStockItem,
  validateCreateDispatch,
  validateUpdateDispatchStatus,
};
