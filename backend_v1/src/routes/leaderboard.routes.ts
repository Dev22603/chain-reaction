import { Router } from "express";
import { leaderboardController } from "../controllers/leaderboard.controller.js";
import { asyncHandler } from "../middlewares/async_handler.js";

export const leaderboardRouter = Router();

leaderboardRouter.get("/leaderboard", asyncHandler(leaderboardController.index));
