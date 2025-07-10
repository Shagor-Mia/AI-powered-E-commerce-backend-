import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const uploadToCloudinary = async (filePath: string) => {
  try {
    const res = await cloudinary.uploader.upload(filePath, {
      folder: "ecommerce",
    });
    fs.unlinkSync(filePath);
    return {
      url: res.secure_url,
      public_id: res.public_id,
    };
  } catch (error) {
    fs.unlinkSync(filePath);
    throw error;
  }
};

export const uploadMultipleToCloudinary = async (
  files: Express.Multer.File[]
) => {
  const uploaded = [];
  for (const file of files) {
    const result = await uploadToCloudinary(file.path);
    uploaded.push(result);
  }
  return uploaded;
};

export const deleteFromCloudinary = async (publicId: string) => {
  try {
    const res = await cloudinary.uploader.destroy(publicId);
    return res;
  } catch (error) {
    throw error;
  }
};
