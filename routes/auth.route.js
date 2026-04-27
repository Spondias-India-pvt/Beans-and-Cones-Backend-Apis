const express             = require("express");
const router              = express.Router();
const ctrl                = require("../controller/auth.controller");
const { authenticate }    = require("../middleware/auth.middleware");
const { validateLogin }   = require("../validators/auth.validator");

router.post("/login", validateLogin, ctrl.login);
router.get("/superadmin",     authenticate,  ctrl.getMe);

module.exports = router;
