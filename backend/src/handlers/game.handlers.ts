import {
	ERROR_CODES,
	MESSAGE_TYPES,
	ROOM_IDLE_TTL_MS,
	RANKED_VELOCITY_LIMIT,
	RANKED_VELOCITY_WINDOW_MS,
} from "../constants/app.constants.js";
import { matchesRepo, scoresRepo } from "../db/index.js";
import { applyMove, isEliminated } from "../game/gameLogic.js";
import { getLogger } from "../lib/logger.js";
import { pendingReconnects, players, playerRooms, rankedCompletions, roomCodes, rooms } from "../state/memory.js";
import type { PlayerIndex, Room } from "../types/game.js";
import type { MakeMoveMessage } from "../types/protocol.js";
import type { ScoreDeltas } from "../types/scoring.js";
import { broadcast, send } from "../utils/broadcast.js";

const logger = getLogger("game.handlers");

export function handleMove(playerId: string, payload: MakeMoveMessage): void {
	const room = getRoomForPlayer(playerId);
	if (!room || room.status !== "active") {
		return;
	}

	const currentPlayer = room.players[room.currentTurn];
	if (!currentPlayer || currentPlayer.id !== playerId) {
		return;
	}

	if (!isInBounds(payload.row, payload.col, room)) {
		return;
	}

	const cell = room.board[payload.row]?.[payload.col];
	const playerIndex = room.currentTurn;
	if (!cell || (cell.owner !== null && cell.owner !== playerIndex)) {
		return;
	}

	applyMove(room.board, payload.row, payload.col, playerIndex, room.gridRows, room.gridCols);
	room.turnCount += 1;

	if (room.turnCount >= room.players.length) {
		room.players.forEach((player, index) => {
			const eliminated = isEliminated(room.board, index);
			if (eliminated && !player.eliminated) {
				player.eliminatedTurn = room.turnCount;
			}
			player.eliminated = eliminated;
		});
	}

	const winner = getWinner(room);
	if (winner) {
		endGame(room, winner);
		return;
	}

	room.currentTurn = advanceTurn(room);
	broadcastGameState(room);
}

export function handleLeaveGame(playerId: string): void {
	eliminateAndBroadcast(playerId);
}

// Called by the grace expiry timer after the reconnect window closes.
export function graceExpireLeaveGame(playerId: string): void {
	eliminateAndBroadcast(playerId);
}

// Sends the current board snapshot to a single reconnecting player.
export function sendGameStateToPlayer(playerId: string): void {
	const room = getRoomForPlayer(playerId);
	if (!room) {
		return;
	}

	send(players.get(playerId), {
		type: MESSAGE_TYPES.GAME_STATE,
		board: room.board,
		currentTurn: room.currentTurn,
		players: room.players,
	});
}

function eliminateAndBroadcast(playerId: string): void {
	const room = getRoomForPlayer(playerId);
	if (!room) {
		return;
	}

	const playerIndex = room.players.findIndex((player) => player.id === playerId);
	if (playerIndex === -1) {
		return;
	}

	const leavingPlayer = room.players[playerIndex];
	if (!leavingPlayer) {
		return;
	}

	leavingPlayer.eliminated = true;
	leavingPlayer.eliminatedTurn ??= room.turnCount;
	room.forfeitedPlayerIds.add(leavingPlayer.id);

	if (room.status !== "active") {
		destroyRoom(room);
		return;
	}

	const winner = getWinner(room);
	if (winner) {
		endGame(room, winner);
		return;
	}

	const alive = room.players.filter((player) => !player.eliminated);
	if (alive.length === 0) {
		destroyRoom(room);
		return;
	}

	if (room.currentTurn === playerIndex) {
		room.currentTurn = advanceTurn(room);
	}

	broadcastGameState(room);
}

function getRoomForPlayer(playerId: string): Room | null {
	const roomId = playerRooms.get(playerId);
	if (!roomId) {
		return null;
	}

	return rooms.get(roomId) ?? null;
}

function isInBounds(row: number, col: number, room: Room): boolean {
	return row >= 0 && row < room.gridRows && col >= 0 && col < room.gridCols;
}

function advanceTurn(room: Room): PlayerIndex {
	for (let offset = 1; offset <= room.players.length; offset += 1) {
		const nextIndex = (room.currentTurn + offset) % room.players.length;
		if (!room.players[nextIndex]?.eliminated) {
			return nextIndex;
		}
	}

	return room.currentTurn;
}

function getWinner(room: Room) {
	const alive = room.players.filter((player) => !player.eliminated);
	return alive.length === 1 ? alive[0] : null;
}

function broadcastGameState(room: Room): void {
	broadcast(room, {
		type: MESSAGE_TYPES.GAME_STATE,
		board: room.board,
		currentTurn: room.currentTurn,
		players: room.players,
	});
}

function computeAuthDeltas(room: Room, winnerId: string): ScoreDeltas {
	const deltas: ScoreDeltas = {};
	for (const player of room.players) {
		if (!player.isGuest) {
			deltas[player.id] = player.id === winnerId ? 3 : 1;
		}
	}
	return deltas;
}

export function destroyRoom(room: Room): void {
	rooms.delete(room.id);
	if (room.inviteCode) {
		roomCodes.delete(room.inviteCode);
	}
	for (const player of room.players) {
		playerRooms.delete(player.id);
		const pending = pendingReconnects.get(player.id);
		if (pending) {
			clearTimeout(pending.timeoutHandle);
			pendingReconnects.delete(player.id);
		}
	}
}

