// src/types/express/index.d.ts
import "express-session";
import { UserRole } from "../../constants/enum"; // Ensure this path is correct

declare global {
  namespace Express {
    interface Request {
      // This is the important part: ensure `user` property exists on Request
      user?: {
        userId: string;
        role: UserRole | string; // Use the enum or string
      };
    }
  }
}

declare module "express-session" {
  interface SessionData {
    userId: string;
    role: UserRole | string;
  }
}
