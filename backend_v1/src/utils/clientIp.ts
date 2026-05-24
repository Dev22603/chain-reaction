import type { IncomingMessage } from "node:http";
import { createHash } from "node:crypto";
import { config } from "../constants/config.js";

/**
 * Resolves the real client IP address from request headers.
 * Avoids vendor lock-in by checking:
 * 1. An optional user-configured header (via CLIENT_IP_HEADER config).
 * 2. Common cloud/proxy headers (cf-connecting-ip, fly-client-ip, x-real-ip).
 * 3. X-Forwarded-For (the first hop/IP in the list).
 * 4. Finally, the raw socket remote address.
 */
export function getClientIp(req: IncomingMessage): string {
	// 1. Check user-configured override header
	const configuredHeader = config.CLIENT_IP_HEADER;
	if (configuredHeader) {
		const val = req.headers[configuredHeader.toLowerCase()];
		if (typeof val === "string" && val.trim()) return val.trim();
	}

	// 2. Check common cloud/proxy headers in priority order
	const commonHeaders = ["cf-connecting-ip", "fly-client-ip", "x-real-ip"];
	for (const header of commonHeaders) {
		const val = req.headers[header];
		if (typeof val === "string" && val.trim()) return val.trim();
	}

	// 3. Fallback to X-Forwarded-For first hop
	const xff = req.headers["x-forwarded-for"];
	const first = (Array.isArray(xff) ? xff[0] : xff)?.split(",")[0]?.trim();

	// 4. Fallback to socket remote address
	return first || req.socket.remoteAddress || "unknown";
}

/**
 * Hashes and truncates a client IP address to ensure privacy compliance (GDPR/F-27)
 * if ANONYMIZE_LOGS is enabled. Otherwise, returns the original IP.
 */
export function anonymizeIp(ip: string): string {
	if (ip === "unknown") return "unknown";
	if (!config.ANONYMIZE_LOGS) return ip;
	return createHash("sha256").update(ip).digest("hex").slice(0, 12);
}
