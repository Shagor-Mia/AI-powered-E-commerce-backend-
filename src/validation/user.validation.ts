import { z } from "zod";
import { UserRole } from "../constants/enum"; // Make sure to import UserRole

export const updateUserProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  // image will be handled via req.file, not directly in the body for validation
});

export const updateUserRoleSchema = z.object({
  role: z.enum([UserRole.ADMIN, UserRole.SELLER, UserRole.USER]),
});
