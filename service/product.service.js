const prisma = require("../config/prisma");

// ─── Products ─────────────────────────────────────────────────────────────────

const createProduct = async (data, actingUser) => {
  // Branch admin can only create products for their own branch
  if (actingUser.userType === "BRANCH_EMPLOYEE") {
    const emp = await prisma.branch_employee.findUnique({ where: { userId: actingUser.id }, include: { role: true } });
    if (!emp || emp.role.name !== "BRANCH_ADMIN") throw new Error("Only branch admins can create products");
    if (Number(data.branchId) !== emp.branchId) throw new Error("You can only create products for your own branch");
  }

  return await prisma.product.create({
    data: {
      name:        data.name,
      description: data.description ?? null,
      isActive:    true,
      branch:      { connect: { id: Number(data.branchId) } },
    },
    include: { variants: true, recipes: { include: { stockItem: { select: { id: true, name: true, unit: true } } } } },
  });
};

const getAllProducts = async (actingUser, filters = {}) => {
  const where = {};

  if (actingUser.userType === "BRANCH_EMPLOYEE") {
    const emp = await prisma.branch_employee.findUnique({ where: { userId: actingUser.id } });
    where.branchId = emp.branchId;
  }

  if (filters.branchId)  where.branchId = Number(filters.branchId);
  if (filters.isActive !== undefined) where.isActive = filters.isActive === "true";

  return await prisma.product.findMany({
    where,
    include: {
      variants: true,
      branch:   { select: { id: true, branchName: true } },
      _count:   { select: { orderItems: true } },
    },
    orderBy: { id: "asc" },
  });
};

const getProductById = async (id) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: true,
      branch:   { select: { id: true, branchName: true } },
      recipes:  { include: { stockItem: { select: { id: true, name: true, unit: true } } } },
    },
  });
  if (!product) throw new Error("Product not found");
  return product;
};

const updateProduct = async (id, data) => {
  await getProductById(id);
  const updateData = {};
  if (data.name        !== undefined) updateData.name        = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.isActive    !== undefined) updateData.isActive    = data.isActive;
  return await prisma.product.update({ where: { id }, data: updateData, include: { variants: true } });
};

const deleteProduct = async (id) => {
  await getProductById(id);
  return await prisma.product.update({ where: { id }, data: { isActive: false } });
};

// ─── Variants ─────────────────────────────────────────────────────────────────

const addVariant = async (productId, data) => {
  await getProductById(productId);
  return await prisma.product_variant.create({
    data: { productId, name: data.name, price: data.price, isActive: true },
  });
};

const updateVariant = async (variantId, data) => {
  const variant = await prisma.product_variant.findUnique({ where: { id: variantId } });
  if (!variant) throw new Error("Variant not found");
  return await prisma.product_variant.update({ where: { id: variantId }, data });
};

const deleteVariant = async (variantId) => {
  const variant = await prisma.product_variant.findUnique({ where: { id: variantId } });
  if (!variant) throw new Error("Variant not found");
  return await prisma.product_variant.update({ where: { id: variantId }, data: { isActive: false } });
};

// ─── Recipes ──────────────────────────────────────────────────────────────────

const addOrUpdateRecipe = async (productId, stockItemId, quantityUsed) => {
  await getProductById(productId);
  const stockItem = await prisma.stock_items.findUnique({ where: { id: stockItemId } });
  if (!stockItem) throw new Error("Stock item not found");

  return await prisma.product_recipe.upsert({
    where:  { productId_stockItemId: { productId, stockItemId } },
    update: { quantityUsed },
    create: { productId, stockItemId, quantityUsed },
    include: { stockItem: { select: { id: true, name: true, unit: true } } },
  });
};

const removeRecipeItem = async (productId, stockItemId) => {
  const recipe = await prisma.product_recipe.findUnique({
    where: { productId_stockItemId: { productId, stockItemId } },
  });
  if (!recipe) throw new Error("Recipe item not found");
  return await prisma.product_recipe.delete({ where: { productId_stockItemId: { productId, stockItemId } } });
};

const getRecipe = async (productId) => {
  return await prisma.product_recipe.findMany({
    where:   { productId },
    include: { stockItem: { select: { id: true, name: true, sku: true, unit: true } } },
  });
};

module.exports = {
  createProduct, getAllProducts, getProductById, updateProduct, deleteProduct,
  addVariant, updateVariant, deleteVariant,
  addOrUpdateRecipe, removeRecipeItem, getRecipe,
};
