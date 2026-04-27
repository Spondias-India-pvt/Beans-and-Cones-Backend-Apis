const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");
const jwt    = require("jsonwebtoken");

const login = async ({ username, password }) => {
  const user = await prisma.user.findFirst({
    where: { OR: [{ username }, { email: username }] },
    include: {
      superAdminStaff: {
        include: {
          role: true,
          branchAccess: {
            include: { branch: { select: { id: true, branchName: true, branchCode: true } } },
          },
        },
      },
      branchEmployee: {
        include: {
          role:   true,
          branch: { select: { id: true, branchName: true, branchCode: true } },
        },
      },
    },
  });

  if (!user) throw new Error("Invalid credentials");
  if (user.status !== "ACTIVE") throw new Error("Account is not active");

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new Error("Invalid credentials");

  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

  const token = jwt.sign(
    { userId: user.id, userType: user.userType },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );

  let profile = null;
  if (user.userType === "SUPER_ADMIN_STAFF") {
    const staff = user.superAdminStaff;
    profile = {
      ...staff,
      roleName: staff?.role?.name,
      accessibleBranches:
        staff?.role?.name === "SUPER_ADMIN"
          ? "ALL"
          : staff?.branchAccess?.map((a) => a.branch) || [],
    };
  } else {
    profile = {
      ...user.branchEmployee,
      roleName: user.branchEmployee?.role?.name,
    };
  }

  return {
    token,
    user: {
      id:       user.id,
      username: user.username,
      email:    user.email,
      userType: user.userType,
      status:   user.status,
      profile,
    },
  };
};

module.exports = { login };
