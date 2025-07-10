import { NextFunction, Request, RequestHandler, Response } from "express";

// Higher Order Function. Takes a function, does something and returns a function.. As we used this, we don't need to use try catch block for the controllers
export const catchAsync = (
  fn: (...args: Parameters<RequestHandler>) => Promise<void>
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
