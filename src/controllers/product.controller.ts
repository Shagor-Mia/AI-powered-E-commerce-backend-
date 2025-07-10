import { Request, Response } from "express";
import productModel, {
  IProductImage,
  productSchemaValidation,
} from "../models/product.model";
import { UserRole } from "../constants/enum";
import { notifyNewProduct } from "../services/notification.service";
import { catchAsync } from "../utils/catchAsync";
import { sendSuccess, sendError } from "../utils/dataResponse";
import {
  deleteFromCloudinary,
  uploadMultipleToCloudinary,
} from "../utils/cloudinary";

// ✅ Get all products (public)
export const getProducts = catchAsync(async (_req: Request, res: Response) => {
  const products = await productModel
    .find({ isDeleted: false })
    .populate("categoryId sellerId");

  sendSuccess(res, "Products fetched successfully", products);
});

// ✅ Get single products (public)
export const getSingleProduct = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const product = await productModel
      .findOne({ _id: id, isDeleted: false })
      .populate("categoryId sellerId");

    if (!product) {
      return sendError(res, "Product not found", 404);
    }

    sendSuccess(res, "Product fetched successfully", product);
  }
);

// ✅ Create product (SELLER only)
export const createProduct = catchAsync(async (req: Request, res: Response) => {
  if (req.user?.role !== UserRole.SELLER) {
    return sendError(res, "Only sellers can create products", 403);
  }

  const validation = productSchemaValidation.safeParse(req.body);
  if (!validation.success) {
    return sendError(
      res,
      "Product validation failed",
      400,
      validation.error.flatten().fieldErrors
    );
  }

  let images: IProductImage[] = [];
  if (req.files && Array.isArray(req.files)) {
    images = await uploadMultipleToCloudinary(
      req.files as Express.Multer.File[]
    );
  }

  const product = new productModel({
    ...validation.data,
    images,
    sellerId: req.user.userId,
  });

  await product.save();
  sendSuccess(res, "Product created", product, 201);
});

// ✅ Update product (SELLER only)
export const updateProduct = catchAsync(async (req: Request, res: Response) => {
  if (req.user?.role !== UserRole.SELLER) {
    return sendError(res, "Only sellers can update products", 403);
  }

  const { id } = req.params;

  const product = await productModel.findOne({
    _id: id,
    sellerId: req.user.userId,
    isDeleted: false,
  });

  if (!product)
    return sendError(res, "Product not found or access denied", 404);

  const validation = productSchemaValidation.partial().safeParse(req.body);
  if (!validation.success) {
    return sendError(
      res,
      "Validation failed",
      400,
      validation.error.flatten().fieldErrors
    );
  }

  let images: IProductImage[] = product.images;
  if (req.files && Array.isArray(req.files)) {
    for (const img of images) {
      await deleteFromCloudinary(img.public_id);
    }

    images = await uploadMultipleToCloudinary(
      req.files as Express.Multer.File[]
    );
  }

  Object.assign(product, validation.data, { images, updatedAt: new Date() });
  await product.save();

  sendSuccess(res, "Product updated", product);
});

// ✅ Soft delete product (SELLER only)
export const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  if (req.user?.role !== UserRole.SELLER) {
    return sendError(res, "Only sellers can delete products", 403);
  }

  const { id } = req.params;

  const product = await productModel.findOne({
    _id: id,
    sellerId: req.user.userId,
    isDeleted: false,
  });

  if (!product)
    return sendError(res, "Product not found or access denied", 404);

  for (const img of product.images) {
    await deleteFromCloudinary(img.public_id);
  }

  product.isDeleted = true;
  await product.save();

  sendSuccess(res, "Product deleted");
});
