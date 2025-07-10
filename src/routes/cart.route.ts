import { Router } from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItem,
} from "../controllers/cart.controller";
import { authMiddleware } from "../middlewares/auth.middlware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { UserRole } from "../constants/enum";

const CartRouter = Router();

//  All routes require authentication and "USER" role
CartRouter.use(authMiddleware, roleMiddleware([UserRole.USER]));

// GET user's cart
CartRouter.get("/", getCart);

// POST add item to cart
CartRouter.post("/", addToCart);

// PUT update item quantity
CartRouter.put("/", updateCartItem);

// DELETE remove item from cart
CartRouter.delete("/:productId", removeFromCart);

export default CartRouter;
