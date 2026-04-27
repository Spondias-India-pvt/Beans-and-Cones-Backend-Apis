const jwt    = require("jsonwebtoken");
const prisma = require("../config/prisma");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }
    const token   = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user)                    return res.status(401).json({ success: false, message: "User not found" });
    if (user.status !== "ACTIVE") return res.status(403).json({ success: false, message: "Account is not active" });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// Only SUPER_ADMIN role in super_admin_staff table
const isSuperAdmin = async (req, res, next) => {
  try {
    if (req.user.userType !== "SUPER_ADMIN_STAFF") {
      return res.status(403).json({ success: false, message: "Super admin access required" });
    }
    const staff = await prisma.super_admin_staff.findUnique({
      where: { userId: req.user.id },
      include: { role: true },
    });
    if (!staff || staff.role.name !== "SUPER_ADMIN") {
      return res.status(403).json({ success: false, message: "Super admin access required" });
    }
    next();
  } catch (error) {
    next(error);
  }
};

// SUPER_ADMIN_STAFF (any role) OR branch_employee with BRANCH_ADMIN role
const canManageEmployees = async (req, res, next) => {
  try {
    if (req.user.userType === "SUPER_ADMIN_STAFF") return next();

    if (req.user.userType === "BRANCH_EMPLOYEE") {
      const emp = await prisma.branch_employee.findUnique({
        where: { userId: req.user.id },
        include: { role: true },
      });
      if (emp && emp.role.name === "BRANCH_ADMIN") return next();
    }

    return res.status(403).json({ success: false, message: "Insufficient permissions" });
  } catch (error) {
    next(error);
  }
};

// Customer JWT auth — optional (allows guest access)
const authenticateCustomer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.customer = null;
      return next(); // guest — continue without customer
    }
    const token   = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== "CUSTOMER") {
      req.customer = null;
      return next();
    }

    const customer = await prisma.customer.findUnique({ where: { id: decoded.customerId } });
    if (!customer || !customer.isActive) {
      req.customer = null;
      return next();
    }

    req.customer = customer;
    next();
  } catch {
    req.customer = null;
    next();
  }
};

// Customer JWT auth — required
const requireCustomer = async (req, res, next) => {
  await authenticateCustomer(req, res, () => {
    if (!req.customer) {
      return res.status(401).json({ success: false, message: "Customer login required" });
    }
    next();
  });
};

module.exports = { authenticate, isSuperAdmin, canManageEmployees, authenticateCustomer, requireCustomer };