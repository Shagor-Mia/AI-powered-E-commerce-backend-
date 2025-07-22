// src/middlewares/authMiddleware.ts
import { RequestHandler, Request } from "express"; // Import Request here
import jwt from "jsonwebtoken";
import { UserRole } from "../constants/enum"; // Make sure to import UserRole

// Extend Request to include the 'user' property
// This is an alternative way if the global declaration isn't picked up consistently
// Or simply ensuring Request type is used throughout
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole | string;
  };
}

export const authMiddleware: RequestHandler = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
      role: UserRole | string; // Ensure role type matches your enum or string
    };

    // Cast req to AuthenticatedRequest to ensure TypeScript recognizes req.user
    (req as AuthenticatedRequest).user = {
      userId: decoded.userId,
      role: decoded.role,
    };
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
    return;
  }
};
