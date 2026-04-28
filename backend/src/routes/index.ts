import { Router } from "express";
import { healthRouter } from "./health.routes.js";
import { leaderboardRouter } from "./leaderboard.routes.js";

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(leaderboardRouter);
