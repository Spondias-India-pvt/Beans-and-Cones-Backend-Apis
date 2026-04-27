const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");

// ─── Auto-generate employee code: EMP-0001, EMP-0002 ... ─────────────────────

const generateEmployeeCode = async () => {
  const count = await prisma.branch_employee.count();
  return `EMP-${String(count + 1).padStart(4, "0")}`;
};

// ─── helpers ──────────────────────────────────────────────────────────────────

const getBranchEmployeeById = async (id) => {
  const emp = await prisma.branch_employee.findUnique({
    where: { id },
    include: {
      role:   true,
      branch: { select: { id: true, branchName: true, branchCode: true } },
      user:   { select: { id: true, username: true, email: true, status: true, lastLogin: true } },
      salary: true,
    },
  });
  if (!emp) throw new Error("Branch employee not found");
  return emp;
};

// ─── Branch CRUD ──────────────────────────────────────────────────────────────

const createBranch = async (data) => {
  // Auto-generate branchCode from city (first 3 letters uppercase) + sequence
  const cityPrefix = (data.city || data.branchName || "BRN")
    .replace(/\s+/g, "")
    .substring(0, 3)
    .toUpperCase();

  // Find how many branches already start with this prefix
  const existing = await prisma.branch.findMany({
    where: { branchCode: { startsWith: cityPrefix } },
    select: { branchCode: true },
  });
  const sequence = String(existing.length + 1).padStart(3, "0");
  const branchCode = `${cityPrefix}${sequence}`;

  return await prisma.branch.create({
    data: { ...data, branchCode },
  });
};

const getAllBranches = async () => {
  const branchAdminRole = await prisma.role.findUnique({ where: { name: "BRANCH_ADMIN" } });
  return await prisma.branch.findMany({
    include: {
      _count: { select: { employees: true } },
      employees: {
        where: branchAdminRole ? { roleId: branchAdminRole.id } : {},
        select: { id: true, firstName: true, lastName: true, designation: true, status: true },
        take: 1,
      },
    },
    orderBy: { id: "asc" },
  });
};

const getBranchById = async (id) => {
  const branch = await prisma.branch.findUnique({
    where: { id },
    include: {
      employees: {
        include: {
          role:   true,
          user:   { select: { id: true, username: true, email: true, status: true } },
          salary: true,
        },
        orderBy: { id: "asc" },
      },
    },
  });
  if (!branch) throw new Error("Branch not found");
  return branch;
};

// ─── Get employees of a specific branch ──────────────────────────────────────

const getBranchEmployees = async (branchId, filters = {}) => {
  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) throw new Error("Branch not found");

  const where = { branchId };
  if (filters.roleId)           where.roleId       = Number(filters.roleId);
  if (filters.status !== undefined) where.status   = filters.status === "true";
  if (filters.employmentType)   where.employmentType = filters.employmentType;

  const employees = await prisma.branch_employee.findMany({
    where,
    include: {
      role:   true,
      user:   { select: { id: true, username: true, email: true, status: true, lastLogin: true } },
      salary: true,
    },
    orderBy: { id: "asc" },
  });

  return { branch: { id: branch.id, branchName: branch.branchName, branchCode: branch.branchCode }, employees };
};

const updateBranch = async (id, data) => {
  const branch = await prisma.branch.findUnique({ where: { id } });
  if (!branch) throw new Error("Branch not found");
  return await prisma.branch.update({ where: { id }, data });
};

const deleteBranch = async (id) => {
  const branch = await prisma.branch.findUnique({ where: { id } });
  if (!branch) throw new Error("Branch not found");
  return await prisma.branch.delete({ where: { id } });
};

// ─── Create branch admin ──────────────────────────────────────────────────────

