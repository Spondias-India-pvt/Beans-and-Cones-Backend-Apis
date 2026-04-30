const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends a password reset link email.
 * @param {string} to       - Recipient email
 * @param {string} token    - Secure reset token
 * @param {string} name     - Recipient name
 * @param {string} type     - "staff" or "customer"
 */
const sendResetLinkEmail = async (to, token, name = "User", type = "staff") => {
  // Frontend URL — update this to your actual frontend URL
  const baseUrl   = process.env.FRONTEND_URL ;
  const resetLink = `${baseUrl}/reset-password?token=${token}&type=${type}`;

  await transporter.sendMail({
    from:    `"Beans & Cones" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #4a2c2a;">Beans & Cones</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; padding: 24px 0;">
          <a href="${resetLink}"
             style="background-color: #4a2c2a; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #888;">This link is valid for <strong>30 minutes</strong>. Do not share it with anyone.</p>
        <p style="color: #888;">If you did not request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;">
        <p style="color: #aaa; font-size: 12px;">Or copy this link: ${resetLink}</p>
      </div>
    `,
  });
};

module.exports = { sendResetLinkEmail };
