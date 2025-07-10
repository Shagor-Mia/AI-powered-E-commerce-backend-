import { Router } from "express";
import {
  createOrder,
  getOrders,
  updateOrderStatus,
} from "../controllers/order.controller";
import { authMiddleware } from "../middlewares/auth.middlware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { UserRole } from "../constants/enum";

const OrderRouter = Router();

// 🔒 Protect all order routes
OrderRouter.use(authMiddleware);

// 📦 Create Order - USER only
OrderRouter.post("/", roleMiddleware([UserRole.USER]), createOrder);

// 📄 Get Orders - USER, SELLER, ADMIN
OrderRouter.get(
  "/",
  roleMiddleware([UserRole.USER, UserRole.SELLER, UserRole.ADMIN]),
  getOrders
);

// 🔄 Update Order Status - SELLER, ADMIN only
OrderRouter.patch(
  "/:id/status",
  roleMiddleware([UserRole.SELLER, UserRole.ADMIN]),
  updateOrderStatus
);

export default OrderRouter;
