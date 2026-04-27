const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");

// ─── Auto-generate staff code: SA-0001, SA-0002 ... ──────────────────────────

const generateStaffCode = async () => {
  const count = await prisma.super_admin_staff.count();
  return `SA-${String(count + 1).padStart(4, "0")}`;
};

// ─── helpers ──────────────────────────────────────────────────────────────────

const getSuperAdminRole = async () => {
  const r = await prisma.role.findUnique({ where: { name: "SUPER_ADMIN" } });
  if (!r) throw new Error("SUPER_ADMIN role not found. Run npm run seed first.");
  return r;
};

const getStaffById = async (id) => {
  const staff = await prisma.super_admin_staff.findUnique({
    where: { id },
    include: {
      role: true,
      user: { select: { id: true, username: true, email: true, status: true, lastLogin: true } },
      branchAccess: {
        include: { branch: { select: { id: true, branchName: true, branchCode: true } } },
      },
    },
  });
  if (!staff) throw new Error("Staff not found");
  return staff;
};

// ─── Bootstrap (fallback — normally handled by npm run seed) ─────────────────

const bootstrapSuperAdmin = async () => {
  await seedRoles();
  const superAdminRole = await getSuperAdminRole();

  const existing = await prisma.super_admin_staff.findFirst({ where: { roleId: superAdminRole.id } });
  if (existing) return { message: "Super admin already exists" };

  const password     = process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@123";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      username:     process.env.SUPER_ADMIN_USERNAME || "superadmin",
      email:        process.env.SUPER_ADMIN_EMAIL    || "admin@beanscones.com",
      passwordHash,
      userType:     "SUPER_ADMIN_STAFF",
      status:       "ACTIVE",
      superAdminStaff: {
        create: {
          staffCode:      "SA001",
          firstName:      "Super",
          lastName:       "Admin",
          designation:    "SUPER_ADMIN",
          hireDate:       new Date(),
          employmentType: "FULL_TIME",
          role:           { connect: { id: superAdminRole.id } },
        },
      },
    },
  });

  return {
    message:  "Super admin created.",
    username: process.env.SUPER_ADMIN_USERNAME,
    email:    process.env.SUPER_ADMIN_EMAIL,
    password: process.env.SUPER_ADMIN_PASSWORD,
  };
};

// ─── Profile ──────────────────────────────────────────────────────────────────

const getSuperAdminProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, username: true, email: true,
      userType: true, status: true, lastLogin: true, createdAt: true,
      superAdminStaff: {
        select: {
          id: true, staffCode: true, firstName: true, lastName: true,
          phone: true, designation: true, createdAt: true,
          role: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!user) throw new Error("User not found");
  return user;
};

const updateSuperAdminProfile = async (userId, data) => {
  const { username, email, firstName, lastName, phone, designation } = data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { superAdminStaff: true },
  });
  if (!user) throw new Error("User not found");

  if (username && username !== user.username) {
    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) throw new Error("Username already taken");
  }
  if (email && email !== user.email) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new Error("Email already in use");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        ...(username && { username }),
        ...(email    && { email }),
      },
    }),
    prisma.super_admin_staff.update({
      where: { id: user.superAdminStaff.id },
      data: {
        ...(firstName   && { firstName }),
        ...(lastName    && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(designation && { designation }),
      },
    }),
  ]);

  return await getSuperAdminProfile(userId);
};

// ─── Change password ──────────────────────────────────────────────────────────

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) throw new Error("Current password is incorrect");
  if (currentPassword === newPassword) throw new Error("New password must be different");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return { message: "Password changed successfully" };
};

// ─── Roles ────────────────────────────────────────────────────────────────────

const seedRoles = async () => {
  const roles = [
    { name: "BRANCH_ADMIN",  description: "Admin of a single branch" },
    { name: "CASHIER",       description: "Handles cash transactions" },
    { name: "BARISTA",       description: "Prepares beverages" },
    { name: "KITCHEN_STAFF", description: "Prepares food items" },
    { name: "DELIVERY",      description: "Handles deliveries" },
  ];
  const results = [];
  for (const role of roles) {
    const r = await prisma.role.upsert({ where: { name: role.name }, update: {}, create: role });
    results.push(r);
  }
  return results;
};

const createRole = async ({ name, description }) => {
  const existing = await prisma.role.findUnique({ where: { name } });
  if (existing) throw new Error("Role already exists");
  return await prisma.role.create({ data: { name, description } });
};

const getAllRoles = async () => prisma.role.findMany({ orderBy: { id: "asc" } });

const getRoleById = async (id) => {
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) throw new Error("Role not found");
  return role;
};

const updateRole = async (id, data) => {
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) throw new Error("Role not found");
  return await prisma.role.update({ where: { id }, data });
};

const deleteRole = async (id) => {
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) throw new Error("Role not found");
  return await prisma.role.delete({ where: { id } });
};

// ─── Super admin staff CRUD ───────────────────────────────────────────────────

