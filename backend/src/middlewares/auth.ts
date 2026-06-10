import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../constants/config";
import { AUTH_FEEDBACK_MESSAGES } from "../constants/app.messages";
import { ApiError } from "../utils/api_error";
import { getLogger } from "../lib/logger";

const logger = getLogger("auth.middleware");

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
	const token = req.headers.authorization?.split(" ")[1];
	if (!token) {
		logger.warn("Request rejected — no token provided", { path: req.path });
		return res.status(401).json(new ApiError(401, AUTH_FEEDBACK_MESSAGES.NOT_AUTHENTICATED));
	}
	try {
		const decoded = jwt.verify(token, config.JWT_SECRET, {
			algorithms: ["HS256"],
			issuer: config.JWT_ISSUER,
			audience: config.JWT_AUDIENCE,
		}) as { id: string; name: string; email: string };
		req.user = decoded;
		next();
	} catch (err) {
		if (err instanceof jwt.TokenExpiredError) {
			logger.warn("Request rejected — token expired", { path: req.path });
			return res.status(401).json(new ApiError(401, AUTH_FEEDBACK_MESSAGES.TOKEN_EXPIRED));
		}
		logger.warn("Request rejected — invalid token", { path: req.path, error: (err as Error).message });
		res.status(401).json(new ApiError(401, AUTH_FEEDBACK_MESSAGES.NOT_AUTHENTICATED));
	}
};
