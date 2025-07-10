import { Router } from "express";
import {
  createPaymentIntent,
  handleWebhook,
} from "../controllers/payment.controller";
import { authMiddleware } from "../middlewares/auth.middlware";
import express from "express";

const PaymentRouter = Router();

// ✅ Authenticated users only
PaymentRouter.post("/create-intent", authMiddleware, createPaymentIntent);

// ⚠️ Stripe Webhook: must use raw body, no auth
PaymentRouter.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook
);

export default PaymentRouter;
