import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
// import { z } from "zod";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password?: string;
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
    password: { type: String, required: false },
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

// Pre-save hash hook
userSchema.pre<IUser>("save", async function (next) {
  // Only hash if password exists AND it's modified
  if (this.password && this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  // If the user doesn't have a password set (e.g., Google sign-up),
  // they cannot compare a candidate password.
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>("User", userSchema);
