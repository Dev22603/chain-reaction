import type { IncomingMessage } from "node:http";
import type WebSocket from "ws";
import { ERROR_CODES, MESSAGE_TYPES } from "../constants/app.constants.js";
import { SERVER_MESSAGES } from "../constants/app.messages.js";
import { consumeMessageBudget, touchSocket } from "../lib/realtime.js";
import { getLogger } from "../lib/logger.js";
import { validateMessage } from "../schemas/socket.schemas.js";
import { connectionService } from "../services/connection.services.js";
import { gameService } from "../services/game.services.js";
import { queueService } from "../services/queue.services.js";
import { roomService } from "../services/room.services.js";
import { ApiError } from "../utils/api_error.js";
import { getClientIp } from "../utils/clientIp.js";
import { logSecurityEvent } from "../utils/securityLogger.js";
import { send } from "./game.publisher.js";

const logger = getLogger("ws.game");

export async function handleGameConnection(socket: WebSocket, request: IncomingMessage): Promise<void> {
	const ip = getClientIp(request);
	try {
		const identity = await connectionService.connect(socket, request, ip);

		socket.on("message", (raw) => {
			touchSocket(socket);
			const budget = consumeMessageBudget(ip, identity.playerId);
			if (budget === "server_busy") {
				send(socket, {
					type: MESSAGE_TYPES.ERROR,
					code: ERROR_CODES.RATE_LIMITED,
					message: "Server is under high load. Please try again later.",
				});
				return;
			}
			if (budget === "rate_limited") {
				send(socket, {
					type: MESSAGE_TYPES.ERROR,
					code: ERROR_CODES.RATE_LIMITED,
					message: "Too many messages. Slow down.",
				});
				return;
			}
			if (budget === "disconnect") {
				socket.close(1008, "rate limited");
				return;
			}

			dispatch(socket, identity.playerId, raw, ip);
		});

		socket.on("close", () => connectionService.disconnect(socket, identity));
	} catch (error) {
		logger.error("websocket connection setup failed", {
			error: error instanceof Error ? error.message : String(error),
		});
		socket.close(1011, "connection setup failed");
	}
}

function dispatch(socket: WebSocket, playerId: string, raw: WebSocket.RawData, ip: string): void {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw.toString());
	} catch {
		logSecurityEvent("malformed_frame", { ip, details: "JSON parse error" });
		return;
	}

	try {
		const message = validateMessage(parsed);
		if (!message) {
			logSecurityEvent("malformed_frame", { ip, details: "unknown or invalid message type" });
			return;
		}

		switch (message.type) {
			case MESSAGE_TYPES.JOIN_QUEUE:
				queueService.joinQueue(playerId, message);
				break;
			case MESSAGE_TYPES.LEAVE_QUEUE:
				queueService.leaveQueue(playerId);
				break;
			case MESSAGE_TYPES.MAKE_MOVE:
				gameService.makeMove(playerId, message);
				break;
			case MESSAGE_TYPES.LEAVE_GAME:
				gameService.leaveGame(playerId);
				break;
			case MESSAGE_TYPES.CREATE_ROOM:
				roomService.createPrivateRoom(playerId, message);
				break;
			case MESSAGE_TYPES.JOIN_ROOM_BY_CODE:
				roomService.joinPrivateRoom(playerId, message);
				break;
		}
	} catch (error) {
		if (error instanceof ApiError) {
			if (error.code === ERROR_CODES.VALIDATION_FAILED) {
				logSecurityEvent("malformed_frame", { ip, details: "schema validation failed", errors: error.errors });
			}
			send(socket, {
				type: MESSAGE_TYPES.ERROR,
				code: error.code,
				message: error.message,
				...(error.errors.length ? { errors: error.errors } : {}),
			});
			return;
		}

		logger.error("unhandled error in websocket dispatch", {
			error: error instanceof Error ? error.message : String(error),
		});
		send(socket, {
			type: MESSAGE_TYPES.ERROR,
			code: ERROR_CODES.INTERNAL_ERROR,
			message: SERVER_MESSAGES.INTERNAL_ERROR,
		});
	}
}
