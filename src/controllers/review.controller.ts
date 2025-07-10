import { Request, Response } from "express";
import { UserRole } from "../constants/enum";
import reviewModel, { ReviewValidationSchema } from "../models/review.model";
import { notifyNewReview } from "../services/notification.service";
import { catchAsync } from "../utils/catchAsync";
import { sendError, sendSuccess } from "../utils/dataResponse";

// ✅ Create Review
export const createReview = catchAsync(async (req: Request, res: Response) => {
  if (req.user?.role !== UserRole.USER) {
    sendError(res, "Access denied", 403);
    return;
  }

  const result = ReviewValidationSchema.safeParse(req.body);
  if (!result.success) {
    sendError(
      res,
      "Validation failed",
      400,
      result.error.flatten().fieldErrors
    );
    return;
  }

  const { productId, rating, comment } = result.data;

  const existingReview = await reviewModel.findOne({
    productId,
    userId: req.user.userId,
  });

  if (existingReview) {
    sendError(res, "You already reviewed this product", 400);
    return;
  }

  const review = new reviewModel({
    productId,
    userId: req.user.userId,
    rating,
    comment,
  });

  await review.save();
  await notifyNewReview(review);

  sendSuccess(res, "Review created successfully", review, 201);
});

// ✏️ Update Review (only by reviewer)
export const updateReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = ReviewValidationSchema.partial().safeParse(req.body);
  if (!result.success) {
    sendError(
      res,
      "Validation failed",
      400,
      result.error.flatten().fieldErrors
    );
    return;
  }

  const review = await reviewModel.findById(id);
  if (!review) {
    sendError(res, "Review not found", 404);
    return;
  }

  if (review.userId.toString() !== req.user?.userId) {
    sendError(res, "You can only update your own review", 403);
    return;
  }

  Object.assign(review, result.data, { updatedAt: new Date() });
  await review.save();

  sendSuccess(res, "Review updated successfully", review);
});

// ❌ Delete Review (user or admin)
export const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const review = await reviewModel.findById(id);
  if (!review) {
    sendError(res, "Review not found", 404);
    return;
  }

  if (
    review.userId.toString() !== req.user?.userId &&
    req.user?.role !== UserRole.ADMIN
  ) {
    sendError(res, "Access denied", 403);
    return;
  }

  await review.deleteOne();
  sendSuccess(res, "Review deleted successfully");
});

// 📄 Get Reviews for a Product (public)
export const getReviewsByProductId = catchAsync(
  async (req: Request, res: Response) => {
    const { productId } = req.params;

    const reviews = await reviewModel
      .find({ productId })
      .populate("userId", "name email");

    sendSuccess(res, "Reviews fetched successfully", reviews);
  }
);

// ⭐ Get Average Rating by Product ID
export const getProductRatingStats = catchAsync(
  async (req: Request, res: Response) => {
    const { productId } = req.params;

    const stats = await reviewModel.aggregate([
      { $match: { productId } },
      {
        $group: {
          _id: "$productId",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (stats.length === 0) {
      sendSuccess(res, "No reviews yet", { averageRating: 0, totalReviews: 0 });
      return;
    }

    sendSuccess(res, "Rating statistics", stats[0]);
  }
);
