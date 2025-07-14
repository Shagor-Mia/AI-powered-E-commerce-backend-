import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import dbConnection from "./database/connect";
import authRouter from "./routes/auth.routes";
import { globalErrorHandler } from "./middlewares/errors.middleware";
import session from "express-session"; // Import express-session
import passport from "passport"; // Import passport
import "./config/passport";
// import UserRouter from "./routes/user.route";
// import CartRouter from "./routes/cart.route";
// import OrderRouter from "./routes/order.route";
// import PaymentRouter from "./routes/payment.route";
// import ProductRouter from "./routes/product.route";
// import ReviewRouter from "./routes/review.route";

dotenv.config();

const app = express();

app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// globalErrorHandler should typically be the last middleware before your routes,
// or at least after all other processing that might throw an error.
// For now, let's keep it here but consider its final placement.
app.use(globalErrorHandler);

// --- CORRECT ORDER FOR SESSION AND PASSPORT ---
// 1. Session Middleware FIRST
app.use(
  session({
    secret: process.env.SESSION_SECRET || "some_secret_key", // Use a strong secret from .env
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only in prod
      sameSite: "lax",
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  })
);

// 2. Initialize Passport AFTER session
app.use(passport.initialize());
app.use(passport.session()); // This enables session support for Passport
// --- END CORRECT ORDER ---

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    credentials: true,
  })
);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.use("/api/auth", authRouter);
// for google login
app.use("/auth", authRouter);

// app.use("/api/user", UserRouter);
// app.use("/api/cart", CartRouter);
// app.use("/api/order", OrderRouter);
// app.use("/api/payment", PaymentRouter);
// app.use("/api/product", ProductRouter);
// app.use("/api/review", ReviewRouter);

dbConnection();

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
