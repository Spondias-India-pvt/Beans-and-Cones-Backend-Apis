const express      = require("express");
const router       = express.Router();
const ctrl         = require("../controller/stock.controller");
const { authenticate, isSuperAdmin, canManageEmployees } = require("../middleware/auth.middleware");
const {
  validateCreateCategory,
  validateCreateStockItem,
  validateCreateDispatch,
  validateUpdateDispatchStatus,
} = require("../validators/stock.validator");

// ─── Warehouse (Super Admin only) ─────────────────────────────────────────────
router.post("/warehouses",                    authenticate, isSuperAdmin, ctrl.createWarehouse);
router.get("/warehouses",                     authenticate, isSuperAdmin, ctrl.getAllWarehouses);
router.get("/warehouses/:id",                 authenticate, isSuperAdmin, ctrl.getWarehouseById);
router.put("/warehouses/:id",                 authenticate, isSuperAdmin, ctrl.updateWarehouse);
router.delete("/warehouses/:id",              authenticate, isSuperAdmin, ctrl.deleteWarehouse);

// Warehouse Inventory
router.get("/warehouses/inventory/all",              authenticate, isSuperAdmin, ctrl.getAllWarehousesInventory);
router.get("/warehouses/inventory/:id",              authenticate, isSuperAdmin, ctrl.getWarehouseInventoryById);
router.delete("/warehouses/inventory/:id",           authenticate, isSuperAdmin, ctrl.deleteWarehouseInventoryById);
router.get("/warehouses/:id/inventory",              authenticate, isSuperAdmin, ctrl.getWarehouseInventory);
router.post("/warehouses/:id/inventory",             authenticate, isSuperAdmin, ctrl.addOrUpdateWarehouseInventory);
router.put("/warehouses/:id/inventory",              authenticate, isSuperAdmin, ctrl.updateWarehouseInventory);
router.delete("/warehouses/:id/inventory/:stockItemId", authenticate, isSuperAdmin, ctrl.removeWarehouseInventoryItem);

// ─── Branch Inventory (Super Admin or Branch Admin) ───────────────────────────
router.get("/inventory/:branchId",            authenticate, canManageEmployees, ctrl.getBranchInventory);

// ─── Stock Categories (Super Admin only) ──────────────────────────────────────
router.post("/categories",                    authenticate, isSuperAdmin, validateCreateCategory, ctrl.createCategory);
router.get("/categories",                     authenticate, isSuperAdmin, ctrl.getAllCategories);
router.get("/categories/:id",                 authenticate, isSuperAdmin, ctrl.getCategoryById);
router.put("/categories/:id",                 authenticate, isSuperAdmin, ctrl.updateCategory);
router.delete("/categories/:id",              authenticate, isSuperAdmin, ctrl.deleteCategory);

// ─── Stock Items (Super Admin only) ───────────────────────────────────────────
router.post("/items",                         authenticate, isSuperAdmin, validateCreateStockItem, ctrl.createStockItem);
router.get("/items",                          authenticate, isSuperAdmin, ctrl.getAllStockItems);
router.get("/items/:id",                      authenticate, isSuperAdmin, ctrl.getStockItemById);
router.put("/items/:id",                      authenticate, isSuperAdmin, ctrl.updateStockItem);
router.delete("/items/:id",                   authenticate, isSuperAdmin, ctrl.deleteStockItem);

// ─── Dispatches — Super Admin creates and dispatches ──────────────────────────
router.post("/dispatches",                    authenticate, isSuperAdmin, validateCreateDispatch, ctrl.createDispatch);
router.get("/dispatches",                     authenticate, isSuperAdmin, ctrl.getAllDispatches);
router.get("/dispatches/:id",                 authenticate, isSuperAdmin, ctrl.getDispatchById);
router.patch("/dispatches/:id/dispatch",      authenticate, isSuperAdmin, ctrl.markAsDispatched);

// ─── Dispatches — Branch Admin receives or rejects ────────────────────────────
router.get("/my-dispatches",                  authenticate, canManageEmployees, ctrl.getMyBranchDispatches);
router.patch("/dispatches/:id/receive",       authenticate, canManageEmployees, validateUpdateDispatchStatus, ctrl.receiveOrRejectDispatch);

// ─── Discrepancies ────────────────────────────────────────────────────────────
// Super admin views all discrepancies
router.get("/discrepancies",                  authenticate, isSuperAdmin, ctrl.getAllDiscrepancies);
// Super admin resolves a discrepancy
router.patch("/discrepancies/:id/resolve",    authenticate, isSuperAdmin, ctrl.resolveDiscrepancy);
// Anyone with access views discrepancies for a specific dispatch
router.get("/dispatches/:id/discrepancies",   authenticate, ctrl.getDispatchDiscrepancies);

module.exports = router;
