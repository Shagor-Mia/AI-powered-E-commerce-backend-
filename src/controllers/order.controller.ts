import { Request, Response } from "express";
import { UserRole, OrderStatus, PaymentStatus } from "../constants/enum";
import cartModel from "../models/cart.model";
import orderModel, {
  createOrderSchema,
  updateOrderStatusSchema,
} from "../models/order.model";
import { notifyOrderStatus } from "../services/notification.service";
import { IProduct } from "../models/product.model";
import { catchAsync } from "../utils/catchAsync";
import { sendError, sendSuccess } from "../utils/dataResponse";

// 📦 Create Order
export const createOrder = catchAsync(async (req: Request, res: Response) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(
      res,
      "Validation failed",
      400,
      parsed.error.flatten().fieldErrors
    );
  }

  if (req.user?.role !== UserRole.USER) {
    return sendError(res, "Access denied", 403);
  }

  const cart = await cartModel
    .findOne({ buyerId: req.user.userId })
    .populate("items.productId");

  if (!cart || cart.items.length === 0) {
    return sendError(res, "Cart is empty", 400);
  }

  let total = 0;
  const orderItems = cart.items.map((item) => {
    const product = item.productId as unknown as IProduct;
    total += product.price * item.quantity;
    return {
      productId: item.productId,
      quantity: item.quantity,
      price: product.price,
    };
  });

  const order = new orderModel({
    buyerId: req.user.userId,
    total,
    status: OrderStatus.PENDING,
    paymentStatus: PaymentStatus.UNPAID,
    orderItems,
    shippingAddress: parsed.data.shippingAddress,
  });

  await order.save();
  await cartModel.findOneAndUpdate({ buyerId: req.user.userId }, { items: [] });

  await notifyOrderStatus(order, OrderStatus.PENDING);
  sendSuccess(res, "Order created successfully", order, 201);
});

// 📄 Get Orders
export const getOrders = catchAsync(async (req: Request, res: Response) => {
  if (req.user?.role === UserRole.USER) {
    const orders = await orderModel
      .find({ buyerId: req.user.userId })
      .populate("orderItems.productId");
    return sendSuccess(res, "Orders fetched successfully", orders);
  }

  if (
    req.user &&
    (req.user.role === UserRole.SELLER || req.user.role === UserRole.ADMIN)
  ) {
    const orders = await orderModel
      .find()
      .populate("orderItems.productId buyerId");
    return sendSuccess(res, "Orders fetched successfully", orders);
  }

  sendError(res, "Access denied", 403);
});

// 🔄 Update Order Status
export const updateOrderStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const parsed = updateOrderStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(
        res,
        "Validation failed",
        400,
        parsed.error.flatten().fieldErrors
      );
    }

    if (
      !req.user ||
      (req.user.role !== UserRole.SELLER && req.user.role !== UserRole.ADMIN)
    ) {
      return sendError(res, "Access denied", 403);
    }

    const order = await orderModel
      .findByIdAndUpdate(
        id,
        { status: parsed.data.status, updatedAt: new Date() },
        { new: true }
      )
      .populate("orderItems.productId buyerId");

    if (!order) {
      return sendError(res, "Order not found", 404);
    }

    await notifyOrderStatus(order, parsed.data.status as OrderStatus);
    sendSuccess(res, "Order status updated successfully", order);
  }
);
