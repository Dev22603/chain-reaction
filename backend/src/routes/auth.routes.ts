import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { asyncHandler } from "../middlewares/async_handler.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { authLimiter } from "../middlewares/rateLimit.middleware.js";

export const authRouter = Router();

authRouter.post("/auth/signup", authLimiter, asyncHandler(authController.signup));
authRouter.post("/auth/login", authLimiter, asyncHandler(authController.login));
authRouter.get("/auth/me", requireAuth, asyncHandler(authController.me));
