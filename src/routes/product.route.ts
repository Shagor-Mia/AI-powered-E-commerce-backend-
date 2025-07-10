// routes/product.route.ts

import { Router } from "express";
import {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  getSingleProduct,
} from "../controllers/product.controller";
import { authMiddleware } from "../middlewares/auth.middlware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { UserRole } from "../constants/enum";
import { upload } from "../middlewares/upload.middleware";

const ProductRouter = Router();

// Public route to get all products
ProductRouter.get("/", getProducts);
ProductRouter.get("/:id", getSingleProduct);

// Protected routes
ProductRouter.use(authMiddleware);

// Create product (SELLER or ADMIN)
ProductRouter.post(
  "/",
  upload.array("images"),
  roleMiddleware([UserRole.SELLER]),
  createProduct
);

// Update product (SELLER for own product)
ProductRouter.put(
  "/:id",
  upload.array("images"),
  roleMiddleware([UserRole.SELLER]),
  updateProduct
);

// Soft delete product (SELLER for own product)
ProductRouter.delete("/:id", roleMiddleware([UserRole.SELLER]), deleteProduct);

export default ProductRouter;
