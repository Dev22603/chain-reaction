import { rateLimit } from "express-rate-limit";
import { NextFunction, Request, Response } from "express";
import { GLOBAL_ERROR_MESSAGES } from "../constants/app.messages";
import { ApiError } from "../utils/api_error";
import { getClientIp } from "../utils/client_ip";
import { logSecurityEvent } from "../utils/security_logger";

const rateLimitHandler = (req: Request, res: Response, next: NextFunction, options: { statusCode: number; message: unknown }) => {
	const ip = getClientIp(req);
	logSecurityEvent("rate_limit_trip", { ip, path: req.path });
	res.status(options.statusCode).json(options.message);
};

export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 10,
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: (req) => getClientIp(req),
	message: new ApiError(429, GLOBAL_ERROR_MESSAGES.RATE_LIMITED),
	handler: rateLimitHandler,
});

export const publicReadLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	limit: 100, // 100 requests per minute
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: (req) => getClientIp(req),
	message: new ApiError(429, GLOBAL_ERROR_MESSAGES.RATE_LIMITED),
	handler: rateLimitHandler,
});
