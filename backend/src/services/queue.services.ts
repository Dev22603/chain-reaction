import { GAME_MODES, LIMITS } from "../constants/app.constants";
import { GAME_MESSAGES } from "../constants/app.messages";
import { SOCKET_EVENTS } from "../constants/socket.events";
import { sendToPlayer } from "../lib/realtime";
import type { JoinQueueInput } from "../schemas/game.schemas";
import type { SocketUser } from "../types/socket";
import { ApiError } from "../utils/api_error";
import { Player, roomService } from "./room.services";

// Matchmaking buckets keyed by "mode:RxCxM", owned by this service
const queues = new Map<string, Player[]>();

export const queueService = {
	joinQueue(user: SocketUser, input: JoinQueueInput): void {
		if (roomService.isInRoom(user.id)) {
			return;
		}

		roomService.assertCapacity();

		const mode = input.mode ?? GAME_MODES.CASUAL;
		if (mode === GAME_MODES.RANKED && user.isGuest) {
			throw new ApiError(401, GAME_MESSAGES.RANKED_REQUIRES_AUTH);
		}

		removeFromAllQueues(user.id);

		const key = getQueueKey(mode, input.gridRows, input.gridCols, input.maxPlayers);
		const queue = queues.get(key) ?? [];
		if (queue.length >= LIMITS.MAX_QUEUE_SIZE) {
			throw new ApiError(503, GAME_MESSAGES.QUEUE_FULL);
		}

		queue.push({
			id: user.id,
			name: user.isGuest ? input.playerName : user.name,
			isGuest: user.isGuest,
			eliminated: false,
			eliminatedTurn: null,
		});
		queues.set(key, queue);

		sendToPlayer(user.id, SOCKET_EVENTS.GAME.QUEUED, {
			mode,
			position: queue.length,
			maxPlayers: input.maxPlayers,
		});

		if (queue.length >= input.maxPlayers) {
			const roomPlayers = queue.splice(0, input.maxPlayers);
			if (queue.length === 0) {
				queues.delete(key);
			}
			roomService.createMatchedRoom(roomPlayers, mode, input.gridRows, input.gridCols);
		}
	},

	leaveQueue(playerId: string): void {
		removeFromAllQueues(playerId);
	},
};

function getQueueKey(mode: GAME_MODES, gridRows: number, gridCols: number, maxPlayers: number): string {
	return `${mode}:${gridRows}x${gridCols}x${maxPlayers}`;
}

function getQueueMode(key: string): GAME_MODES {
	return key.startsWith(`${GAME_MODES.RANKED}:`) ? GAME_MODES.RANKED : GAME_MODES.CASUAL;
}

function getQueueMaxPlayers(key: string): number {
	return Number(key.split("x")[2]);
}

function removeFromAllQueues(playerId: string): void {
	for (const [key, queue] of queues) {
		const nextQueue = queue.filter((player: Player) => player.id !== playerId);
		if (nextQueue.length === queue.length) {
			continue;
		}

		if (nextQueue.length === 0) {
			queues.delete(key);
			continue;
		}

		queues.set(key, nextQueue);
		nextQueue.forEach((player, index) => {
			sendToPlayer(player.id, SOCKET_EVENTS.GAME.QUEUED, {
				mode: getQueueMode(key),
				position: index + 1,
				maxPlayers: getQueueMaxPlayers(key),
			});
		});
	}
}