const createBranchAdmin = async (data) => {
  const { username, password, email, branchId, ...empData } = data;

  const branchAdminRole = await prisma.role.findUnique({ where: { name: "BRANCH_ADMIN" } });
  if (!branchAdminRole) throw new Error("BRANCH_ADMIN role not found. Run /super-admin/roles/seed first.");

  const branch = await prisma.branch.findUnique({ where: { id: Number(branchId) } });
  if (!branch) throw new Error("Branch not found");

  const existingAdmin = await prisma.branch_employee.findFirst({
    where: { branchId: Number(branchId), roleId: branchAdminRole.id },
  });
  if (existingAdmin) throw new Error("This branch already has an admin");

  const existingUser = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
  if (existingUser) throw new Error("Username or email already exists");

  // Auto-generate employee code
  const employeeCode = await generateEmployeeCode();
  const passwordHash = await bcrypt.hash(password, 10);

  return await prisma.branch_employee.create({
    data: {
      employeeCode,
      firstName:       empData.firstName,
      lastName:        empData.lastName,
      email,
      phone:           empData.phone           ?? null,
      gender:          empData.gender          ?? null,
      dateOfBirth:     empData.dateOfBirth     ? new Date(empData.dateOfBirth) : null,
      designation:     branchAdminRole.name,
      department:      empData.department      ?? null,
      hireDate:        new Date(empData.hireDate),
      employmentType:  empData.employmentType,
      experienceYears: empData.experienceYears ?? null,
      status:          true,
      branch: { connect: { id: Number(branchId) } },
      role:   { connect: { id: branchAdminRole.id } },
      user: {
        create: {
          username,
          email,
          passwordHash,
          userType: "BRANCH_EMPLOYEE",
          status:   "ACTIVE",
        },
      },
    },
    include: {
      role:   true,
      user:   { select: { id: true, username: true, email: true, status: true } },
      branch: { select: { id: true, branchName: true, branchCode: true } },
    },
  });
};

const getAllBranchAdmins = async () => {
  const branchAdminRole = await prisma.role.findUnique({ where: { name: "BRANCH_ADMIN" } });
  if (!branchAdminRole) return [];

  return await prisma.branch_employee.findMany({
    where: { roleId: branchAdminRole.id },
    include: {
      role:   true,
      user:   { select: { id: true, username: true, email: true, status: true, lastLogin: true } },
      branch: { select: { id: true, branchName: true, branchCode: true } },
      salary: true,
    },
    orderBy: { id: "asc" },
  });
};

// ─── Update branch employee ───────────────────────────────────────────────────

const updateBranchEmployee = async (id, data) => {
  const emp = await getBranchEmployeeById(id);
  const { username, email, userStatus, roleId, ...empData } = data;

  if (username && username !== emp.user.username) {
    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) throw new Error("Username already taken");
  }
  if (email && email !== emp.user.email) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new Error("Email already in use");
  }

  const empFields = ["firstName","lastName","email","phone","department",
    "employmentType","experienceYears","gender","dateOfBirth","hireDate","status"];

  const empUpdate = {};
  for (const field of empFields) {
    if (data[field] !== undefined) {
      empUpdate[field] = (field === "dateOfBirth" || field === "hireDate")
        ? new Date(data[field]) : data[field];
    }
  }
  if (roleId) {
    const role = await prisma.role.findUnique({ where: { id: Number(roleId) } });
    if (!role) throw new Error("Role not found");
    empUpdate.roleId      = Number(roleId);
    empUpdate.designation = role.name;
  }

  const userUpdate = {};
  if (email)      userUpdate.email    = email;
  if (username)   userUpdate.username = username;
  if (userStatus) userUpdate.status   = userStatus;

  const ops = [prisma.branch_employee.update({ where: { id }, data: empUpdate })];
  if (Object.keys(userUpdate).length > 0) {
    ops.push(prisma.user.update({ where: { id: emp.user.id }, data: userUpdate }));
  }

  await prisma.$transaction(ops);
  return await getBranchEmployeeById(id);
};

const resetBranchEmployeePassword = async (id, newPassword) => {
  const emp = await getBranchEmployeeById(id);
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: emp.user.id }, data: { passwordHash } });
  return { message: "Password reset successfully" };
};

// ─── Salary ───────────────────────────────────────────────────────────────────

const addOrUpdateSalary = async (employeeId, salaryData) => {
  await getBranchEmployeeById(employeeId);
  return await prisma.branch_employee_salary.upsert({
    where: { employeeId },
    update: { ...salaryData, effectiveFrom: new Date(salaryData.effectiveFrom) },
    create: { employeeId, ...salaryData, effectiveFrom: new Date(salaryData.effectiveFrom) },
  });
};

const getSalary = async (employeeId) => {
  const salary = await prisma.branch_employee_salary.findUnique({ where: { employeeId } });
  if (!salary) throw new Error("Salary record not found");
  return salary;
};

module.exports = {
  createBranch, getAllBranches, getBranchById, updateBranch, deleteBranch,
  createBranchAdmin, getAllBranchAdmins,
  getBranchEmployeeById, getBranchEmployees, updateBranchEmployee, resetBranchEmployeePassword,
  addOrUpdateSalary, getSalary,
};
