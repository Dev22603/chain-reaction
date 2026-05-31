import { randomUUID } from "node:crypto";
import { ERROR_CODES, GAME_MODES, LIMITS, MESSAGE_TYPES, ROOM_IDLE_TTL_MS } from "../constants/app.constants.js";
import { SERVER_MESSAGES } from "../constants/app.messages.js";
import { createBoard } from "../game/game.logic.js";
import { emitToPlayer, emitToRoom } from "../lib/events.js";
import { getLogger } from "../lib/logger.js";
import { connections, pendingReconnects, players } from "../state/connection.state.js";
import { playerRooms, roomCodes, rooms } from "../state/game.state.js";
import type { GameMode, Player, Room } from "../types/game.js";
import type { CreateRoomMessage, JoinRoomByCodeMessage } from "../types/protocol.js";
import { ApiError } from "../utils/api_error.js";

const logger = getLogger("room.service");
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const roomService = {
	createMatchedRoom(roomPlayers: Player[], mode: GameMode, gridRows: number, gridCols: number): void {
		assertRoomCapacity();

		const room: Room = {
			id: randomUUID(),
			mode,
			isPrivate: false,
			players: roomPlayers.map((player) => ({ ...player, eliminated: false })),
			gridRows,
			gridCols,
			maxPlayers: roomPlayers.length,
			board: createBoard(gridRows, gridCols),
			currentTurn: 0,
			turnCount: 0,
			startedAt: new Date(),
			status: "active",
			forfeitedPlayerIds: new Set(),
		};

		rooms.set(room.id, room);
		for (const player of room.players) {
			playerRooms.set(player.id, room.id);
		}

		emitGameStarted(room);
	},

	createPrivateRoom(playerId: string, payload: CreateRoomMessage): void {
		if (playerRooms.has(playerId)) {
			return;
		}

		assertRoomCapacity();

		const identity = connections.get(playerId);
		const code = generateInviteCode();
		const player: Player = {
			id: playerId,
			name: identity && !identity.isGuest ? identity.displayName : payload.playerName,
			isGuest: identity?.isGuest ?? true,
			eliminated: false,
			eliminatedTurn: null,
		};
		const room: Room = {
			id: randomUUID(),
			mode: GAME_MODES.CASUAL,
			isPrivate: true,
			inviteCode: code,
			players: [player],
			gridRows: payload.gridRows,
			gridCols: payload.gridCols,
			maxPlayers: payload.maxPlayers,
			board: createBoard(payload.gridRows, payload.gridCols),
			currentTurn: 0,
			turnCount: 0,
			startedAt: new Date(),
			status: "lobby",
			forfeitedPlayerIds: new Set(),
		};

		rooms.set(room.id, room);
		roomCodes.set(code, room.id);
		playerRooms.set(playerId, room.id);

		logger.info("private room created", { roomId: room.id, code, playerId });

		emitToPlayer(playerId, { type: MESSAGE_TYPES.ROOM_CREATED, roomId: room.id, code });
		emitGameState(room);
	},

	joinPrivateRoom(playerId: string, payload: JoinRoomByCodeMessage): void {
		if (playerRooms.has(playerId)) {
			return;
		}

		const roomId = roomCodes.get(payload.code);
		if (!roomId) {
			throw new ApiError(ERROR_CODES.ROOM_CODE_INVALID, "Invalid invite code.");
		}

		const room = rooms.get(roomId);
		if (!room) {
			throw new ApiError(ERROR_CODES.ROOM_NOT_FOUND, "Room no longer exists.");
		}

		if (room.players.length >= room.maxPlayers) {
			throw new ApiError(ERROR_CODES.ROOM_FULL, "Room is full.");
		}

		const identity = connections.get(playerId);
		room.players.push({
			id: playerId,
			name: identity && !identity.isGuest ? identity.displayName : payload.playerName,
			isGuest: identity?.isGuest ?? true,
			eliminated: false,
			eliminatedTurn: null,
		});
		playerRooms.set(playerId, roomId);

		logger.info("player joined private room", { roomId, playerId, playerCount: room.players.length });

		if (room.players.length === room.maxPlayers) {
			room.status = "active";
			emitGameStarted(room);
			return;
		}

		emitToRoom(room, {
			type: MESSAGE_TYPES.ROOM_CREATED,
			roomId: room.id,
			code: room.inviteCode ?? payload.code,
		});
	},

	destroyRoom(room: Room): void {
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
	},
};

let reaperInterval: NodeJS.Timeout | null = null;

export function startRoomReaper(): void {
	if (reaperInterval) return;

	reaperInterval = setInterval(() => {
		logger.info("running periodic room reaper");
		const now = Date.now();
		for (const room of Array.from(rooms.values())) {
			if (!room.players.some((player) => players.has(player.id))) {
				logger.info("reaper: destroying room with no connected players", { roomId: room.id });
				roomService.destroyRoom(room);
				continue;
			}

			if (room.isPrivate && room.players.length < room.maxPlayers) {
				const age = now - room.startedAt.getTime();
				if (age > ROOM_IDLE_TTL_MS) {
					logger.info("reaper: destroying unfilled private room past TTL", { roomId: room.id, ageMs: age });
					roomService.destroyRoom(room);
				}
			}
		}
	}, 60_000);
}

export function stopRoomReaper(): void {
	if (!reaperInterval) return;

	clearInterval(reaperInterval);
	reaperInterval = null;
	logger.info("stopped periodic room reaper");
}

function assertRoomCapacity(): void {
	if (rooms.size >= LIMITS.MAX_ROOMS) {
		throw new ApiError(ERROR_CODES.SERVER_BUSY, SERVER_MESSAGES.SERVER_BUSY);
	}
}

function generateInviteCode(): string {
	let code: string;
	do {
		code = Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
	} while (roomCodes.has(code));
	return code;
}

function emitGameStarted(room: Room): void {
	emitToRoom(room, {
		type: MESSAGE_TYPES.GAME_START,
		roomId: room.id,
		mode: room.mode,
		players: room.players,
		gridRows: room.gridRows,
		gridCols: room.gridCols,
	});
	emitGameState(room);
}

function emitGameState(room: Room): void {
	emitToRoom(room, {
		type: MESSAGE_TYPES.GAME_STATE,
		board: room.board,
		currentTurn: room.currentTurn,
		players: room.players,
	});
}
