require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const path    = require("path");

const app  = express();
const BASE = "/api";

app.use(express.json());
app.use(cors());

// Serve static HTML pages
app.use(express.static(path.join(__dirname, "public")));

// Reset password page
app.get("/reset-password", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "reset-password.html"));
});

// Forgot password page
app.get("/forgot-password", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "forgot-password.html"));
});

// Public config — exposes only the site key (safe to expose)
app.get("/api/config", (req, res) => {
  res.json({ recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY || "" });
});

// ─── Staff / Admin Routes ─────────────────────────────────────────────────────
app.use(`${BASE}/auth`,              require("./routes/auth.route"));
app.use(`${BASE}/super-admin`,       require("./routes/superAdmin.route"));
app.use(`${BASE}/branches`,          require("./routes/branch.route"));
app.use(`${BASE}/employees`,         require("./routes/employee.route"));
app.use(`${BASE}/branch-settings`,   require("./routes/branchSettings.route"));

// ─── Stock & Inventory Routes ─────────────────────────────────────────────────
app.use(`${BASE}/stock`,             require("./routes/stock.route"));

// ─── Product & Order Routes ───────────────────────────────────────────────────
app.use(`${BASE}/products`,          require("./routes/product.route"));
app.use(`${BASE}/orders`,            require("./routes/order.route"));

// ─── Customer Routes ──────────────────────────────────────────────────────────
app.use(`${BASE}/customers`,         require("./routes/customer.route"));
app.use(`${BASE}/cart`,              require("./routes/cart.route"));

// ─── Promotions & Loyalty ─────────────────────────────────────────────────────
app.use(`${BASE}/coupons`,           require("./routes/coupon.route"));
app.use(`${BASE}/loyalty`,           require("./routes/loyalty.route"));
app.use(`${BASE}/vip`,               require("./routes/vip.route"));

// ─── Notifications ────────────────────────────────────────────────────────────
app.use(`${BASE}/notifications`,     require("./routes/notification.route"));

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status  = err.statusCode || 500;
  const message = err.message    || "Internal server error";
  return res.status(status).json({ success: false, message });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
