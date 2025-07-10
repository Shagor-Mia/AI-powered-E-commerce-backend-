import { Router } from "express";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyRegisterOtp,
} from "../controllers/auth.controller";
import { upload } from "../middlewares/upload.middleware";
import passport from "passport";

const authRouter = Router();

authRouter.post("/register", upload.single("image"), register);
authRouter.post("/register/verify", verifyRegisterOtp);
authRouter.post("/login", login);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);

// Google login
authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google callback
authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/failed",
    session: true,
  }),
  (req, res) => {
    // Set session manually (to match your login logic)
    if (req.user) {
      const user = req.user as any;
      req.session.userId = user._id.toString();
      req.session.role = user.role;
    }

    // You can also issue a JWT if needed
    res.redirect("http://localhost:5173"); // or wherever you want to go
  }
);

// Optional: failed login handler
authRouter.get("/failed", (req, res) => {
  res.status(401).json({ message: "Google login failed" });
});

export default authRouter;
