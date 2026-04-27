const express = require("express");
const router = express.Router();
const roleController = require("../controller/role.controller");
const { authenticate, isSuperAdmin } = require("../middleware/auth.middleware");

// All role routes require authentication + super admin
router.use(authenticate, isSuperAdmin);

// POST   /api/beansandcones/roles
router.post("/addroles", roleController.createRole);

// GET    /api/beansandcones/roles
router.get("/", roleController.getAllRoles);

// GET    /api/beansandcones/roles/:id
router.get("/:id", roleController.getRoleById);

// PUT    /api/beansandcones/roles/:id
router.put("/:id", roleController.updateRole);

// DELETE /api/beansandcones/roles/:id
router.delete("/:id", roleController.deleteRole);

module.exports = router;
