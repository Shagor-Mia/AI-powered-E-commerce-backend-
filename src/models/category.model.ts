// src/validations/category.validation.ts
import { z } from "zod";
import mongoose, { Schema } from "mongoose";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").optional(),
});
// src/models/category.model.ts

export interface ICategory {
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export default mongoose.model<ICategory>("Category", categorySchema);
