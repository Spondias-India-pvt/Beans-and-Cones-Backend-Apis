const svc            = require("../service/stock.service");
const { createAuditLog } = require("../utils/auditLog");

const toInt = (v) => Number(v);
const log   = (req, action, module, referenceId, details) =>
  createAuditLog({ userId: req.user.id, username: req.user.username, action, module, referenceId, details });

// ─── Warehouse ────────────────────────────────────────────────────────────────
const getAllWarehouses  = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getAllWarehouses() }); } catch (e) { next(e); } };
const getWarehouseById = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getWarehouseById(toInt(req.params.id)) }); } catch (e) { next(e); } };

const createWarehouse = async (req, res, next) => {
  try {
    const wh = await svc.createWarehouse(req.body);
    await log(req, "CREATE_WAREHOUSE", "WAREHOUSE", wh.id, `${req.user.username} created warehouse: ${wh.name} (${wh.code})`);
    return res.status(201).json({ success: true, message: "Warehouse created", data: wh });
  } catch (e) { next(e); }
};

const updateWarehouse = async (req, res, next) => {
  try {
    const wh = await svc.updateWarehouse(toInt(req.params.id), req.body);
    await log(req, "UPDATE_WAREHOUSE", "WAREHOUSE", wh.id, `${req.user.username} updated warehouse: ${wh.name}`);
    return res.json({ success: true, message: "Warehouse updated", data: wh });
  } catch (e) { next(e); }
};

const deleteWarehouse = async (req, res, next) => {
  try {
    await svc.deleteWarehouse(toInt(req.params.id));
    await log(req, "DELETE_WAREHOUSE", "WAREHOUSE", req.params.id, `${req.user.username} deactivated warehouse ID: ${req.params.id}`);
    return res.json({ success: true, message: "Warehouse deactivated" });
  } catch (e) { next(e); }
};

// ─── Warehouse Inventory ──────────────────────────────────────────────────────
const getWarehouseInventory = async (req, res, next) => {
  try {
    return res.json({ success: true, data: await svc.getWarehouseInventory(toInt(req.params.id)) });
  } catch (e) { next(e); }
};

const addOrUpdateWarehouseInventory = async (req, res, next) => {
  try {
    const { stockItemId, quantity } = req.body;
    const inv = await svc.addOrUpdateWarehouseInventory(toInt(req.params.id), toInt(stockItemId), quantity);
    await log(req, "UPDATE_WAREHOUSE_INVENTORY", "WAREHOUSE", req.params.id, `${req.user.username} updated inventory for warehouse ID: ${req.params.id}`);
    return res.json({ success: true, message: "Inventory updated", data: inv });
  } catch (e) { next(e); }
};

// ─── Branch Inventory ─────────────────────────────────────────────────────────
const getBranchInventory = async (req, res, next) => {
  try {
    return res.json({ success: true, data: await svc.getBranchInventory(toInt(req.params.branchId)) });
  } catch (e) { next(e); }
};

// ─── Categories ───────────────────────────────────────────────────────────────
const getAllCategories  = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getAllCategories() }); } catch (e) { next(e); } };
const getCategoryById  = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getCategoryById(toInt(req.params.id)) }); } catch (e) { next(e); } };
const getAllStockItems  = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getAllStockItems(req.query) }); } catch (e) { next(e); } };
const getStockItemById = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getStockItemById(toInt(req.params.id)) }); } catch (e) { next(e); } };
const getAllDispatches  = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getAllDispatches(req.query) }); } catch (e) { next(e); } };
const getDispatchById  = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getDispatchById(toInt(req.params.id)) }); } catch (e) { next(e); } };

const createCategory = async (req, res, next) => {
  try {
    const cat = await svc.createCategory(req.body);
    await log(req, "CREATE_CATEGORY", "STOCK", cat.id, `${req.user.username} created category: ${cat.name}`);
    return res.status(201).json({ success: true, message: "Category created", data: cat });
  } catch (e) { next(e); }
};

const updateCategory = async (req, res, next) => {
  try {
    const cat = await svc.updateCategory(toInt(req.params.id), req.body);
    await log(req, "UPDATE_CATEGORY", "STOCK", cat.id, `${req.user.username} updated category: ${cat.name}`);
    return res.json({ success: true, message: "Category updated", data: cat });
  } catch (e) { next(e); }
};

const deleteCategory = async (req, res, next) => {
  try {
    await svc.deleteCategory(toInt(req.params.id));
    await log(req, "DELETE_CATEGORY", "STOCK", req.params.id, `${req.user.username} deactivated category ID: ${req.params.id}`);
    return res.json({ success: true, message: "Category deactivated" });
  } catch (e) { next(e); }
};

const createStockItem = async (req, res, next) => {
  try {
    const item = await svc.createStockItem(req.body, req.user.id);
    await log(req, "CREATE_STOCK_ITEM", "STOCK", item.id, `${req.user.username} created stock item: ${item.name} (${item.sku})`);
    return res.status(201).json({ success: true, message: "Stock item created", data: item });
  } catch (e) { next(e); }
};

