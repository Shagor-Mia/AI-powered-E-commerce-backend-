// src/models/cart.model.ts
import mongoose, { Schema } from "mongoose";
import { z } from "zod";

export interface ICartItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
}

export interface ICart {
  buyerId: mongoose.Types.ObjectId;
  items: ICartItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId",
  })
  .transform((val) => new mongoose.Types.ObjectId(val));

// ✅ Zod validation schema embedded here
export const cartItemSchemaZ = z.object({
  productId: objectIdSchema,
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

export const addToCartZodSchema = cartItemSchemaZ;

export const updateCartItemZodSchema = cartItemSchemaZ;

export const removeCartItemZodSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
});

// ✅ Mongoose Schema
const cartSchema = new Schema<ICart>(
  {
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<ICart>("Cart", cartSchema);
