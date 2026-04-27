const svc            = require("../service/product.service");
const { createAuditLog } = require("../utils/auditLog");

const toInt = (v) => Number(v);
const log   = (req, action, module, referenceId, details) =>
  createAuditLog({ userId: req.user.id, username: req.user.username, action, module, referenceId, details });

// ─── Products ─────────────────────────────────────────────────────────────────
const getAllProducts  = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getAllProducts(req.user, req.query) }); } catch (e) { next(e); } };
const getProductById = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getProductById(toInt(req.params.id)) }); } catch (e) { next(e); } };
const getRecipe      = async (req, res, next) => { try { return res.json({ success: true, data: await svc.getRecipe(toInt(req.params.id)) }); } catch (e) { next(e); } };

const createProduct = async (req, res, next) => {
  try {
    const product = await svc.createProduct(req.body, req.user);
    await log(req, "CREATE_PRODUCT", "PRODUCT", product.id, `${req.user.username} created product: ${product.name}`);
    return res.status(201).json({ success: true, message: "Product created", data: product });
  } catch (e) { next(e); }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await svc.updateProduct(toInt(req.params.id), req.body);
    await log(req, "UPDATE_PRODUCT", "PRODUCT", product.id, `${req.user.username} updated product: ${product.name}`);
    return res.json({ success: true, message: "Product updated", data: product });
  } catch (e) { next(e); }
};

const deleteProduct = async (req, res, next) => {
  try {
    await svc.deleteProduct(toInt(req.params.id));
    await log(req, "DELETE_PRODUCT", "PRODUCT", req.params.id, `${req.user.username} deactivated product ID: ${req.params.id}`);
    return res.json({ success: true, message: "Product deactivated" });
  } catch (e) { next(e); }
};

// ─── Variants ─────────────────────────────────────────────────────────────────
const addVariant = async (req, res, next) => {
  try {
    const variant = await svc.addVariant(toInt(req.params.id), req.body);
    return res.status(201).json({ success: true, message: "Variant added", data: variant });
  } catch (e) { next(e); }
};

const updateVariant = async (req, res, next) => {
  try {
    const variant = await svc.updateVariant(toInt(req.params.variantId), req.body);
    return res.json({ success: true, message: "Variant updated", data: variant });
  } catch (e) { next(e); }
};

const deleteVariant = async (req, res, next) => {
  try {
    await svc.deleteVariant(toInt(req.params.variantId));
    return res.json({ success: true, message: "Variant deactivated" });
  } catch (e) { next(e); }
};

// ─── Recipes ──────────────────────────────────────────────────────────────────
const addOrUpdateRecipe = async (req, res, next) => {
  try {
    const { stockItemId, quantityUsed } = req.body;
    const recipe = await svc.addOrUpdateRecipe(toInt(req.params.id), toInt(stockItemId), quantityUsed);
    return res.json({ success: true, message: "Recipe updated", data: recipe });
  } catch (e) { next(e); }
};

const removeRecipeItem = async (req, res, next) => {
  try {
    await svc.removeRecipeItem(toInt(req.params.id), toInt(req.params.stockItemId));
    return res.json({ success: true, message: "Recipe item removed" });
  } catch (e) { next(e); }
};

module.exports = {
  createProduct, getAllProducts, getProductById, updateProduct, deleteProduct,
  addVariant, updateVariant, deleteVariant,
  addOrUpdateRecipe, removeRecipeItem, getRecipe,
};
