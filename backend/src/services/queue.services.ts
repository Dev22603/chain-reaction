import { ERROR_CODES, GAME_MODES, LIMITS, MESSAGE_TYPES } from "../constants/app.constants.js";
import { SERVER_MESSAGES } from "../constants/app.messages.js";
import { emitToPlayer } from "../lib/events.js";
import { connections } from "../state/connection.state.js";
import { playerRooms, queues, rooms } from "../state/game.state.js";
import type { GameMode, Player } from "../types/game.js";
import type { JoinQueueMessage } from "../types/protocol.js";
import { ApiError } from "../utils/api_error.js";
import { roomService } from "./room.services.js";

export const queueService = {
	joinQueue(playerId: string, payload: JoinQueueMessage): void {
		if (playerRooms.has(playerId)) {
			return;
		}

		if (rooms.size >= LIMITS.MAX_ROOMS) {
			throw new ApiError(ERROR_CODES.SERVER_BUSY, SERVER_MESSAGES.SERVER_BUSY);
		}

		const mode: GameMode = payload.mode ?? GAME_MODES.CASUAL;
		const identity = connections.get(playerId);
		const isGuest = identity?.isGuest ?? true;

		if (mode === GAME_MODES.RANKED && isGuest) {
			throw new ApiError(ERROR_CODES.NOT_AUTHENTICATED, SERVER_MESSAGES.RANKED_REQUIRES_AUTH);
		}

		removeFromAllQueues(playerId);

		const key = getQueueKey(mode, payload.gridRows, payload.gridCols, payload.maxPlayers);
		const queue = queues.get(key) ?? [];
		if (queue.length >= LIMITS.MAX_QUEUE_SIZE) {
			throw new ApiError(ERROR_CODES.SERVER_BUSY, "Queue is full. Please try again later.");
		}

		queue.push({
			id: playerId,
			name: identity && !identity.isGuest ? identity.displayName : payload.playerName,
			isGuest,
			eliminated: false,
			eliminatedTurn: null,
		});
		queues.set(key, queue);

		emitToPlayer(playerId, {
			type: MESSAGE_TYPES.QUEUED,
			mode,
			position: queue.length,
			maxPlayers: payload.maxPlayers,
		});

		if (queue.length >= payload.maxPlayers) {
			const roomPlayers = queue.splice(0, payload.maxPlayers);
			if (queue.length === 0) {
				queues.delete(key);
			}
			roomService.createMatchedRoom(roomPlayers, mode, payload.gridRows, payload.gridCols);
		}
	},

	leaveQueue(playerId: string): void {
		removeFromAllQueues(playerId);
	},
};

function getQueueKey(mode: GameMode, gridRows: number, gridCols: number, maxPlayers: number): string {
	return `${mode}:${gridRows}x${gridCols}x${maxPlayers}`;
}

function getQueueMode(key: string): GameMode {
	return key.startsWith(`${GAME_MODES.RANKED}:`) ? GAME_MODES.RANKED : GAME_MODES.CASUAL;
}

function getQueueMaxPlayers(key: string): number {
	return Number(key.split("x")[2]);
}

function removeFromAllQueues(playerId: string): void {
	for (const [key, queue] of queues) {
		const nextQueue = queue.filter((player: Player) => player.id !== playerId);
		if (nextQueue.length === 0) {
			queues.delete(key);
			continue;
		}

		queues.set(key, nextQueue);
		nextQueue.forEach((player, index) => {
			emitToPlayer(player.id, {
				type: MESSAGE_TYPES.QUEUED,
				mode: getQueueMode(key),
				position: index + 1,
				maxPlayers: getQueueMaxPlayers(key),
			});
		});
	}
}
