import { rateLimit } from "express-rate-limit";
import { getClientIp } from "../utils/clientIp.js";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  message: { error: "rate_limited", message: "Too many requests. Try again later." }
});

export const publicReadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 100,          // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  message: { error: "rate_limited", message: "Too many requests. Try again later." }
});
