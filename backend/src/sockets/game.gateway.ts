import WebSocket from "ws";
import { GAME_MESSAGES, GLOBAL_ERROR_MESSAGES } from "../constants/app.messages";
import { SOCKET_EVENTS } from "../constants/socket.events";
import { getLogger } from "../lib/logger";
import { consumeMessageBudget, touchSocket } from "../lib/realtime";
import { validateCreateRoom, validateJoinQueue, validateJoinRoomByCode, validateMakeMove } from "../schemas/game.schemas";
import { connectionService } from "../services/connection.services";
import { gameService } from "../services/game.services";
import { queueService } from "../services/queue.services";
import { roomService } from "../services/room.services";
import type { AuthenticatedWebSocket } from "../types/socket";
import { ApiError } from "../utils/api_error";
import { logSecurityEvent } from "../utils/security_logger";

const log = getLogger("ws.game");

function send(ws: AuthenticatedWebSocket, event: string, data: unknown): void {
	if (ws.readyState !== WebSocket.OPEN) return;
	ws.send(JSON.stringify({ event, data }));
}

export function handleGameConnection(ws: AuthenticatedWebSocket, ip: string): void {
	connectionService.connect(ws);

	ws.on("message", (raw) => {
		touchSocket(ws);

		const budget = consumeMessageBudget(ip, ws.user.id);
		if (budget === "server_busy") {
			send(ws, SOCKET_EVENTS.GAME.ERROR, { code: 503, message: GAME_MESSAGES.SERVER_OVERLOADED });
			return;
		}
		if (budget === "rate_limited") {
			send(ws, SOCKET_EVENTS.GAME.ERROR, { code: 429, message: GAME_MESSAGES.TOO_MANY_MESSAGES });
			return;
		}
		if (budget === "disconnect") {
			ws.close(1008, "rate limited");
			return;
		}

		let parsed: { event: string; data: unknown };
		try {
			parsed = JSON.parse(raw.toString()) as { event: string; data: unknown };
		} catch {
			logSecurityEvent("malformed_frame", { ip, details: "JSON parse error" });
			send(ws, SOCKET_EVENTS.GAME.ERROR, { code: 400, message: GAME_MESSAGES.INVALID_JSON });
			return;
		}

		dispatch(ws, parsed.event, parsed.data, ip);
	});

	ws.on("close", () => connectionService.disconnect(ws));
}

function dispatch(ws: AuthenticatedWebSocket, event: string, data: unknown, ip: string): void {
	try {
		switch (event) {
			case SOCKET_EVENTS.GAME.JOIN_QUEUE:
				queueService.joinQueue(ws.user, validateJoinQueue(data));
				break;
			case SOCKET_EVENTS.GAME.LEAVE_QUEUE:
				queueService.leaveQueue(ws.user.id);
				break;
			case SOCKET_EVENTS.GAME.MAKE_MOVE:
				gameService.makeMove(ws.user.id, validateMakeMove(data));
				break;
			case SOCKET_EVENTS.GAME.LEAVE_GAME:
				gameService.leaveGame(ws.user.id);
				break;
			case SOCKET_EVENTS.GAME.CREATE_ROOM:
				roomService.createPrivateRoom(ws.user, validateCreateRoom(data));
				break;
			case SOCKET_EVENTS.GAME.JOIN_ROOM_BY_CODE:
				roomService.joinPrivateRoom(ws.user, validateJoinRoomByCode(data));
				break;
			default:
				send(ws, SOCKET_EVENTS.GAME.ERROR, { code: 400, message: `Unknown event: ${event}` });
		}
	} catch (error) {
		if (error instanceof ApiError) {
			if (error.code === 400 && error.errors.length) {
				logSecurityEvent("malformed_frame", { ip, details: "schema validation failed", errors: error.errors });
			}
			send(ws, SOCKET_EVENTS.GAME.ERROR, {
				code: error.code,
				message: error.message,
				...(error.errors.length ? { errors: error.errors } : {}),
			});
			return;
		}

		log.error("unhandled error in websocket dispatch", {
			error: error instanceof Error ? error.message : String(error),
		});
		send(ws, SOCKET_EVENTS.GAME.ERROR, { code: 500, message: GLOBAL_ERROR_MESSAGES.SERVER_ERROR });
	}
}
