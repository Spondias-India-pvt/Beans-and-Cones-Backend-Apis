const prisma          = require("../config/prisma");
const bcrypt          = require("bcrypt");
const jwt             = require("jsonwebtoken");
const { sendOtpEmail } = require("../utils/email");

// ─── Generate 6-digit OTP ─────────────────────────────────────────────────────
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

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

// ─── Forgot Password — send OTP to email ─────────────────────────────────────

const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("No account found with this email");
  if (user.status !== "ACTIVE") throw new Error("Account is not active");

  const otp       = generateOtp();
  const expiry    = new Date(Date.now() + 2 * 60 * 1000); // 10 minutes

  await prisma.user.update({
    where: { id: user.id },
    data:  { resetOtp: otp, resetOtpExpiry: expiry },
  });

  const name = user.superAdminStaff?.firstName || user.branchEmployee?.firstName || user.username;
  await sendOtpEmail(email, otp, name);

  return { message: "OTP sent to your email" };
};

// ─── Verify OTP ───────────────────────────────────────────────────────────────

const verifyOtp = async (email, otp) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user)            throw new Error("No account found with this email");
  if (!user.resetOtp)   throw new Error("No OTP requested. Please request a new one.");
  if (user.resetOtp !== otp) throw new Error("Invalid OTP");
  if (new Date() > user.resetOtpExpiry) throw new Error("OTP has expired. Please request a new one.");

  return { message: "OTP verified. You can now reset your password.", email };
};

// ─── Reset Password ───────────────────────────────────────────────────────────

const resetPassword = async (email, otp, newPassword) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user)            throw new Error("No account found with this email");
  if (!user.resetOtp)   throw new Error("No OTP requested. Please request a new one.");
  if (user.resetOtp !== otp) throw new Error("Invalid OTP");
  if (new Date() > user.resetOtpExpiry) throw new Error("OTP has expired. Please request a new one.");

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

module.exports = { login, forgotPassword, verifyOtp, resetPassword };
