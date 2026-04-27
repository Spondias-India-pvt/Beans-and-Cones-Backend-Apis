const prisma = require("../config/prisma");

// ─── Warehouse ────────────────────────────────────────────────────────────────

const createWarehouse = async (data) => {
  // Auto-generate code from name: first 3 letters uppercase + sequence e.g. MAI001
  const prefix = (data.name || "WH")
    .replace(/\s+/g, "")
    .substring(0, 3)
    .toUpperCase();

  const existing = await prisma.warehouse.findMany({
    where:  { code: { startsWith: prefix } },
    select: { code: true },
  });
  const sequence = String(existing.length + 1).padStart(3, "0");
  const code = `${prefix}${sequence}`;

  return await prisma.warehouse.create({
    data: { ...data, code },
  });
};

const getAllWarehouses = async () => {
  return await prisma.warehouse.findMany({
    include: { _count: { select: { dispatches: true, warehouseInventory: true } } },
    orderBy: { id: "asc" },
  });
};

const getWarehouseById = async (id) => {
  const wh = await prisma.warehouse.findUnique({
    where: { id },
    include: {
      warehouseInventory: {
        include: { stockItem: { select: { id: true, name: true, sku: true, unit: true } } },
      },
    },
  });
  if (!wh) throw new Error("Warehouse not found");
  return wh;
};

const updateWarehouse = async (id, data) => {
  await getWarehouseById(id);
  return await prisma.warehouse.update({ where: { id }, data });
};

const deleteWarehouse = async (id) => {
  await getWarehouseById(id);
  return await prisma.warehouse.update({ where: { id }, data: { isActive: false } });
};

// ─── Warehouse Inventory ──────────────────────────────────────────────────────

const addOrUpdateWarehouseInventory = async (warehouseId, stockItemId, quantity) => {
  return await prisma.warehouse_inventory.upsert({
    where:  { warehouseId_stockItemId: { warehouseId, stockItemId } },
    update: { quantity },
    create: { warehouseId, stockItemId, quantity },
    include: { stockItem: { select: { id: true, name: true, sku: true, unit: true } } },
  });
};

const getWarehouseInventory = async (warehouseId) => {
  return await prisma.warehouse_inventory.findMany({
    where:   { warehouseId },
    include: { stockItem: { select: { id: true, name: true, sku: true, unit: true } } },
    orderBy: { stockItemId: "asc" },
  });
};

// ─── Branch Inventory ─────────────────────────────────────────────────────────

const getBranchInventory = async (branchId) => {
  return await prisma.branch_inventory.findMany({
    where:   { branchId },
    include: { stockItem: { select: { id: true, name: true, sku: true, unit: true, reorderLevel: true } } },
    orderBy: { stockItemId: "asc" },
  });
};



const createCategory = async (data) => {
  const existing = await prisma.stock_categories.findUnique({ where: { name: data.name } });
  if (existing) throw new Error("Category already exists");
  return await prisma.stock_categories.create({ data });
};

const getAllCategories = async () => {
  return await prisma.stock_categories.findMany({
    include: { _count: { select: { stockItems: true } } },
    orderBy: { id: "asc" },
  });
};

const getCategoryById = async (id) => {
  const cat = await prisma.stock_categories.findUnique({
    where: { id },
    include: { stockItems: { where: { isActive: true } } },
  });
  if (!cat) throw new Error("Category not found");
  return cat;
};

const updateCategory = async (id, data) => {
  await getCategoryById(id);
  return await prisma.stock_categories.update({ where: { id }, data });
};

const deleteCategory = async (id) => {
  await getCategoryById(id);
  return await prisma.stock_categories.update({ where: { id }, data: { isActive: false } });
};

// ─── Stock Items ──────────────────────────────────────────────────────────────

