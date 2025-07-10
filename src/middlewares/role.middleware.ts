import { RequestHandler } from "express";
import { UserRole } from "../constants/enum";

export const roleMiddleware = (roles: UserRole[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role as UserRole)) {
      res.status(403).json({ message: "Access denied" });
      return;
    }
    next();
  };
};
