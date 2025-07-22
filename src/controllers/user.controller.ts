import { Request, Response } from "express";
import userModel from "../models/user.model";
import { catchAsync } from "../utils/catchAsync";
import { sendSuccess, sendError } from "../utils/dataResponse";
import { UserRole } from "../constants/enum";
import { uploadToCloudinary } from "../utils/cloudinary";
import {
  updateUserProfileSchema,
  updateUserRoleSchema,
} from "../validation/user.validation"; // Assuming you'll create this validation schema

//
// Get All Users (Admin only)
export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  // Ensure only admins can access this route
  if (req.user?.role !== UserRole.ADMIN) {
    return sendError(
      res,
      "Forbidden: Only administrators can view all users.",
      403
    );
  }

  const users = await userModel
    .find({ isDeleted: false })
    .select("-password -otp -otpExpires");
  sendSuccess(res, "Users retrieved successfully", users);
});

//
// Get Single User (User can view their own, Admin can view any)
export const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;

  // A regular user can only view their own profile
  if (req.user?.role !== UserRole.ADMIN && req.user?.userId !== userId) {
    return sendError(
      res,
      "Forbidden: You can only view your own profile.",
      403
    );
  }

  const user = await userModel
    .findOne({ _id: userId, isDeleted: false })
    .select("-password -otp -otpExpires");

  if (!user) {
    return sendError(res, "User not found", 404);
  }

  sendSuccess(res, "User retrieved successfully", user);
});

//
// Update User Profile (User can update their own, Admin can update any)
export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;

  // A regular user can only update their own profile
  if (req.user?.role !== UserRole.ADMIN && req.user?.userId !== userId) {
    return sendError(
      res,
      "Forbidden: You can only update your own profile.",
      403
    );
  }

  const user = await userModel.findOne({ _id: userId, isDeleted: false });
  if (!user) {
    return sendError(res, "User not found", 404);
  }

  // Admin can update roles, but regular users cannot
  if (req.user?.role !== UserRole.ADMIN && req.body.role) {
    return sendError(res, "Forbidden: You cannot change your role.", 403);
  }

  // Use Zod schema for validation
  const validated = await updateUserProfileSchema.parseAsync(req.body);
  const { firstName, lastName, address, phone } = validated;

  let imageUrl: string | undefined;
  if (req.file) {
    const { url } = await uploadToCloudinary(req.file.path);
    imageUrl = url;
  }

  user.firstName = firstName || user.firstName;
  user.lastName = lastName || user.lastName;
  user.address = address || user.address;
  user.phone = phone || user.phone;
  if (imageUrl) user.image = imageUrl;

  // Only admin can update the role
  if (req.user?.role === UserRole.ADMIN && req.body.role) {
    const roleValidated = await updateUserRoleSchema.parseAsync({
      role: req.body.role,
    });
    user.role = roleValidated.role;
  }

  await user.save();

  sendSuccess(res, "User profile updated successfully", {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    address: user.address,
    phone: user.phone,
    image: user.image,
    role: user.role,
  });
});

//
// Delete User (Admin only)
export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;

  // Ensure only admins can delete users
  if (req.user?.role !== UserRole.ADMIN) {
    return sendError(
      res,
      "Forbidden: Only administrators can delete users.",
      403
    );
  }

  // Prevent admin from deleting themselves
  if (req.user.userId === userId) {
    return sendError(res, "You cannot delete your own admin account.", 400);
  }

  const user = await userModel.findOne({ _id: userId, isDeleted: false });

  if (!user) {
    return sendError(res, "User not found", 404);
  }

  user.isDeleted = true; // Soft delete
  await user.save();

  sendSuccess(res, "User deleted successfully");
});
