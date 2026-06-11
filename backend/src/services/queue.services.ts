import { LIMITS } from "../constants/app.constants";
import { GAME_MESSAGES } from "../constants/app.messages";
import { SOCKET_EVENTS } from "../constants/socket.events";
import { sendToPlayer } from "../lib/realtime";
import type { JoinQueueInput } from "../schemas/game.schemas";
import type { SocketUser } from "../types/socket";
import { ApiError } from "../utils/api_error";
import { Player, roomService } from "./room.services";

// Matchmaking buckets keyed by "RxCxM", one queue per board-size and player-count combination
const queues = new Map<string, Player[]>();

export const queueService = {
	joinQueue(user: SocketUser, input: JoinQueueInput): void {
		if (roomService.isInRoom(user.id)) {
			return;
		}

		roomService.assertCapacity();

		removeFromAllQueues(user.id);

		const key = getQueueKey(input.gridRows, input.gridCols, input.maxPlayers);
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
			position: queue.length,
			maxPlayers: input.maxPlayers,
			gridRows: input.gridRows,
			gridCols: input.gridCols,
		});

		if (queue.length >= input.maxPlayers) {
			const roomPlayers = queue.splice(0, input.maxPlayers);
			if (queue.length === 0) {
				queues.delete(key);
			}
			roomService.createMatchedRoom(roomPlayers, input.gridRows, input.gridCols);
		}
	},

	leaveQueue(playerId: string): void {
		removeFromAllQueues(playerId);
	},
};

function getQueueKey(gridRows: number, gridCols: number, maxPlayers: number): string {
	return `${gridRows}x${gridCols}x${maxPlayers}`;
}

function parseQueueKey(key: string): { gridRows: number; gridCols: number; maxPlayers: number } {
	const [gridRows, gridCols, maxPlayers] = key.split("x").map(Number);
	return { gridRows, gridCols, maxPlayers };
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
		const { gridRows, gridCols, maxPlayers } = parseQueueKey(key);
		nextQueue.forEach((player, index) => {
			sendToPlayer(player.id, SOCKET_EVENTS.GAME.QUEUED, {
				position: index + 1,
				maxPlayers,
				gridRows,
				gridCols,
			});
		});
	}
}
