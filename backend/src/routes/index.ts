import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { healthRouter } from "./health.routes.js";
import { leaderboardRouter } from "./leaderboard.routes.js";
import { playersRouter } from "./players.routes.js";

export const apiRouter = Router();

apiRouter.use(authRouter);
apiRouter.use(healthRouter);
apiRouter.use(leaderboardRouter);
apiRouter.use(playersRouter);