const updateStockItem = async (req, res, next) => {
  try {
    const item = await svc.updateStockItem(toInt(req.params.id), req.body);
    await log(req, "UPDATE_STOCK_ITEM", "STOCK", item.id, `${req.user.username} updated stock item: ${item.name}`);
    return res.json({ success: true, message: "Stock item updated", data: item });
  } catch (e) { next(e); }
};

const deleteStockItem = async (req, res, next) => {
  try {
    await svc.deleteStockItem(toInt(req.params.id));
    await log(req, "DELETE_STOCK_ITEM", "STOCK", req.params.id, `${req.user.username} deactivated stock item ID: ${req.params.id}`);
    return res.json({ success: true, message: "Stock item deactivated" });
  } catch (e) { next(e); }
};

const createDispatch = async (req, res, next) => {
  try {
    const dispatch = await svc.createDispatch(req.body, req.user.id);
    await log(req, "CREATE_DISPATCH", "STOCK", dispatch.id, `${req.user.username} created dispatch: ${dispatch.dispatchNumber} to branch ${dispatch.toBranch?.branchName}`);
    return res.status(201).json({ success: true, message: "Dispatch created", data: dispatch });
  } catch (e) { next(e); }
};

const updateDispatchStatus = async (req, res, next) => {
  try {
    const dispatch = await svc.updateDispatchStatus(toInt(req.params.id), req.body);
    await log(req, "UPDATE_DISPATCH_STATUS", "STOCK", dispatch.id, `${req.user.username} updated dispatch ${dispatch.dispatchNumber} status to: ${dispatch.status}`);
    return res.json({ success: true, message: "Dispatch status updated", data: dispatch });
  } catch (e) { next(e); }
};

// PATCH /dispatches/:id/dispatch — super admin marks as dispatched
const markAsDispatched = async (req, res, next) => {
  try {
    const dispatch = await svc.markAsDispatched(toInt(req.params.id), req.user.id);
    await log(req, "MARK_DISPATCHED", "STOCK", dispatch.id, `${req.user.username} dispatched: ${dispatch.dispatchNumber} to branch ${dispatch.toBranch?.branchName}`);
    return res.json({ success: true, message: "Dispatch marked as dispatched", data: dispatch });
  } catch (e) { next(e); }
};

// PATCH /dispatches/:id/receive — branch admin marks as received or rejected
const receiveOrRejectDispatch = async (req, res, next) => {
  try {
    const dispatch = await svc.receiveOrRejectDispatch(toInt(req.params.id), req.user, req.body);
    await log(req, `DISPATCH_${dispatch.status.toUpperCase()}`, "STOCK", dispatch.id,
      `${req.user.username} marked dispatch as ${dispatch.status}${dispatch.discrepancies?.length ? ` (${dispatch.discrepancies.length} discrepancies)` : ""}`);
    return res.json({ success: true, message: `Dispatch marked as ${dispatch.status}`, data: dispatch });
  } catch (e) { next(e); }
};

// GET /dispatches/my-branch — branch admin views their branch dispatches
const getMyBranchDispatches = async (req, res, next) => {
  try {
    const dispatches = await svc.getDispatchesForBranch(req.user, req.query);
    return res.json({ success: true, data: dispatches });
  } catch (e) { next(e); }
};

// ─── Discrepancies ────────────────────────────────────────────────────────────

// GET /dispatches/:id/discrepancies — get discrepancies for a specific dispatch
const getDispatchDiscrepancies = async (req, res, next) => {
  try {
    return res.json({ success: true, data: await svc.getDispatchDiscrepancies(toInt(req.params.id)) });
  } catch (e) { next(e); }
};

// GET /discrepancies — super admin views all unresolved discrepancies
const getAllDiscrepancies = async (req, res, next) => {
  try {
    return res.json({ success: true, data: await svc.getAllDiscrepancies(req.query) });
  } catch (e) { next(e); }
};

// PATCH /discrepancies/:id/resolve — super admin resolves a discrepancy
const resolveDiscrepancy = async (req, res, next) => {
  try {
    const disc = await svc.resolveDiscrepancy(toInt(req.params.id), req.user.id);
    await log(req, "RESOLVE_DISCREPANCY", "STOCK", disc.id, `${req.user.username} resolved discrepancy for item: ${disc.stockItem?.name}`);
    return res.json({ success: true, message: "Discrepancy resolved", data: disc });
  } catch (e) { next(e); }
};

module.exports = {
  createWarehouse, getAllWarehouses, getWarehouseById, updateWarehouse, deleteWarehouse,
  getWarehouseInventory, addOrUpdateWarehouseInventory,
  getBranchInventory,
  createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory,
  createStockItem, getAllStockItems, getStockItemById, updateStockItem, deleteStockItem,
  createDispatch, getAllDispatches, getDispatchById,
  updateDispatchStatus, markAsDispatched, receiveOrRejectDispatch, getMyBranchDispatches,
  getDispatchDiscrepancies, getAllDiscrepancies, resolveDiscrepancy,
};
