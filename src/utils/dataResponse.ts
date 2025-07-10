// utils/dataResponse.ts

import { Response } from "express";

interface DataResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200
): void => {
  const response: DataResponse<T> = {
    success: true,
    message,
    data,
  };

  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  errors?: any
): void => {
  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
