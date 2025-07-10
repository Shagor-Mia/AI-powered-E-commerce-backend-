import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
import { z } from "zod";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  image?: string;
  address?: string;
  phone?: string;
  role?: "admin" | "seller" | "user";
  isDeleted?: boolean;
  otp?: string | null;
  otpExpires?: Date | null;
  isVerified?: boolean;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  googleId?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

//  Mongoose Schema
const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: String,
    lastName: String,
    image: String,
    address: String,
    phone: String,
    role: { type: String, enum: ["admin", "seller", "user"], default: "user" },
    isDeleted: { type: Boolean, default: false },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    otp: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    isVerified: { type: Boolean, default: false }, // to prevent login until verified
    googleId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

//  Pre-save hash hook
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

//  Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>("User", userSchema);

//  Zod Validation Schemas
export const userRegisterSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  image: z.string().url().optional(),
  role: z.enum(["admin", "seller", "user"]).optional(),
});

export const userLoginSchema = z.object({
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export const userUpdateSchema = userRegisterSchema.partial();
