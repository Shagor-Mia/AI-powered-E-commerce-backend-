import { Request, Response } from "express";
import jwt, { Secret } from "jsonwebtoken";
import crypto from "crypto";
import userModel from "../models/user.model";
import { UserRole } from "../constants/enum";
import { catchAsync } from "../utils/catchAsync";
import { sendSuccess, sendError } from "../utils/dataResponse";
import { uploadToCloudinary } from "../utils/cloudinary";
import { sendOtpEmail } from "../services/email.service";
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
} from "../validation/auth.validation";

//
// Register
export const register = catchAsync(async (req: Request, res: Response) => {
  const validated = await registerSchema.parseAsync(req.body);
  const { email, password, firstName, lastName, address, phone, role } =
    validated;

  const existingUser = await userModel.findOne({ email });

  if (existingUser && existingUser.isVerified) {
    return sendError(res, "Email already registered", 400);
  }

  const otp = crypto.randomInt(100000, 999999).toString();

  let imageUrl: string | undefined;
  if (req.file) {
    const { url } = await uploadToCloudinary(req.file.path);
    imageUrl = url;
  }

  let user = existingUser;
  if (!user) {
    user = new userModel({
      email,
      password,
      firstName,
      lastName,
      address,
      phone,
      image: imageUrl,
      role: role || UserRole.USER,
      isVerified: false,
    });
  } else {
    user.password = password;
    user.firstName = firstName;
    user.lastName = lastName;
    user.address = address;
    user.phone = phone;
    user.role = role || user.role;
    if (imageUrl) user.image = imageUrl;
  }

  user.otp = otp;
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  await sendOtpEmail(email, otp, "register");

  sendSuccess(
    res,
    "OTP sent to email. Please verify to complete registration."
  );
});

//
// Verify Register OTP
export const verifyRegisterOtp = catchAsync(
  async (req: Request, res: Response) => {
    const { email, otp } = await verifyOtpSchema.parseAsync(req.body);

    const user = await userModel.findOne({ email, isDeleted: false });
    if (!user || user.isVerified) {
      return sendError(res, "Invalid request or already verified", 400);
    }

    if (!user.otp || user.otp !== otp || user.otpExpires! < new Date()) {
      return sendError(res, "Invalid or expired OTP", 400);
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      process.env.JWT_ACCESS_SECRET as Secret,
      { expiresIn: "1h" }
    );

    sendSuccess(res, "Registration completed successfully", {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        image: user.image,
      },
    });
  }
);

//
// Login
export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = await loginSchema.parseAsync(req.body);

  const user = await userModel.findOne({ email, isDeleted: false });
  if (!user || !(await user.comparePassword(password))) {
    return sendError(res, "Invalid credentials", 400);
  }

  if (!user.isVerified) {
    return sendError(res, "Please verify your email first.", 403);
  }

  req.session.userId = user._id.toString();
  // req.session.role = user.role as UserRole;
  req.session.role = user.role;

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_ACCESS_SECRET as Secret,
    {
      expiresIn: Number(process.env.JWT_ACCESS_EXPIRES_IN) || "1h",
    }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60,
  });

  sendSuccess(res, "Login successful", {
    user: { id: user._id, email, role: user.role },
  });
});

//
// Logout
export const logout = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return sendError(res, "Logout failed", 500);
    }
    res.clearCookie("connect.sid");
    res.clearCookie("token");
    sendSuccess(res, "Logged out successfully");
  });
};

//
// Forgot Password
export const forgotPassword = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = await forgotPasswordSchema.parseAsync(req.body);

    const user = await userModel.findOne({
      email,
      isDeleted: false,
      isVerified: true,
    });
    if (!user) return sendSuccess(res, "If email exists, OTP has been sent");

    const otp = crypto.randomInt(100000, 999999).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOtpEmail(email, otp, "reset");
    sendSuccess(res, "OTP sent to your email.");
  }
);

//
// Reset Password
export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = await resetPasswordSchema.parseAsync(
    req.body
  );

  const user = await userModel.findOne({ email, isDeleted: false });
  if (!user || !user.otp || user.otp !== otp || user.otpExpires! < new Date()) {
    return sendError(res, "Invalid or expired OTP", 400);
  }

  user.password = newPassword;
  user.otp = null;
  user.otpExpires = null;
  await user.save();

  sendSuccess(res, "Password reset successful.");
});

//
// Google OAuth callback (issue JWT)
export const googleCallback = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.redirect("/auth/failed");
    }

    const user = req.user as any;

    req.session.userId = user._id.toString();
    req.session.role = user.role;

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_ACCESS_SECRET as Secret,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60,
    });

    // You can redirect to frontend and pass token as query param if needed
    res.redirect(`http://localhost:3000?token=${token}`);
  }
);
