import { Request, Response } from "express";
import { authService } from "../services/auth.services";
import { ApiError } from "../utils/api_error";
import { ApiResponse } from "../utils/api_response";
import { AUTH_FEEDBACK_MESSAGES, GLOBAL_ERROR_MESSAGES } from "../constants/app.messages";
import { getLogger } from "../lib/logger";
import { getClientIp } from "../utils/client_ip";
import { logSecurityEvent } from "../utils/security_logger";

const logger = getLogger("auth.controller");

const signup = async (req: Request, res: Response) => {
	try {
		const result = await authService.signup(req.body);
		res.status(201).json(new ApiResponse(201, AUTH_FEEDBACK_MESSAGES.SIGNUP_SUCCESS, result));
	} catch (error) {
		if (error instanceof ApiError) return res.status(error.code).json(error);
		logger.error("Unexpected error", { error: (error as Error).message });
		res.status(500).json(new ApiError(500, GLOBAL_ERROR_MESSAGES.SERVER_ERROR));
	}
};

const login = async (req: Request, res: Response) => {
	try {
		const result = await authService.login(req.body);
		res.status(200).json(new ApiResponse(200, AUTH_FEEDBACK_MESSAGES.LOGIN_SUCCESS, result));
	} catch (error) {
		if (error instanceof ApiError) {
			if (error.code === 401) {
				logSecurityEvent("auth_failure", { ip: getClientIp(req), details: "login failed" });
			}
			return res.status(error.code).json(error);
		}
		logger.error("Unexpected error", { error: (error as Error).message });
		res.status(500).json(new ApiError(500, GLOBAL_ERROR_MESSAGES.SERVER_ERROR));
	}
};

const getMe = async (req: Request, res: Response) => {
	try {
		const player = await authService.getMe(req.user.id);
		res.status(200).json(new ApiResponse(200, AUTH_FEEDBACK_MESSAGES.PROFILE_FETCHED, { player }));
	} catch (error) {
		if (error instanceof ApiError) return res.status(error.code).json(error);
		logger.error("Unexpected error", { error: (error as Error).message });
		res.status(500).json(new ApiError(500, GLOBAL_ERROR_MESSAGES.SERVER_ERROR));
	}
};

const updateMe = async (req: Request, res: Response) => {
	try {
		const player = await authService.updateProfile(req.user.id, req.body);
		res.status(200).json(new ApiResponse(200, AUTH_FEEDBACK_MESSAGES.PROFILE_UPDATED, { player }));
	} catch (error) {
		if (error instanceof ApiError) return res.status(error.code).json(error);
		logger.error("Unexpected error", { error: (error as Error).message });
		res.status(500).json(new ApiError(500, GLOBAL_ERROR_MESSAGES.SERVER_ERROR));
	}
};

export { signup, login, getMe, updateMe };
