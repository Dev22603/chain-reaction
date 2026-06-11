import express from "express";
import { getLeaderboard, getModeLeaderboard } from "../controllers/leaderboard.controllers";
import { publicReadLimiter } from "../middlewares/rate-limit";

const router = express.Router();

router.get("/", publicReadLimiter, getLeaderboard);
router.get("/mode", publicReadLimiter, getModeLeaderboard);

export default router;
