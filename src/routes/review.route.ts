import { Router } from "express";
import {
  createReview,
  deleteReview,
  getProductRatingStats,
  getReviewsByProductId,
  updateReview,
} from "../controllers/review.controller";
import { authMiddleware } from "../middlewares/auth.middlware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { UserRole } from "../constants/enum";

const ReviewRouter = Router();

// Public routes
ReviewRouter.get("/product/:productId", getReviewsByProductId);
ReviewRouter.get("/product/:productId/stats", getProductRatingStats);

// Protected routes
ReviewRouter.use(authMiddleware);

ReviewRouter.post("/", roleMiddleware([UserRole.USER]), createReview);
ReviewRouter.put("/:id", roleMiddleware([UserRole.USER]), updateReview);
ReviewRouter.delete(
  "/:id",
  roleMiddleware([UserRole.USER, UserRole.ADMIN]),
  deleteReview
);

export default ReviewRouter;
