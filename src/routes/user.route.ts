import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/user.controller";
// import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { UserRole } from "../constants/enum";
import { authMiddleware } from "../middlewares/auth.middlware";

const UserRouter = Router();

// Protect all routes with auth
UserRouter.use(authMiddleware);

// GET all users: Admin or Seller
UserRouter.get(
  "/",
  roleMiddleware([UserRole.ADMIN, UserRole.SELLER]),
  getAllUsers
);

// GET single user by ID: Admin or Seller
UserRouter.get(
  "/:id",
  roleMiddleware([UserRole.ADMIN, UserRole.SELLER]),
  getUserById
);

// UPDATE user: Admin only
UserRouter.put("/:id", roleMiddleware([UserRole.ADMIN]), updateUser);

// DELETE user: Admin only
UserRouter.delete("/:id", roleMiddleware([UserRole.ADMIN]), deleteUser);

export default UserRouter;
