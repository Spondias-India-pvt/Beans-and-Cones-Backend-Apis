const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");

// ─── Auto-generate employee code: EMP-0001, EMP-0002 ... ─────────────────────

const generateEmployeeCode = async () => {
  const count = await prisma.branch_employee.count();
  return `EMP-${String(count + 1).padStart(4, "0")}`;
};

// ─── helpers ──────────────────────────────────────────────────────────────────

const getEmployeeById = async (id) => {
  const emp = await prisma.branch_employee.findUnique({
    where: { id },
    include: {
      role:   true,
      branch: { select: { id: true, branchName: true, branchCode: true } },
      user:   { select: { id: true, username: true, email: true, status: true, lastLogin: true } },
      salary: true,
    },
  });
  if (!emp) throw new Error("Employee not found");
  return emp;
};

// ─── Access control ───────────────────────────────────────────────────────────

const assertBranchAccess = async (actingUser, branchId) => {
  if (actingUser.userType === "SUPER_ADMIN_STAFF") {
    const staff = await prisma.super_admin_staff.findUnique({
      where: { userId: actingUser.id },
      include: { role: true },
    });
    if (!staff) throw new Error("Staff record not found");
    if (staff.role.name === "SUPER_ADMIN") return;

    const access = await prisma.staff_branch_access.findUnique({
      where: { superAdminStaffId_branchId: { superAdminStaffId: staff.id, branchId } },
    });
    if (!access) throw new Error("You do not have access to this branch");
    return;
  }

  if (actingUser.userType === "BRANCH_EMPLOYEE") {
    const emp = await prisma.branch_employee.findUnique({
      where: { userId: actingUser.id },
      include: { role: true },
    });
    if (!emp) throw new Error("Employee record not found");
    if (emp.role.name !== "BRANCH_ADMIN") throw new Error("Only branch admins can manage employees");
    if (emp.branchId !== branchId) throw new Error("You can only manage employees in your own branch");
    return;
  }

  throw new Error("Insufficient permissions");
};

// ─── Create employee ──────────────────────────────────────────────────────────

const createEmployee = async (data, actingUser) => {
  const branchId = Number(data.branchId);
  await assertBranchAccess(actingUser, branchId);

  const { roleId, username, password, email, ...empData } = data;

  if (!roleId) throw new Error("roleId is required");

  const roleIdInt = Number(roleId);
  if (isNaN(roleIdInt)) throw new Error("roleId must be a valid integer");

  const role = await prisma.role.findUnique({ where: { id: roleIdInt } });
  if (!role) throw new Error("Role not found");
  if (role.name === "BRANCH_ADMIN") throw new Error("Use the branch admin creation endpoint instead");

  // Auto-generate employee code
  const employeeCode = await generateEmployeeCode();

  if (username) {
    const existingUser = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
    if (existingUser) throw new Error("Username or email already exists");
  }

  const passwordHash = username && password ? await bcrypt.hash(password, 10) : null;

  const employee = await prisma.branch_employee.create({
    data: {
      employeeCode,
      firstName:       empData.firstName,
      lastName:        empData.lastName,
      email:           email           ?? null,
      phone:           empData.phone   ?? null,
      gender:          empData.gender  ?? null,
      dateOfBirth:     empData.dateOfBirth ? new Date(empData.dateOfBirth) : null,
      designation:     role.name,
      department:      empData.department  ?? null,
      hireDate:        new Date(empData.hireDate),
      employmentType:  empData.employmentType,
      experienceYears: empData.experienceYears ?? null,
      status:          true,
      branch: { connect: { id: branchId } },
      role:   { connect: { id: roleIdInt } },
      ...(username && passwordHash
        ? {
            user: {
              create: {
                username,
                email,
                passwordHash,
                userType: "BRANCH_EMPLOYEE",
                status:   "ACTIVE",
              },
            },
          }
        : {}),
    },
  });

  return await getEmployeeById(employee.id);
};

// ─── Get all employees ────────────────────────────────────────────────────────

