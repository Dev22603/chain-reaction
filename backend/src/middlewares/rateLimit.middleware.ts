import { rateLimit } from "express-rate-limit";
import type { Request, Response, NextFunction } from "express";
import { getClientIp } from "../utils/clientIp.js";
import { logSecurityEvent } from "../utils/securityLogger.js";

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
	message: { error: "rate_limited", message: "Too many requests. Try again later." },
	handler: rateLimitHandler,
});

export const publicReadLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	limit: 100, // 100 requests per minute
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: (req) => getClientIp(req),
	message: { error: "rate_limited", message: "Too many requests. Try again later." },
	handler: rateLimitHandler,
});
