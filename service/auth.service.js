const prisma                 = require("../config/prisma");
const bcrypt                 = require("bcrypt");
const jwt                    = require("jsonwebtoken");
const crypto                 = require("crypto");
const { sendResetLinkEmail } = require("../utils/email");

// ─── Generate secure random token ────────────────────────────────────────────
const generateResetToken = () => crypto.randomBytes(32).toString("hex");

// ─── Login ────────────────────────────────────────────────────────────────────

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

  if (!user)                    throw new Error("Invalid credentials");
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

// ─── Step 1: Forgot Password — generate token + send reset link ───────────────

const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("No account found with this email");
  if (user.status !== "ACTIVE") throw new Error("Account is not active");

  const resetToken = generateResetToken();
  const expiry     = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  // Store token (reusing resetOtp field for the token string)
  await prisma.user.update({
    where: { id: user.id },
    data:  { resetOtp: resetToken, resetOtpExpiry: expiry },
  });

  const name = user.username;
  await sendResetLinkEmail(email, resetToken, name, "staff");

  return { message: "Password reset link sent to your email. Valid for 30 minutes." };
};

// ─── Step 2: Validate token (frontend calls this when user clicks the link) ───

const validateResetToken = async (token) => {
  const user = await prisma.user.findFirst({ where: { resetOtp: token } });
  if (!user)                          throw new Error("Invalid or expired reset link");
  if (new Date() > user.resetOtpExpiry) throw new Error("Reset link has expired. Please request a new one.");

  return { message: "Token is valid. You can now reset your password.", email: user.email };
};

// ─── Step 3: Reset Password using token ──────────────────────────────────────

const resetPassword = async (token, newPassword) => {
  const user = await prisma.user.findFirst({ where: { resetOtp: token } });
  if (!user)                          throw new Error("Invalid or expired reset link");
  if (new Date() > user.resetOtpExpiry) throw new Error("Reset link has expired. Please request a new one.");

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data:  {
      passwordHash,
      resetOtp:       null,
      resetOtpExpiry: null,
    },
  });

  return { message: "Password reset successfully. You can now login." };
};

module.exports = { login, forgotPassword, validateResetToken, resetPassword };