const createStockItem = async (data, userId) => {
  const existingSku = await prisma.stock_items.findUnique({ where: { sku: data.sku } });
  if (existingSku) throw new Error("SKU already exists");

  const category = await prisma.stock_categories.findUnique({ where: { id: Number(data.categoryId) } });
  if (!category) throw new Error("Category not found");

  return await prisma.stock_items.create({
    data: {
      name:         data.name,
      sku:          data.sku,
      unit:         data.unit,
      reorderLevel: data.reorderLevel,
      unitCost:     data.unitCost,
      description:  data.description ?? null,
      isActive:     true,
      category:     { connect: { id: Number(data.categoryId) } },
      createdByUser: { connect: { id: userId } },
    },
    include: { category: true },
  });
};

const getAllStockItems = async (filters = {}) => {
  const where = {};
  if (filters.categoryId) where.categoryId = Number(filters.categoryId);
  if (filters.isActive !== undefined) where.isActive = filters.isActive === "true";
  if (filters.unit) where.unit = filters.unit;

  return await prisma.stock_items.findMany({
    where,
    include: {
      category: { select: { id: true, name: true } },
      createdByUser: { select: { id: true, username: true } },
    },
    orderBy: { id: "asc" },
  });
};

const getStockItemById = async (id) => {
  const item = await prisma.stock_items.findUnique({
    where: { id },
    include: {
      category: true,
      createdByUser: { select: { id: true, username: true } },
    },
  });
  if (!item) throw new Error("Stock item not found");
  return item;
};

const updateStockItem = async (id, data) => {
  await getStockItemById(id);
  const updateData = {};
  const fields = ["name","unit","reorderLevel","unitCost","description","isActive"];
  for (const f of fields) {
    if (data[f] !== undefined) updateData[f] = data[f];
  }
  if (data.categoryId) {
    const cat = await prisma.stock_categories.findUnique({ where: { id: Number(data.categoryId) } });
    if (!cat) throw new Error("Category not found");
    updateData.categoryId = Number(data.categoryId);
  }
  return await prisma.stock_items.update({
    where: { id },
    data: updateData,
    include: { category: true },
  });
};

const deleteStockItem = async (id) => {
  await getStockItemById(id);
  return await prisma.stock_items.update({ where: { id }, data: { isActive: false } });
};

// ─── Stock Dispatches ─────────────────────────────────────────────────────────