const getAllEmployees = async (actingUser, filters = {}) => {
  const branchAdminRole = await prisma.role.findUnique({ where: { name: "BRANCH_ADMIN" } });
  const where = branchAdminRole ? { roleId: { not: branchAdminRole.id } } : {};

  if (actingUser.userType === "BRANCH_EMPLOYEE") {
    const emp = await prisma.branch_employee.findUnique({
      where: { userId: actingUser.id },
      include: { role: true },
    });
    if (!emp || emp.role.name !== "BRANCH_ADMIN") throw new Error("Only branch admins can list employees");
    where.branchId = emp.branchId;
  } else if (actingUser.userType === "SUPER_ADMIN_STAFF") {
    const staff = await prisma.super_admin_staff.findUnique({
      where: { userId: actingUser.id },
      include: { role: true },
    });
    if (!staff) throw new Error("Staff not found");

    if (staff.role.name !== "SUPER_ADMIN") {
      const access = await prisma.staff_branch_access.findMany({
        where: { superAdminStaffId: staff.id },
        select: { branchId: true },
      });
      where.branchId = { in: access.map((a) => a.branchId) };
    }
  }

  if (filters.branchId)       where.branchId       = Number(filters.branchId);
  if (filters.status !== undefined) where.status   = filters.status === "true";
  if (filters.employmentType) where.employmentType = filters.employmentType;

  return await prisma.branch_employee.findMany({
    where,
    include: {
      role:   true,
      branch: { select: { id: true, branchName: true, branchCode: true } },
      user:   { select: { id: true, username: true, status: true } },
      salary: true,
    },
    orderBy: { id: "asc" },
  });
};

// ─── Update employee ──────────────────────────────────────────────────────────

const updateEmployee = async (id, data, actingUser) => {
  const emp = await getEmployeeById(id);
  await assertBranchAccess(actingUser, emp.branchId);

  const { username, password, userStatus, email, roleId, ...rest } = data;

  const empFields = ["firstName","lastName","phone","department",
    "employmentType","experienceYears","gender","dateOfBirth","hireDate","status","branchId"];

  const empUpdate = {};
  for (const field of empFields) {
    if (rest[field] !== undefined) {
      empUpdate[field] = (field === "dateOfBirth" || field === "hireDate")
        ? new Date(rest[field]) : rest[field];
    }
  }
  if (email  !== undefined) empUpdate.email  = email;
  if (roleId !== undefined) {
    const role = await prisma.role.findUnique({ where: { id: Number(roleId) } });
    if (!role) throw new Error("Role not found");
    empUpdate.roleId      = Number(roleId);
    empUpdate.designation = role.name;
  }

  const userUpdate = {};
  if (username !== undefined) {
    if (username !== emp.user?.username) {
      const taken = await prisma.user.findUnique({ where: { username } });
      if (taken) throw new Error("Username already taken");
    }
    userUpdate.username = username;
  }
  if (email !== undefined) {
    if (email !== emp.user?.email) {
      const taken = await prisma.user.findUnique({ where: { email } });
      if (taken) throw new Error("Email already in use by another account");
    }
    userUpdate.email = email;
  }
  if (userStatus !== undefined) userUpdate.status = userStatus;

  const ops = [prisma.branch_employee.update({ where: { id }, data: empUpdate })];

  if (emp.user && Object.keys(userUpdate).length > 0) {
    ops.push(prisma.user.update({ where: { id: emp.user.id }, data: userUpdate }));
  } else if (!emp.user && Object.keys(userUpdate).length > 0) {
    throw new Error("This employee has no login account. Cannot update username/email/status.");
  }

  await prisma.$transaction(ops);
  return await getEmployeeById(id);
};

// ─── Soft delete ──────────────────────────────────────────────────────────────

const deleteEmployee = async (id, actingUser) => {
  const emp = await getEmployeeById(id);
  await assertBranchAccess(actingUser, emp.branchId);
  return await prisma.branch_employee.update({ where: { id }, data: { status: false } });
};

// ─── Salary ───────────────────────────────────────────────────────────────────

const addOrUpdateSalary = async (employeeId, salaryData) => {
  await getEmployeeById(employeeId);
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

// ─── Change own password ──────────────────────────────────────────────────────

const changeOwnPassword = async (userId, { currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) throw new Error("Current password is incorrect");
  if (currentPassword === newPassword) throw new Error("New password must be different from current password");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return { message: "Password changed successfully" };
};

module.exports = {
  createEmployee, getAllEmployees, getEmployeeById,
  updateEmployee, deleteEmployee,
  addOrUpdateSalary, getSalary,
  changeOwnPassword,
};
