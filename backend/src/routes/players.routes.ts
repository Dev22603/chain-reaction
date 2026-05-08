import { Router } from "express";
import { playersController } from "../controllers/players.controller.js";
import { asyncHandler } from "../middlewares/async_handler.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const playersRouter = Router();

playersRouter.get("/players/:playerId", asyncHandler(playersController.show));
playersRouter.get("/players/:playerId/matches", asyncHandler(playersController.matches));
playersRouter.get("/me/matches", requireAuth, asyncHandler(playersController.myMatches));
