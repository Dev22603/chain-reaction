import { randomUUID } from "crypto";
import type { IncomingMessage } from "http";
import jwt from "jsonwebtoken";
import { config } from "../constants/config";
import { getLogger } from "../lib/logger";
import { playerRepository } from "../repositories/player.repositories";
import type { SocketUser } from "../types/socket";
import { logSecurityEvent } from "../utils/security_logger";

const logger = getLogger("socket-auth.middleware");

/**
 * Resolves the identity for a WebSocket upgrade request.
 * The JWT rides the Sec-WebSocket-Protocol header (new WebSocket(url, token)).
 * No token → guest. Invalid/expired token → security-log + guest fallback
 * (connections are never rejected for auth reasons; ranked play re-checks).
 */
export async function parseUserFromRequest(req: IncomingMessage, ip: string): Promise<SocketUser> {
	const token = getTokenFromRequest(req);
	if (!token) {
		return buildGuestUser();
	}

	try {
		const payload = jwt.verify(token, config.JWT_SECRET, {
			algorithms: ["HS256"],
			issuer: config.JWT_ISSUER,
			audience: config.JWT_AUDIENCE,
		}) as { id: string; name: string; email: string };

		const player = await playerRepository.findById(payload.id);
		if (!player?.email) {
			return buildGuestUser();
		}

		return { id: player.id, name: player.displayName, email: player.email, isGuest: false };
	} catch (error) {
		logSecurityEvent("auth_failure", { ip, details: "WS token validation failed" });
		logger.warn("websocket auth failed", {
			error: error instanceof Error ? error.message : String(error),
		});
		return buildGuestUser();
	}
}

function getTokenFromRequest(req: IncomingMessage): string | null {
	const header = req.headers["sec-websocket-protocol"];
	const raw = Array.isArray(header) ? header[0] : header;
	return raw?.split(",")[0]?.trim() || null;
}

function buildGuestUser(): SocketUser {
	const id = randomUUID();
	return {
		id,
		name: `Guest ${id.slice(0, 8)}`,
		email: null,
		isGuest: true,
	};
}
