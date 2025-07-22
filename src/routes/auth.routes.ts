import { Router } from "express";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyRegisterOtp,
  logout,
  googleCallback,
} from "../controllers/auth.controller";
import { upload } from "../middlewares/upload.middleware";
import passport from "passport";

const router = Router();

router.post("/register", upload.single("image"), register);
router.post("/register/verify", verifyRegisterOtp);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Google login
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google callback with JWT return
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/failed",
    session: true,
  }),
  googleCallback
);

router.get("/failed", (req, res) => {
  res.status(401).json({ message: "Google login failed" });
});

export default router;
