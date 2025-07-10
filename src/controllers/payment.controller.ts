import { Request, Response } from "express";
import Stripe from "stripe";
import { UserRole, PaymentStatus } from "../constants/enum";
import orderModel from "../models/order.model";
import { notifyPaymentStatus } from "../services/notification.service";
import { catchAsync } from "../utils/catchAsync";
import { sendError, sendSuccess } from "../utils/dataResponse";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-06-30.basil",
});

// 🎯 Create Stripe Payment Intent
export const createPaymentIntent = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.body;

    if (req.user?.role !== UserRole.USER) {
      sendError(res, "Access denied", 403);
      return;
    }

    const order = await orderModel
      .findById(orderId)
      .populate("orderItems.productId");

    if (!order) {
      sendError(res, "Order not found", 404);
      return;
    }

    if (order.paymentStatus !== PaymentStatus.UNPAID) {
      sendError(res, "Order already paid or refunded", 400);
      return;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // USD cents
      currency: "usd",
      metadata: { orderId: order._id.toString() },
    });

    await notifyPaymentStatus(order, PaymentStatus.UNPAID);
    sendSuccess(res, "Payment intent created", {
      clientSecret: paymentIntent.client_secret,
    });
  }
);

// 📩 Handle Stripe Webhook Events
export const handleWebhook = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers["stripe-signature"] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.orderId;

      const order = await orderModel.findByIdAndUpdate(
        orderId,
        { paymentStatus: PaymentStatus.PAID, updatedAt: new Date() },
        { new: true }
      );

      if (order) {
        await notifyPaymentStatus(order, PaymentStatus.PAID);
      }
    }

    res.json({ received: true });
  }
);
