import type WebSocket from "ws";
import { ERROR_CODES, MESSAGE_TYPES } from "./constants/app.constants.js";
import { SERVER_MESSAGES } from "./constants/app.messages.js";
import { handleLeaveGame, handleMove } from "./handlers/game.handlers.js";
import { handleJoinQueue, handleLeaveQueue } from "./handlers/queue.handlers.js";
import { handleCreateRoom, handleJoinRoomByCode } from "./handlers/room.handlers.js";
import { getLogger } from "./lib/logger.js";
import { validateMessage } from "./schemas/messages.schemas.js";
import { ApiError } from "./utils/api_error.js";
import { send } from "./utils/broadcast.js";
import { logSecurityEvent } from "./utils/securityLogger.js";

const logger = getLogger("router");

export function dispatch(socket: WebSocket, playerId: string, raw: WebSocket.RawData, ip: string): void {
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
				handleJoinQueue(playerId, message);
				break;
			case MESSAGE_TYPES.LEAVE_QUEUE:
				handleLeaveQueue(playerId);
				break;
			case MESSAGE_TYPES.MAKE_MOVE:
				handleMove(playerId, message);
				break;
			case MESSAGE_TYPES.LEAVE_GAME:
				handleLeaveGame(playerId);
				break;
			case MESSAGE_TYPES.CREATE_ROOM:
				handleCreateRoom(playerId, message);
				break;
			case MESSAGE_TYPES.JOIN_ROOM_BY_CODE:
				handleJoinRoomByCode(playerId, message);
				break;
			default:
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

		logger.error("unhandled error in dispatch", {
			error: error instanceof Error ? error.message : String(error),
		});
		send(socket, {
			type: MESSAGE_TYPES.ERROR,
			code: ERROR_CODES.INTERNAL_ERROR,
			message: SERVER_MESSAGES.INTERNAL_ERROR,
		});
	}
}
