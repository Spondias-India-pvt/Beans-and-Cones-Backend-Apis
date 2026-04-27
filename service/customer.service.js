const prisma = require("../config/prisma");
const bcrypt  = require("bcrypt");
const jwt     = require("jsonwebtoken");

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

const login = async ({ phone, password }) => {
  const customer = await prisma.customer.findUnique({ where: { phone } });
  if (!customer) throw new Error("Invalid credentials");
  if (!customer.isActive) throw new Error("Account is inactive");
  if (!customer.passwordHash) throw new Error("No password set. Use OTP login.");

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
    where: { id: customerId },
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
  // If setting as default, unset all others first
  if (data.isDefault) {
    await prisma.customer_address.updateMany({
      where: { customerId },
      data:  { isDefault: false },
    });
  }
  return await prisma.customer_address.create({
    data: { customerId, ...data },
  });
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

module.exports = { register, login, getProfile, updateProfile, addAddress, getAddresses, deleteAddress };
