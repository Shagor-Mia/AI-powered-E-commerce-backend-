import nodemailer from "nodemailer";

export const sendOtpEmail = async (
  email: string,
  otp: string,
  purpose: "register" | "reset"
) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const subject =
    purpose === "register"
      ? "Complete Your Registration"
      : "Reset Your Password";
  const actionText =
    purpose === "register"
      ? "Enter this OTP to complete your registration"
      : "Enter this OTP to reset your password";

  const html = `<p>${actionText}: <strong>${otp}</strong></p><p>This code will expire in 10 minutes.</p>`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html,
  });
};
