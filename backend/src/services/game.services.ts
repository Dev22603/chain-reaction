import { ERROR_CODES, MESSAGE_TYPES } from "../constants/app.constants.js";
import { applyMove, isEliminated } from "../game/game.logic.js";
import { emitToPlayer, emitToRoom } from "../lib/events.js";
import { getLogger } from "../lib/logger.js";
import { playerRooms, rooms } from "../state/game.state.js";
import type { PlayerIndex, Room } from "../types/game.js";
import type { MakeMoveMessage } from "../types/protocol.js";
import { matchService } from "./match.services.js";
import { roomService } from "./room.services.js";

const logger = getLogger("game.service");

export const gameService = {
	makeMove(playerId: string, payload: MakeMoveMessage): void {
		const room = getRoomForPlayer(playerId);
		if (!room || room.status !== "active") {
			return;
		}

		const currentPlayer = room.players[room.currentTurn];
		if (!currentPlayer || currentPlayer.id !== playerId || !isInBounds(payload.row, payload.col, room)) {
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
		emitGameState(room);
	},

	leaveGame(playerId: string): void {
		eliminateAndEmit(playerId);
	},

	graceExpireLeaveGame(playerId: string): void {
		eliminateAndEmit(playerId);
	},

	sendGameStateToPlayer(playerId: string): void {
		const room = getRoomForPlayer(playerId);
		if (!room) {
			return;
		}

		emitToPlayer(playerId, {
			type: MESSAGE_TYPES.GAME_STATE,
			board: room.board,
			currentTurn: room.currentTurn,
			players: room.players,
		});
	},
};

function eliminateAndEmit(playerId: string): void {
	const room = getRoomForPlayer(playerId);
	if (!room) {
		return;
	}

	const playerIndex = room.players.findIndex((player) => player.id === playerId);
	const leavingPlayer = room.players[playerIndex];
	if (playerIndex === -1 || !leavingPlayer) {
		return;
	}

	leavingPlayer.eliminated = true;
	leavingPlayer.eliminatedTurn ??= room.turnCount;
	room.forfeitedPlayerIds.add(leavingPlayer.id);

	if (room.status !== "active") {
		roomService.destroyRoom(room);
		return;
	}

	const winner = getWinner(room);
	if (winner) {
		endGame(room, winner);
		return;
	}

	if (room.players.every((player) => player.eliminated)) {
		roomService.destroyRoom(room);
		return;
	}

	if (room.currentTurn === playerIndex) {
		room.currentTurn = advanceTurn(room);
	}

	emitGameState(room);
}

function endGame(room: Room, winner: NonNullable<ReturnType<typeof getWinner>>): void {
	room.status = "finished";
	const scoreDeltas = matchService.computeScoreDeltas(room, winner.id);
	emitToRoom(room, {
		type: MESSAGE_TYPES.GAME_OVER,
		mode: room.mode,
		winner: { id: winner.id, name: winner.name },
		...(Object.keys(scoreDeltas).length > 0 && { score_deltas: scoreDeltas }),
	});

	const playerIds = room.players.map((player) => player.id);
	const roomSnapshot = matchService.snapshot(room);
	roomService.destroyRoom(room);

	void matchService.persistFinishedMatch(roomSnapshot, winner.id).catch((error: unknown) => {
		logger.error("finished match persistence failed", {
			roomId: roomSnapshot.id,
			error: error instanceof Error ? error.message : String(error),
		});
		for (const playerId of playerIds) {
			emitToPlayer(playerId, {
				type: MESSAGE_TYPES.ERROR,
				code: ERROR_CODES.MATCH_NOT_SAVED,
				message: "Match result could not be saved. Leaderboard may not reflect this game.",
			});
		}
	});
}

function getRoomForPlayer(playerId: string): Room | null {
	const roomId = playerRooms.get(playerId);
	return roomId ? (rooms.get(roomId) ?? null) : null;
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

function emitGameState(room: Room): void {
	emitToRoom(room, {
		type: MESSAGE_TYPES.GAME_STATE,
		board: room.board,
		currentTurn: room.currentTurn,
		players: room.players,
	});
}
