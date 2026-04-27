const express = require("express");
const router  = express.Router();
const ctrl    = require("../controller/product.controller");
const { authenticate, isSuperAdmin, canManageEmployees } = require("../middleware/auth.middleware");

// ─── Products (Branch Admin or Super Admin) ───────────────────────────────────
router.post("/",                              authenticate, canManageEmployees, ctrl.createProduct);
router.get("/",                               authenticate, canManageEmployees, ctrl.getAllProducts);
router.get("/:id",                            authenticate, canManageEmployees, ctrl.getProductById);
router.put("/:id",                            authenticate, canManageEmployees, ctrl.updateProduct);
router.delete("/:id",                         authenticate, canManageEmployees, ctrl.deleteProduct);

// ─── Variants ─────────────────────────────────────────────────────────────────
router.post("/:id/variants",                  authenticate, canManageEmployees, ctrl.addVariant);
router.put("/:id/variants/:variantId",        authenticate, canManageEmployees, ctrl.updateVariant);
router.delete("/:id/variants/:variantId",     authenticate, canManageEmployees, ctrl.deleteVariant);

// ─── Recipes ──────────────────────────────────────────────────────────────────
router.get("/:id/recipe",                     authenticate, canManageEmployees, ctrl.getRecipe);
router.post("/:id/recipe",                    authenticate, canManageEmployees, ctrl.addOrUpdateRecipe);
router.delete("/:id/recipe/:stockItemId",     authenticate, canManageEmployees, ctrl.removeRecipeItem);

module.exports = router;