const createStaff = async (userId, data) => {
  const { username, password, email, roleId, ...staffData } = data;

  const roleIdInt = Number(roleId);
  if (!roleId || isNaN(roleIdInt)) throw new Error("roleId must be a valid integer");

  const role = await prisma.role.findUnique({ where: { id: roleIdInt } });
  if (!role) throw new Error("Role not found");
  if (role.name === "SUPER_ADMIN") throw new Error("Cannot create another super admin");

  // Auto-generate staff code
  const staffCode = await generateStaffCode();

  const existingUser = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
  if (existingUser) throw new Error("Username or email already exists");

  const passwordHash = await bcrypt.hash(password, 10);

  const staff = await prisma.super_admin_staff.create({
    data: {
      staffCode,
      firstName:       staffData.firstName,
      lastName:        staffData.lastName,
      phone:           staffData.phone           ?? null,
      gender:          staffData.gender          ?? null,
      dateOfBirth:     staffData.dateOfBirth     ? new Date(staffData.dateOfBirth) : null,
      designation:     role.name,
      department:      staffData.department      ?? null,
      hireDate:        new Date(staffData.hireDate),
      employmentType:  staffData.employmentType,
      experienceYears: staffData.experienceYears ?? null,
      status:          true,
      role: { connect: { id: roleIdInt } },
      user: {
        create: {
          username,
          email,
          passwordHash,
          userType: "SUPER_ADMIN_STAFF",
          status:   "ACTIVE",
        },
      },
    },
  });

  return await getStaffById(staff.id);
};

const getAllStaff = async () => {
  return await prisma.super_admin_staff.findMany({
    include: {
      role: true,
      user: { select: { id: true, username: true, email: true, status: true, lastLogin: true } },
      branchAccess: {
        include: { branch: { select: { id: true, branchName: true, branchCode: true } } },
      },
    },
    orderBy: { id: "asc" },
  });
};

const updateStaff = async (id, data) => {
  const staff = await getStaffById(id);
  const { username, email, userStatus, roleId, ...staffData } = data;

  if (username && username !== staff.user.username) {
    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) throw new Error("Username already taken");
  }
  if (email && email !== staff.user.email) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new Error("Email already in use");
  }
  if (roleId) {
    const role = await prisma.role.findUnique({ where: { id: Number(roleId) } });
    if (!role) throw new Error("Role not found");
    if (role.name === "SUPER_ADMIN") throw new Error("Cannot assign SUPER_ADMIN role to staff");
  }

  const staffFields = ["firstName","lastName","phone","department",
    "employmentType","experienceYears","gender","dateOfBirth","hireDate","status"];

  const staffUpdate = {};
  for (const field of staffFields) {
    if (staffData[field] !== undefined) {
      staffUpdate[field] = (field === "dateOfBirth" || field === "hireDate")
        ? new Date(staffData[field]) : staffData[field];
    }
  }
  if (roleId) {
    const role = await prisma.role.findUnique({ where: { id: Number(roleId) } });
    staffUpdate.roleId      = Number(roleId);
    staffUpdate.designation = role.name;
  }

  const userUpdate = {};
  if (username)   userUpdate.username = username;
  if (email)      userUpdate.email    = email;
  if (userStatus) userUpdate.status   = userStatus;

  const ops = [prisma.super_admin_staff.update({ where: { id }, data: staffUpdate })];
  if (Object.keys(userUpdate).length > 0) {
    ops.push(prisma.user.update({ where: { id: staff.user.id }, data: userUpdate }));
  }

  await prisma.$transaction(ops);
  return await getStaffById(id);
};

const resetStaffPassword = async (id, newPassword) => {
  const staff = await getStaffById(id);
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: staff.user.id }, data: { passwordHash } });
  return { message: "Password reset successfully" };
};

// ─── Branch access ────────────────────────────────────────────────────────────

const grantBranchAccess = async (staffId, branchId) => {
  const staff = await prisma.super_admin_staff.findUnique({ where: { id: staffId }, include: { role: true } });
  if (!staff) throw new Error("Staff not found");
  if (staff.role.name === "SUPER_ADMIN") throw new Error("Super admin already has access to all branches");

  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) throw new Error("Branch not found");

  return await prisma.staff_branch_access.upsert({
    where: { superAdminStaffId_branchId: { superAdminStaffId: staffId, branchId } },
    update: {},
    create: { superAdminStaffId: staffId, branchId },
  });
};

const revokeBranchAccess = async (staffId, branchId) => {
  const access = await prisma.staff_branch_access.findUnique({
    where: { superAdminStaffId_branchId: { superAdminStaffId: staffId, branchId } },
  });
  if (!access) throw new Error("Access record not found");
  return await prisma.staff_branch_access.delete({
    where: { superAdminStaffId_branchId: { superAdminStaffId: staffId, branchId } },
  });
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

const getDashboardStats = async () => {
  const branchAdminRole = await prisma.role.findUnique({ where: { name: "BRANCH_ADMIN" } });

  const [totalBranches, totalBranchEmployees, totalStaff, activeBranches] = await Promise.all([
    prisma.branch.count(),
    prisma.branch_employee.count({
      where: branchAdminRole ? { roleId: { not: branchAdminRole.id } } : {},
    }),
    prisma.super_admin_staff.count(),
    prisma.branch.count({ where: { status: true } }),
  ]);

  const branchStats = await prisma.branch.findMany({
    select: {
      id: true, branchName: true, branchCode: true, status: true,
      _count: { select: { employees: true } },
      employees: {
        where: branchAdminRole ? { roleId: branchAdminRole.id } : {},
        select: { firstName: true, lastName: true },
        take: 1,
      },
    },
  });

  return { totalBranches, totalBranchEmployees, totalStaff, activeBranches, branchStats };
};

module.exports = {
  bootstrapSuperAdmin,
  getSuperAdminProfile, updateSuperAdminProfile, changePassword,
  seedRoles, createRole, getAllRoles, getRoleById, updateRole, deleteRole,
  createStaff, getAllStaff, getStaffById, updateStaff, resetStaffPassword,
  grantBranchAccess, revokeBranchAccess,
  getDashboardStats,
};
