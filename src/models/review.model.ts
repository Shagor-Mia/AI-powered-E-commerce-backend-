import mongoose, { Schema } from "mongoose";
import { z } from "zod";

export interface IReview {
  productId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
  },
  { timestamps: true }
);

//  Zod schema for input validation
export const ReviewValidationSchema = z.object({
  productId: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), {
    message: "Invalid productId",
  }),
  rating: z
    .number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  comment: z.string().optional(),
});

export default mongoose.model<IReview>("Review", reviewSchema);
