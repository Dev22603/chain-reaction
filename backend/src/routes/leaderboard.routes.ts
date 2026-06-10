import express from "express";
import { getLeaderboard } from "../controllers/leaderboard.controllers";
import { publicReadLimiter } from "../middlewares/rate-limit";

const router = express.Router();

router.get("/", publicReadLimiter, getLeaderboard);

export default router;
