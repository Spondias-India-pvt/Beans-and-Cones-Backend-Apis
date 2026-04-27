const express      = require("express");
const router       = express.Router();
const ctrl         = require("../controller/branchSettings.controller");
const { authenticate, isSuperAdmin } = require("../middleware/auth.middleware");
const { validateBranchSettings } = require("../validators/branchSettings.validator");

router.use(authenticate, isSuperAdmin);

router.get("/:branchId",  ctrl.getSettings);
router.post("/:branchId", validateBranchSettings, ctrl.createOrUpdateSettings);
router.put("/:branchId",  validateBranchSettings, ctrl.createOrUpdateSettings);

module.exports = router;
