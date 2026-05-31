import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";
import type WebSocket from "ws";
import { MESSAGE_TYPES, RECONNECT_GRACE_MS } from "../constants/app.constants.js";
import { emitToPlayer } from "../lib/events.js";
import { getLogger } from "../lib/logger.js";
import { playersRepository } from "../repositories/players.repositories.js";
import { connections, pendingReconnects, players } from "../state/connection.state.js";
import { playerRooms } from "../state/game.state.js";
import type { ConnectionIdentity } from "../types/connection.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { logSecurityEvent } from "../utils/securityLogger.js";
import { gameService } from "./game.services.js";
import { queueService } from "./queue.services.js";

const logger = getLogger("connection.service");

export const connectionService = {
	async connect(socket: WebSocket, request: IncomingMessage, ip: string): Promise<ConnectionIdentity> {
		const identity = await resolveIdentity(request, ip);
		if (!identity.isGuest && resumePendingReconnect(socket, identity)) {
			return identity;
		}

		players.set(identity.playerId, socket);
		connections.set(identity.playerId, identity);

		emitToPlayer(identity.playerId, {
			type: MESSAGE_TYPES.CONNECTED,
			playerId: identity.playerId,
			displayName: identity.displayName,
			isGuest: identity.isGuest,
		});

		logger.info("player connected", {
			playerId: identity.playerId,
			isGuest: identity.isGuest,
			ip,
		});

		return identity;
	},

	disconnect(socket: WebSocket, identity: ConnectionIdentity): void {
		if (players.get(identity.playerId) !== socket) {
			return;
		}

		queueService.leaveQueue(identity.playerId);

		const roomId = playerRooms.get(identity.playerId);
		if (identity.isGuest || !roomId) {
			gameService.leaveGame(identity.playerId);
			players.delete(identity.playerId);
			connections.delete(identity.playerId);
			logger.info("player disconnected", { playerId: identity.playerId, isGuest: identity.isGuest });
			return;
		}

		players.delete(identity.playerId);
		connections.delete(identity.playerId);

		const expiresAt = Date.now() + RECONNECT_GRACE_MS;
		const timeoutHandle = setTimeout(() => {
			pendingReconnects.delete(identity.playerId);
			gameService.graceExpireLeaveGame(identity.playerId);
			logger.info("grace window expired, player eliminated", { playerId: identity.playerId, roomId });
		}, RECONNECT_GRACE_MS);

		pendingReconnects.set(identity.playerId, { roomId, expiresAt, timeoutHandle });
		logger.info("player disconnected mid-game, grace window started", {
			playerId: identity.playerId,
			roomId,
			expiresAt: new Date(expiresAt).toISOString(),
		});
	},
};

function resumePendingReconnect(socket: WebSocket, identity: ConnectionIdentity): boolean {
	const pending = pendingReconnects.get(identity.playerId);
	if (!pending) {
		return false;
	}

	clearTimeout(pending.timeoutHandle);
	pendingReconnects.delete(identity.playerId);
	players.set(identity.playerId, socket);
	connections.set(identity.playerId, identity);

	if (playerRooms.has(identity.playerId)) {
		gameService.sendGameStateToPlayer(identity.playerId);
		logger.info("player reconnected within grace window", { playerId: identity.playerId, roomId: pending.roomId });
	} else {
		logger.info("player reconnected but room ended during grace window", { playerId: identity.playerId });
	}

	return true;
}

async function resolveIdentity(request: IncomingMessage, ip: string): Promise<ConnectionIdentity> {
	const token = getTokenFromRequest(request);
	if (!token) {
		return buildGuestIdentity();
	}

	try {
		const payload = verifyAccessToken(token);
		const player = await playersRepository.findById(payload.sub);
		if (!player?.email) {
			return buildGuestIdentity();
		}

		return {
			playerId: player.id,
			displayName: player.displayName,
			email: player.email,
			isGuest: false,
		};
	} catch (error) {
		logSecurityEvent("auth_failure", { ip, details: "WS token validation failed" });
		logger.warn("websocket auth failed", {
			error: error instanceof Error ? error.message : String(error),
		});
		return buildGuestIdentity();
	}
}

function getTokenFromRequest(request: IncomingMessage): string | null {
	// TODO(frontend): move WS token off the URL query string (F-04)
	const url = new URL(request.url ?? "/", "http://localhost");
	return url.searchParams.get("token")?.trim() || null;
}

function buildGuestIdentity(): ConnectionIdentity {
	const playerId = randomUUID();
	return {
		playerId,
		displayName: `Guest ${playerId.slice(0, 8)}`,
		email: null,
		isGuest: true,
	};
}
