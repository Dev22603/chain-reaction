import type { Request, Response } from "express";
import { leaderboardService } from "../services/leaderboard.service.js";
import { apiResponse } from "../utils/api_response.js";

export const leaderboardController = {
  async index(request: Request, response: Response): Promise<void> {
    const limit = typeof request.query.limit === "string" ? Number(request.query.limit) : undefined;
    const leaderboard = await leaderboardService.listLeaderboard(limit);
    response.json(apiResponse({ leaderboard }));
  }
};
