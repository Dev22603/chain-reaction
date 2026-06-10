import express from "express";
import { signup, login, getMe, updateMe } from "../controllers/auth.controllers";
import { authenticate } from "../middlewares/auth";
import { authLimiter } from "../middlewares/rate-limit";

const router = express.Router();

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, updateMe);

export default router;
