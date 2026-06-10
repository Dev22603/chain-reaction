import { Request, Response } from "express";
import { playerService } from "../services/player.services";
import { ApiError } from "../utils/api_error";
import { ApiResponse } from "../utils/api_response";
import { GLOBAL_ERROR_MESSAGES, PLAYER_FEEDBACK_MESSAGES } from "../constants/app.messages";
import { getLogger } from "../lib/logger";

const logger = getLogger("player.controller");

const getPlayerProfile = async (req: Request, res: Response) => {
	try {
		const profile = await playerService.getProfile(getPlayerIdParam(req));
		res.status(200).json(new ApiResponse(200, PLAYER_FEEDBACK_MESSAGES.PROFILE_FETCHED, { profile }));
	} catch (error) {
		if (error instanceof ApiError) return res.status(error.code).json(error);
		logger.error("Unexpected error", { error: (error as Error).message });
		res.status(500).json(new ApiError(500, GLOBAL_ERROR_MESSAGES.SERVER_ERROR));
	}
};

const getPlayerMatches = async (req: Request, res: Response) => {
	try {
		const matches = await playerService.listMatches(getPlayerIdParam(req), req.query);
		res.status(200).json(new ApiResponse(200, PLAYER_FEEDBACK_MESSAGES.MATCHES_FETCHED, { matches }));
	} catch (error) {
		if (error instanceof ApiError) return res.status(error.code).json(error);
		logger.error("Unexpected error", { error: (error as Error).message });
		res.status(500).json(new ApiError(500, GLOBAL_ERROR_MESSAGES.SERVER_ERROR));
	}
};

const getMyMatches = async (req: Request, res: Response) => {
	try {
		const matches = await playerService.listMatches(req.user.id, req.query);
		res.status(200).json(new ApiResponse(200, PLAYER_FEEDBACK_MESSAGES.MATCHES_FETCHED, { matches }));
	} catch (error) {
		if (error instanceof ApiError) return res.status(error.code).json(error);
		logger.error("Unexpected error", { error: (error as Error).message });
		res.status(500).json(new ApiError(500, GLOBAL_ERROR_MESSAGES.SERVER_ERROR));
	}
};

function getPlayerIdParam(req: Request): string {
	const value = req.params.playerId;
	return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export { getPlayerProfile, getPlayerMatches, getMyMatches };
