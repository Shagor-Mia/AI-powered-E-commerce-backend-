import { Request, Response } from "express";
import mongoose from "mongoose";
import cartModel, {
  addToCartZodSchema,
  updateCartItemZodSchema,
} from "../models/cart.model";
import { UserRole } from "../constants/enum";
import { catchAsync } from "../utils/catchAsync";
import { sendError, sendSuccess } from "../utils/dataResponse";

// GET cart
export const getCart = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (req.user?.role !== UserRole.USER) {
      sendError(res, "Access denied", 403);
      return;
    }

    const cart = await cartModel
      .findOne({ buyerId: req.user.userId })
      .populate("items.productId");

    if (!cart) {
      sendError(res, "Cart not found", 404);
      return;
    }

    sendSuccess(res, "Cart fetched successfully", cart);
  }
);

// ADD to cart
export const addToCart = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (req.user?.role !== UserRole.USER) {
      sendError(res, "Access denied", 403);
      return;
    }

    const parse = addToCartZodSchema.safeParse(req.body);
    if (!parse.success) {
      sendError(res, parse.error.errors[0].message, 400);
      return;
    }

    const { productId, quantity } = parse.data;
    let cart = await cartModel.findOne({ buyerId: req.user.userId });

    if (!cart) {
      cart = new cartModel({
        buyerId: req.user.userId,
        items: [{ productId, quantity }],
      });
    } else {
      const itemIndex = cart.items.findIndex((item) =>
        item.productId.equals(productId)
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({ productId, quantity });
      }
    }

    await cart.save();
    sendSuccess(res, "Item added to cart", cart);
  }
);

// UPDATE cart item
export const updateCartItem = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (req.user?.role !== UserRole.USER) {
      sendError(res, "Access denied", 403);
      return;
    }

    const parse = updateCartItemZodSchema.safeParse(req.body);
    if (!parse.success) {
      sendError(res, parse.error.errors[0].message, 400);
      return;
    }

    const { productId, quantity } = parse.data;
    const cart = await cartModel.findOne({ buyerId: req.user.userId });

    if (!cart) {
      sendError(res, "Cart not found", 404);
      return;
    }

    const itemIndex = cart.items.findIndex((item) =>
      item.productId.equals(productId)
    );

    if (itemIndex === -1) {
      sendError(res, "Item not found in cart", 404);
      return;
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    sendSuccess(res, "Cart item updated", cart);
  }
);

// REMOVE item from cart
export const removeFromCart = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (req.user?.role !== UserRole.USER) {
      sendError(res, "Access denied", 403);
      return;
    }

    const productId = new mongoose.Types.ObjectId(req.params.productId);
    const cart = await cartModel.findOne({ buyerId: req.user.userId });

    if (!cart) {
      sendError(res, "Cart not found", 404);
      return;
    }

    cart.items = cart.items.filter((item) => !item.productId.equals(productId));
    await cart.save();

    sendSuccess(res, "Item removed from cart", cart);
  }
);
