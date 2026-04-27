const express = require("express");
const router  = express.Router();
const ctrl    = require("../controller/vip.controller");
const { authenticate, isSuperAdmin } = require("../middleware/auth.middleware");

router.get("/",           authenticate, ctrl.getAllVipPlans);
router.get("/:id",        authenticate, ctrl.getVipPlanById);
router.post("/",          authenticate, isSuperAdmin, ctrl.createVipPlan);
router.put("/:id",        authenticate, isSuperAdmin, ctrl.updateVipPlan);
router.delete("/:id",     authenticate, isSuperAdmin, ctrl.deleteVipPlan);

module.exports = router;
