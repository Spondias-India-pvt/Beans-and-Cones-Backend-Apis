const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


const sendOtpEmail = async (to, otp, name = "User") => {
  await transporter.sendMail({
    from:    `"Beans & Cones" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Password Reset OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #4a2c2a;">Beans & Cones</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>You requested a password reset. Use the OTP below:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4a2c2a; text-align: center; padding: 16px 0;">
          ${otp}
        </div>
        <p style="color: #888;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <p style="color: #888;">If you did not request this, ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { sendOtpEmail };