let reaperInterval: NodeJS.Timeout | null = null;

export function startRoomReaper(): void {
	if (reaperInterval) return;

	reaperInterval = setInterval(() => {
		logger.info("running periodic room reaper");
		const now = Date.now();
		for (const room of Array.from(rooms.values())) {
			// Check 1: no connected sockets
			const hasConnectedPlayers = room.players.some((p) => players.has(p.id));
			if (!hasConnectedPlayers) {
				logger.info("reaper: destroying room with no connected players", { roomId: room.id });
				destroyRoom(room);
				continue;
			}

			// Check 2: private rooms unfilled past TTL
			if (room.isPrivate && room.players.length < room.maxPlayers) {
				const age = now - room.startedAt.getTime();
				if (age > ROOM_IDLE_TTL_MS) {
					logger.info("reaper: destroying unfilled private room past TTL", { roomId: room.id, ageMs: age });
					destroyRoom(room);
				}
			}
		}
	}, 60_000);
}

export function stopRoomReaper(): void {
	if (reaperInterval) {
		clearInterval(reaperInterval);
		reaperInterval = null;
		logger.info("stopped periodic room reaper");
	}
}

function endGame(room: Room, winner: NonNullable<ReturnType<typeof getWinner>>): void {
	room.status = "finished";
	const scoreDeltas = computeAuthDeltas(room, winner.id);

	broadcast(room, {
		type: MESSAGE_TYPES.GAME_OVER,
		mode: room.mode,
		winner: {
			id: winner.id,
			name: winner.name,
		},
		...(Object.keys(scoreDeltas).length > 0 && { score_deltas: scoreDeltas }),
	});

	const playerSockets = room.players.map((p) => players.get(p.id));
	const roomSnapshot = {
		id: room.id,
		mode: room.mode,
		players: room.players.map((p) => ({ ...p })),
		gridRows: room.gridRows,
		gridCols: room.gridCols,
		maxPlayers: room.maxPlayers,
		startedAt: room.startedAt,
		turnCount: room.turnCount,
		forfeitedPlayerIds: new Set(room.forfeitedPlayerIds),
	};

	destroyRoom(room);

	persistFinishedMatch(roomSnapshot, winner.id).catch((error: unknown) => {
		logger.error("finished match persistence failed", {
			roomId: roomSnapshot.id,
			error: error instanceof Error ? error.message : String(error),
		});
		for (const socket of playerSockets) {
			send(socket, {
				type: MESSAGE_TYPES.ERROR,
				code: ERROR_CODES.MATCH_NOT_SAVED,
				message: "Match result could not be saved. Leaderboard may not reflect this game.",
			});
		}
	});
}

async function persistFinishedMatch(
	room: {
		id: string;
		mode: Room["mode"];
		players: Room["players"];
		gridRows: number;
		gridCols: number;
		maxPlayers: number;
		startedAt: Date;
		turnCount: number;
		forfeitedPlayerIds: Set<string>;
	},
	winnerId: string,
): Promise<void> {
	const winner = room.players.find((p) => p.id === winnerId);
	if (!winner) {
		logger.info("skipping match persistence: winner not found", {
			roomId: room.id,
		});
		return;
	}

	const authParticipants = room.players.filter((p) => !p.isGuest);
	if (authParticipants.length === 0) {
		logger.info("skipping match persistence: no authenticated participants", {
			roomId: room.id,
		});
		return;
	}

	const participants = room.players.map((player) => {
		return {
			playerId: player.id,
			displayName: player.name,
			playerIndex: room.players.indexOf(player),
			eliminatedTurn: player.id === winnerId ? null : player.eliminatedTurn,
			forfeited: room.forfeitedPlayerIds.has(player.id),
		};
	});

	await matchesRepo.recordFinished({
		id: room.id,
		mode: room.mode,
		gridRows: room.gridRows,
		gridCols: room.gridCols,
		maxPlayers: room.maxPlayers,
		startedAt: room.startedAt,
		endedAt: new Date(),
		winnerId,
		turnCount: room.turnCount,
		participants,
	});

	if (room.mode === "ranked" && authParticipants.length >= 2 && !winner.isGuest) {
		const now = Date.now();
		let isCapped = false;

		for (const p of authParticipants) {
			const timestamps = rankedCompletions.get(p.id) ?? [];
			const validTimestamps = timestamps.filter((t) => now - t < RANKED_VELOCITY_WINDOW_MS);
			if (validTimestamps.length >= RANKED_VELOCITY_LIMIT) {
				isCapped = true;
				logger.warn("Ranked velocity cap exceeded for player, skipping leaderboard update", {
					playerId: p.id,
					roomId: room.id,
				});
			}
		}

		for (const p of authParticipants) {
			const timestamps = rankedCompletions.get(p.id) ?? [];
			const validTimestamps = timestamps.filter((t) => now - t < RANKED_VELOCITY_WINDOW_MS);
			validTimestamps.push(now);
			rankedCompletions.set(p.id, validTimestamps);
		}

		if (isCapped) {
			logger.info("skipping scoresRepo.applyMatchResult due to velocity cap", {
				roomId: room.id,
			});
			return;
		}

		await scoresRepo.applyMatchResult({
			winnerId,
			participants: authParticipants.map((participant) => ({
				playerId: participant.id,
				forfeited: room.forfeitedPlayerIds.has(participant.id),
			})),
		});
	}
}
