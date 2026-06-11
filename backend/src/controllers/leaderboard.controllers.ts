import { Request, Response } from "express";
import { leaderboardService } from "../services/leaderboard.services";
import { ApiError } from "../utils/api_error";
import { ApiResponse } from "../utils/api_response";
import { GLOBAL_ERROR_MESSAGES, PLAYER_FEEDBACK_MESSAGES } from "../constants/app.messages";
import { getLogger } from "../lib/logger";

const logger = getLogger("leaderboard.controller");

const getLeaderboard = async (req: Request, res: Response) => {
	try {
		const leaderboard = await leaderboardService.listOverall(req.query);
		res.status(200).json(new ApiResponse(200, PLAYER_FEEDBACK_MESSAGES.LEADERBOARD_FETCHED, { leaderboard }));
	} catch (error) {
		if (error instanceof ApiError) return res.status(error.code).json(error);
		logger.error("Unexpected error", { error: (error as Error).message });
		res.status(500).json(new ApiError(500, GLOBAL_ERROR_MESSAGES.SERVER_ERROR));
	}
};

const getModeLeaderboard = async (req: Request, res: Response) => {
	try {
		const leaderboard = await leaderboardService.listMode(req.query);
		res.status(200).json(new ApiResponse(200, PLAYER_FEEDBACK_MESSAGES.LEADERBOARD_FETCHED, { leaderboard }));
	} catch (error) {
		if (error instanceof ApiError) return res.status(error.code).json(error);
		logger.error("Unexpected error", { error: (error as Error).message });
		res.status(500).json(new ApiError(500, GLOBAL_ERROR_MESSAGES.SERVER_ERROR));
	}
};

export { getLeaderboard, getModeLeaderboard };