const createDispatch = async (data, userId) => {
  const { toBranchId, warehouseId, dispatchDate, notes, items } = data;

  if (!items || items.length === 0) throw new Error("At least one item is required");

  const toBranch = await prisma.branch.findUnique({ where: { id: Number(toBranchId) } });
  if (!toBranch) throw new Error("Destination branch not found");

  const warehouse = await prisma.warehouse.findUnique({ where: { id: Number(warehouseId) } });
  if (!warehouse) throw new Error("Warehouse not found");
  if (!warehouse.isActive) throw new Error("Warehouse is inactive");

  // Validate all stock items exist AND warehouse has enough stock
  for (const item of items) {
    const stockItem = await prisma.stock_items.findUnique({ where: { id: Number(item.stockItemId) } });
    if (!stockItem) throw new Error(`Stock item ${item.stockItemId} not found`);
    if (!stockItem.isActive) throw new Error(`Stock item "${stockItem.name}" is inactive`);

    const warehouseStock = await prisma.warehouse_inventory.findUnique({
      where: { warehouseId_stockItemId: { warehouseId: Number(warehouseId), stockItemId: Number(item.stockItemId) } },
    });

    if (!warehouseStock) {
      throw new Error(`Stock item "${stockItem.name}" is not available in this warehouse`);
    }
    if (Number(warehouseStock.quantity) < Number(item.quantitySent)) {
      throw new Error(
        `Insufficient stock for "${stockItem.name}". Available: ${warehouseStock.quantity}, Requested: ${item.quantitySent}`
      );
    }
  }

  // Auto-generate dispatch number
  const count = await prisma.stock_dispatches.count();
  const dispatchNumber = `DISP-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

  return await prisma.stock_dispatches.create({
    data: {
      dispatchNumber,
      warehouse:        { connect: { id: Number(warehouseId) } },
      toBranch:         { connect: { id: Number(toBranchId) } },
      status:           "pending",
      dispatchDate:     new Date(dispatchDate),
      notes:            notes ?? null,
      dispatchedByUser: { connect: { id: userId } },
      items: {
        create: items.map((item) => ({
          stockItemId:  Number(item.stockItemId),
          quantitySent: item.quantitySent,
          unitCost:     item.unitCost,
        })),
      },
    },
    include: {
      warehouse: { select: { id: true, name: true, code: true } },
      toBranch:  { select: { id: true, branchName: true, branchCode: true } },
      items: { include: { stockItem: { select: { id: true, name: true, sku: true, unit: true } } } },
      dispatchedByUser: { select: { id: true, username: true } },
    },
  });
};

const getAllDispatches = async (filters = {}) => {
  const where = {};
  if (filters.toBranchId)  where.toBranchId  = Number(filters.toBranchId);
  if (filters.warehouseId) where.warehouseId = Number(filters.warehouseId);
  if (filters.status)      where.status      = filters.status;

  return await prisma.stock_dispatches.findMany({
    where,
    include: {
      warehouse: { select: { id: true, name: true, code: true } },
      toBranch:  { select: { id: true, branchName: true, branchCode: true } },
      dispatchedByUser: { select: { id: true, username: true } },
      _count: { select: { items: true } },
    },
    orderBy: { id: "desc" },
  });
};

const getDispatchById = async (id) => {
  const dispatch = await prisma.stock_dispatches.findUnique({
    where: { id },
    include: {
      warehouse: { select: { id: true, name: true, code: true } },
      toBranch:  { select: { id: true, branchName: true, branchCode: true } },
      dispatchedByUser: { select: { id: true, username: true } },
      receivedByUser:   { select: { id: true, username: true } },
      items: {
        include: { stockItem: { select: { id: true, name: true, sku: true, unit: true } } },
      },
    },
  });
  if (!dispatch) throw new Error("Dispatch not found");
  return dispatch;
};

const updateDispatchStatus = async (id, { status, receivedBy, receivedDate, items }) => {
  const dispatch = await getDispatchById(id);

  if (dispatch.status === "received") throw new Error("Dispatch already received");
  if (dispatch.status === "rejected") throw new Error("Dispatch already rejected");

  const updateData = { status };

  if (status === "received") {
    if (!receivedBy) throw new Error("receivedBy is required when marking as received");
    updateData.receivedBy   = Number(receivedBy);
    updateData.receivedDate = receivedDate ? new Date(receivedDate) : new Date();

    if (items && items.length > 0) {
      for (const item of items) {
        await prisma.stock_dispatch_items.updateMany({
          where: { dispatchId: id, stockItemId: Number(item.stockItemId) },
          data:  { quantityReceived: item.quantityReceived },
        });
      }
    }
  }

  return await prisma.stock_dispatches.update({
    where: { id },
    data:  updateData,
    include: {
      toBranch: { select: { id: true, branchName: true } },
      items: { include: { stockItem: { select: { id: true, name: true, unit: true } } } },
    },
  });
};

// ─── Super admin marks dispatch as "dispatched" ───────────────────────────────

const markAsDispatched = async (id, userId) => {
  const dispatch = await getDispatchById(id);

  if (dispatch.status !== "pending") {
    throw new Error(`Cannot dispatch — current status is "${dispatch.status}"`);
  }

  // Deduct quantities from warehouse inventory
  const dispatchItems = await prisma.stock_dispatch_items.findMany({ where: { dispatchId: id } });

  for (const di of dispatchItems) {
    const warehouseStock = await prisma.warehouse_inventory.findUnique({
      where: { warehouseId_stockItemId: { warehouseId: dispatch.warehouseId, stockItemId: di.stockItemId } },
    });

    if (!warehouseStock) {
      throw new Error(`Stock item ID ${di.stockItemId} not found in warehouse inventory`);
    }
    if (Number(warehouseStock.quantity) < Number(di.quantitySent)) {
      throw new Error(
        `Insufficient warehouse stock for item ID ${di.stockItemId}. Available: ${warehouseStock.quantity}, Required: ${di.quantitySent}`
      );
    }

    // Deduct from warehouse
    await prisma.warehouse_inventory.update({
      where: { warehouseId_stockItemId: { warehouseId: dispatch.warehouseId, stockItemId: di.stockItemId } },
      data:  { quantity: { decrement: Number(di.quantitySent) } },
    });
  }

  return await prisma.stock_dispatches.update({
    where: { id },
    data:  { status: "dispatched" },
    include: {
      warehouse: { select: { id: true, name: true, code: true } },
      toBranch:  { select: { id: true, branchName: true, branchCode: true } },
      items: { include: { stockItem: { select: { id: true, name: true, unit: true } } } },
    },
  });
};

// ─── Branch admin marks dispatch as "received" / "partially_received" / "rejected"

const receiveOrRejectDispatch = async (id, actingUser, { status, receivedDate, items, notes }) => {
  const emp = await prisma.branch_employee.findUnique({
    where:   { userId: actingUser.id },
    include: { role: true },
  });
  if (!emp || emp.role.name !== "BRANCH_ADMIN") {
    throw new Error("Only branch admins can receive or reject dispatches");
  }

  const dispatch = await getDispatchById(id);

  if (dispatch.toBranchId !== emp.branchId) {
    throw new Error("This dispatch is not assigned to your branch");
  }
  if (dispatch.status !== "dispatched") {
    throw new Error(`Cannot update — current status is "${dispatch.status}". Dispatch must be in "dispatched" state.`);
  }
  if (!["received", "rejected"].includes(status)) {
    throw new Error('status must be "received" or "rejected"');
  }

  // ── Rejection — no inventory update ──────────────────────────────────────
  if (status === "rejected") {
    return await prisma.stock_dispatches.update({
      where: { id },
      data:  { status: "rejected", notes: notes ?? dispatch.notes },
      include: {
        warehouse: { select: { id: true, name: true } },
        toBranch:  { select: { id: true, branchName: true } },
        items: { include: { stockItem: { select: { id: true, name: true, unit: true } } } },
      },
    });
  }

  // ── Receive — check each item quantity ───────────────────────────────────
  const dispatchItems = await prisma.stock_dispatch_items.findMany({
    where: { dispatchId: id },
  });

  // Build a map of received quantities from request
  const receivedMap = {};
  if (items && items.length > 0) {
    for (const item of items) {
      receivedMap[Number(item.stockItemId)] = {
        qty:    Number(item.quantityReceived),
        reason: item.reason ?? null,
      };
    }
  }

  let hasShortage = false;
  const discrepancies = [];

  // Process each dispatched item
  for (const di of dispatchItems) {
    const received = receivedMap[di.stockItemId];
    const receivedQty = received ? received.qty : Number(di.quantitySent); // default = full qty if not specified
    const sentQty     = Number(di.quantitySent);

    // Update quantity received on the dispatch item
    await prisma.stock_dispatch_items.update({
      where: { id: di.id },
      data:  {
        quantityReceived: receivedQty,
        discrepancyNote:  received?.reason ?? null,
      },
    });

    // Update branch inventory with what was actually received
    if (receivedQty > 0) {
      await prisma.branch_inventory.upsert({
        where:  { branchId_stockItemId: { branchId: emp.branchId, stockItemId: di.stockItemId } },
        update: { quantity: { increment: receivedQty } },
        create: { branchId: emp.branchId, stockItemId: di.stockItemId, quantity: receivedQty },
      });
    }

    // Record discrepancy if shortage
    if (receivedQty < sentQty) {
      hasShortage = true;
      discrepancies.push({
        dispatchId:       id,
        stockItemId:      di.stockItemId,
        quantitySent:     sentQty,
        quantityReceived: receivedQty,
        shortageQty:      sentQty - receivedQty,
        reason:           received?.reason ?? null,
      });
    }
  }

  // Create discrepancy records if any shortages
  if (discrepancies.length > 0) {
    await prisma.dispatch_discrepancy.createMany({ data: discrepancies });
  }

  // Final status: partially_received if any shortage, received if all match
  const finalStatus = hasShortage ? "partially_received" : "received";

  return await prisma.stock_dispatches.update({
    where: { id },
    data:  {
      status:       finalStatus,
      receivedBy:   actingUser.id,
      receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
      notes:        notes ?? dispatch.notes,
    },
    include: {
      warehouse: { select: { id: true, name: true } },
      toBranch:  { select: { id: true, branchName: true } },
      items: {
        include: { stockItem: { select: { id: true, name: true, unit: true } } },
      },
      discrepancies: {
        include: { stockItem: { select: { id: true, name: true, unit: true } } },
      },
    },
  });
};

// ─── Get discrepancies for a dispatch ────────────────────────────────────────

const getDispatchDiscrepancies = async (dispatchId) => {
  return await prisma.dispatch_discrepancy.findMany({
    where: { dispatchId },
    include: {
      stockItem: { select: { id: true, name: true, sku: true, unit: true } },
      resolvedByUser: { select: { id: true, username: true } },
    },
    orderBy: { id: "asc" },
  });
};

// ─── Super admin resolves a discrepancy ──────────────────────────────────────

const resolveDiscrepancy = async (discrepancyId, userId) => {
  const disc = await prisma.dispatch_discrepancy.findUnique({ where: { id: discrepancyId } });
  if (!disc) throw new Error("Discrepancy record not found");
  if (disc.resolvedAt) throw new Error("Discrepancy already resolved");

  return await prisma.dispatch_discrepancy.update({
    where: { id: discrepancyId },
    data:  { resolvedAt: new Date(), resolvedBy: userId },
    include: { stockItem: { select: { id: true, name: true, unit: true } } },
  });
};

// ─── Get all unresolved discrepancies (super admin view) ─────────────────────

const getAllDiscrepancies = async (filters = {}) => {
  const where = { resolvedAt: null }; // unresolved by default
  if (filters.resolved === "true") delete where.resolvedAt;
  if (filters.dispatchId) where.dispatchId = Number(filters.dispatchId);
  if (filters.branchId) {
    where.dispatch = { toBranchId: Number(filters.branchId) };
  }

  return await prisma.dispatch_discrepancy.findMany({
    where,
    include: {
      stockItem: { select: { id: true, name: true, sku: true, unit: true } },
      dispatch: {
        select: {
          id: true, dispatchNumber: true,
          toBranch: { select: { id: true, branchName: true } },
        },
      },
      resolvedByUser: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

// ─── Branch admin gets dispatches for their branch ────────────────────────────

const getDispatchesForBranch = async (actingUser, filters = {}) => {
  const emp = await prisma.branch_employee.findUnique({
    where:   { userId: actingUser.id },
    include: { role: true },
  });
  if (!emp || emp.role.name !== "BRANCH_ADMIN") {
    throw new Error("Only branch admins can view branch dispatches");
  }

  const where = { toBranchId: emp.branchId };
  if (filters.status) where.status = filters.status;

  return await prisma.stock_dispatches.findMany({
    where,
    include: {
      warehouse:        { select: { id: true, name: true, code: true } },
      toBranch:         { select: { id: true, branchName: true, branchCode: true } },
      dispatchedByUser: { select: { id: true, username: true } },
      receivedByUser:   { select: { id: true, username: true } },
      _count: { select: { items: true } },
    },
    orderBy: { id: "desc" },
  });
};

module.exports = {
  createWarehouse, getAllWarehouses, getWarehouseById, updateWarehouse, deleteWarehouse,
  addOrUpdateWarehouseInventory, getWarehouseInventory,
  getBranchInventory,
  createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory,
  createStockItem, getAllStockItems, getStockItemById, updateStockItem, deleteStockItem,
  createDispatch, getAllDispatches, getDispatchById,
  updateDispatchStatus, markAsDispatched, receiveOrRejectDispatch, getDispatchesForBranch,
  getDispatchDiscrepancies, resolveDiscrepancy, getAllDiscrepancies,
};
