import { UserRole } from "../constants/enum";
import "express-session";
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: UserRole | string;
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
