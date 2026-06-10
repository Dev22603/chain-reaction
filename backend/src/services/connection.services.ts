import { RECONNECT_GRACE_MS } from "../constants/app.constants";
import { SOCKET_EVENTS } from "../constants/socket.events";
import { getLogger } from "../lib/logger";
import { getPlayerSocket, registerPlayerSocket, sendToPlayer, unregisterPlayerSocket } from "../lib/realtime";
import type { AuthenticatedWebSocket } from "../types/socket";
import { gameService } from "./game.services";
import { queueService } from "./queue.services";
import { roomService } from "./room.services";

const logger = getLogger("connection.service");

interface PendingReconnect {
	roomId: string;
	expiresAt: number;
	timeoutHandle: ReturnType<typeof setTimeout>;
}

// Reconnect grace windows for authenticated players, owned by this service
const pendingReconnects = new Map<string, PendingReconnect>();

export const connectionService = {
	connect(ws: AuthenticatedWebSocket): void {
		const user = ws.user;
		if (!user.isGuest && resumePendingReconnect(ws)) {
			return;
		}

		registerPlayerSocket(user.id, ws);

		sendToPlayer(user.id, SOCKET_EVENTS.GAME.CONNECTED, {
			playerId: user.id,
			displayName: user.name,
			isGuest: user.isGuest,
		});

		logger.info("player connected", { playerId: user.id, isGuest: user.isGuest });
	},

	disconnect(ws: AuthenticatedWebSocket): void {
		const user = ws.user;
		if (getPlayerSocket(user.id) !== ws) {
			return;
		}

		queueService.leaveQueue(user.id);

		const room = roomService.getRoomForPlayer(user.id);
		if (user.isGuest || !room) {
			gameService.leaveGame(user.id);
			unregisterPlayerSocket(user.id, ws);
			logger.info("player disconnected", { playerId: user.id, isGuest: user.isGuest });
			return;
		}

		unregisterPlayerSocket(user.id, ws);

		const expiresAt = Date.now() + RECONNECT_GRACE_MS;
		const timeoutHandle = setTimeout(() => {
			pendingReconnects.delete(user.id);
			gameService.graceExpireLeaveGame(user.id);
			logger.info("grace window expired, player eliminated", { playerId: user.id, roomId: room.id });
		}, RECONNECT_GRACE_MS);

		pendingReconnects.set(user.id, { roomId: room.id, expiresAt, timeoutHandle });
		logger.info("player disconnected mid-game, grace window started", {
			playerId: user.id,
			roomId: room.id,
			expiresAt: new Date(expiresAt).toISOString(),
		});
	},

	clearAllPendingReconnects(): void {
		for (const pending of pendingReconnects.values()) {
			clearTimeout(pending.timeoutHandle);
		}
		pendingReconnects.clear();
	},
};

function resumePendingReconnect(ws: AuthenticatedWebSocket): boolean {
	const user = ws.user;
	const pending = pendingReconnects.get(user.id);
	if (!pending) {
		return false;
	}

	clearTimeout(pending.timeoutHandle);
	pendingReconnects.delete(user.id);

	if (!roomService.isInRoom(user.id)) {
		// Room ended during the grace window — fall through to a fresh connect
		logger.info("player reconnected but room ended during grace window", { playerId: user.id });
		return false;
	}

	registerPlayerSocket(user.id, ws);
	gameService.sendGameStateToPlayer(user.id);
	logger.info("player reconnected within grace window", { playerId: user.id, roomId: pending.roomId });
	return true;
}
