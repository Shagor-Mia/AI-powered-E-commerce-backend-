import mongoose, { Schema } from "mongoose";
import { z } from "zod";

// ✅ TypeScript Interface for product image
export interface IProductImage {
  url: string;
  public_id: string;
}

// ✅ TypeScript Interface for Product
export interface IProduct {
  name: string;
  description?: string;
  price: number;
  stock: number;
  images: IProductImage[]; // Multiple images from Cloudinary
  categoryId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ✅ Zod validation schema for product creation/update
export const productSchemaValidation = z.object({
  name: z.string().min(1, { message: "Product name is required" }),
  description: z.string().optional(),
  price: z.number().min(0, { message: "Price must be 0 or more" }),
  stock: z.number().int().min(0, { message: "Stock must be 0 or more" }),
  categoryId: z.string().min(1, { message: "Category is required" }),
});

// ✅ Mongoose schema
const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IProduct>("Product", productSchema);
