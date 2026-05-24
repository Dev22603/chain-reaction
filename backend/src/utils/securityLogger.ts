import { getLogger } from "../lib/logger.js";
import { anonymizeIp } from "./clientIp.js";

const logger = getLogger("security");
const recentEvents = new Map<string, number>();

export type SecurityEvent = "rate_limit_trip" | "malformed_frame" | "rejected_origin" | "auth_failure";

/**
 * Logs a security event with an anonymized client IP address.
 * Throttles/aggregates events of the same type from the same client IP
 * to at most one log per 10 seconds to avoid spamming the log files.
 */
export function logSecurityEvent(event: SecurityEvent, meta: { ip: string; [key: string]: unknown }): void {
	const ip = meta.ip || "unknown";
	const anonIp = anonymizeIp(ip);
	const key = `${anonIp}:${event}`;
	const now = Date.now();
	const lastSeen = recentEvents.get(key) ?? 0;

	// Rate limit: 1 log per 10 seconds per IP + event type
	if (now - lastSeen > 10000) {
		recentEvents.set(key, now);

		// Copy metadata and replace IP with anonymized IP
		const safeMeta = { ...meta } as Record<string, unknown>;
		delete safeMeta.ip;

		logger.warn(`Security Warning: ${event}`, {
			event,
			ip: anonIp,
			...safeMeta,
		});
	}
}
