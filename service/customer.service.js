const prisma                 = require("../config/prisma");
const bcrypt                 = require("bcrypt");
const jwt                    = require("jsonwebtoken");
const crypto                 = require("crypto");
const { sendResetLinkEmail } = require("../utils/email");

// ─── Generate secure random token ────────────────────────────────────────────
const generateResetToken = () => crypto.randomBytes(32).toString("hex");

// ─── Register ─────────────────────────────────────────────────────────────────

const register = async ({ name, phone, email, password }) => {
  const existing = await prisma.customer.findUnique({ where: { phone } });
  if (existing) throw new Error("Phone number already registered");

  if (email) {
    const emailExists = await prisma.customer.findUnique({ where: { email } });
    if (emailExists) throw new Error("Email already registered");
  }

  const passwordHash = password ? await bcrypt.hash(password, 10) : null;

  return await prisma.customer.create({
    data: { name, phone, email: email ?? null, passwordHash, loyaltyPoints: 0 },
    select: { id: true, name: true, phone: true, email: true, loyaltyPoints: true, createdAt: true },
  });
};

// ─── Login ────────────────────────────────────────────────────────────────────

const login = async ({ phone, email, password }) => {
  const identifier = phone || email;
  if (!identifier) throw new Error("Phone or email is required");

  const customer = await prisma.customer.findFirst({
    where: { OR: [{ phone: identifier }, { email: identifier }] },
  });

  if (!customer)               throw new Error("Invalid credentials");
  if (!customer.isActive)      throw new Error("Account is inactive");
  if (!customer.passwordHash)  throw new Error("No password set. Contact support.");

  const isMatch = await bcrypt.compare(password, customer.passwordHash);
  if (!isMatch) throw new Error("Invalid credentials");

  const token = jwt.sign(
    { customerId: customer.id, type: "CUSTOMER" },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  return {
    token,
    customer: {
      id:            customer.id,
      name:          customer.name,
      phone:         customer.phone,
      email:         customer.email,
      loyaltyPoints: customer.loyaltyPoints,
    },
  };
};

// ─── Profile ──────────────────────────────────────────────────────────────────

const getProfile = async (customerId) => {
  const customer = await prisma.customer.findUnique({
    where:  { id: customerId },
    select: {
      id: true, name: true, phone: true, email: true,
      loyaltyPoints: true, createdAt: true,
      addresses: true,
    },
  });
  if (!customer) throw new Error("Customer not found");
  return customer;
};

const updateProfile = async (customerId, { name, email }) => {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new Error("Customer not found");

  if (email && email !== customer.email) {
    const taken = await prisma.customer.findUnique({ where: { email } });
    if (taken) throw new Error("Email already in use");
  }

  return await prisma.customer.update({
    where: { id: customerId },
    data:  {
      ...(name  && { name }),
      ...(email && { email }),
    },
    select: { id: true, name: true, phone: true, email: true, loyaltyPoints: true },
  });
};

// ─── Addresses ────────────────────────────────────────────────────────────────

const addAddress = async (customerId, data) => {
  if (data.isDefault) {
    await prisma.customer_address.updateMany({
      where: { customerId },
      data:  { isDefault: false },
    });
  }
  return await prisma.customer_address.create({ data: { customerId, ...data } });
};

const getAddresses = async (customerId) => {
  return await prisma.customer_address.findMany({
    where:   { customerId },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
  });
};

const deleteAddress = async (customerId, addressId) => {
  const addr = await prisma.customer_address.findFirst({ where: { id: addressId, customerId } });
  if (!addr) throw new Error("Address not found");
  return await prisma.customer_address.delete({ where: { id: addressId } });
};

// ─── Step 1: Forgot Password — generate token + send reset link ───────────────

const forgotPassword = async (identifier) => {
  const customer = await prisma.customer.findFirst({
    where: { OR: [{ phone: identifier }, { email: identifier }] },
  });
  if (!customer)         throw new Error("No account found with this phone or email");
  if (!customer.isActive) throw new Error("Account is inactive");
  if (!customer.email)   throw new Error("No email linked to this account. Contact support.");

  const resetToken = generateResetToken();
  const expiry     = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  await prisma.customer.update({
    where: { id: customer.id },
    data:  { resetOtp: resetToken, resetOtpExpiry: expiry },
  });

  await sendResetLinkEmail(customer.email, resetToken, customer.name, "customer");

  return { message: "Password reset link sent to your email. Valid for 30 minutes." };
};

// ─── Step 2: Validate token (frontend calls when user clicks the link) ────────

const validateResetToken = async (token) => {
  const customer = await prisma.customer.findFirst({ where: { resetOtp: token } });
  if (!customer)                             throw new Error("Invalid or expired reset link");
  if (new Date() > customer.resetOtpExpiry)  throw new Error("Reset link has expired. Please request a new one.");

  return { message: "Token is valid. You can now reset your password." };
};

// ─── Step 3: Reset Password using token ──────────────────────────────────────

const resetPassword = async (token, newPassword) => {
  const customer = await prisma.customer.findFirst({ where: { resetOtp: token } });
  if (!customer)                             throw new Error("Invalid or expired reset link");
  if (new Date() > customer.resetOtpExpiry)  throw new Error("Reset link has expired. Please request a new one.");

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.customer.update({
    where: { id: customer.id },
    data:  { passwordHash, resetOtp: null, resetOtpExpiry: null },
  });

  return { message: "Password reset successfully. You can now login." };
};

module.exports = {
  register, login, getProfile, updateProfile,
  addAddress, getAddresses, deleteAddress,
  forgotPassword, validateResetToken, resetPassword,
};
