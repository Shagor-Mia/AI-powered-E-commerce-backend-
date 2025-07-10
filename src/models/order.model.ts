import mongoose, { Schema } from "mongoose";
import { z } from "zod";

// Zod schema for shipping address
export const shippingAddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

// Zod schema for order status and payment status
export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled"]),
});

// Zod schema for order creation
export const createOrderSchema = z.object({
  shippingAddress: shippingAddressSchema.optional(),
});

// Interfaces
export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOrder {
  _id?: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  total: number;
  status?: "pending" | "confirmed" | "cancelled";
  paymentStatus?: "unpaid" | "paid" | "refunded";
  orderItems: IOrderItem[];
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

// Mongoose schemas
const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { timestamps: true }
);

const orderSchema = new Schema<IOrder>(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>("Order", orderSchema);
