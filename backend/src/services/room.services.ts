import { randomUUID } from "crypto";
import { DEFAULT_ROOM, LIMITS, ROOM_IDLE_TTL_MS } from "../constants/app.constants";
import { GAME_MESSAGES } from "../constants/app.messages";
import { SOCKET_EVENTS } from "../constants/socket.events";
import { Board, PlayerIndex, createBoard } from "../game/game.logic";
import { getLogger } from "../lib/logger";
import { isPlayerConnected, sendToPlayer, sendToPlayers } from "../lib/realtime";
import type { CreateRoomInput, JoinRoomByCodeInput } from "../schemas/game.schemas";
import type { SocketUser } from "../types/socket";
import { ApiError } from "../utils/api_error";

const logger = getLogger("room.service");
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export interface Player {
	id: string;
	name: string;
	isGuest: boolean;
	eliminated: boolean;
	eliminatedTurn: number | null;
}

export interface Room {
	id: string;
	isPrivate: boolean;
	inviteCode?: string;
	players: Player[];
	gridRows: number;
	gridCols: number;
	maxPlayers: number;
	board: Board;
	currentTurn: PlayerIndex;
	turnCount: number;
	startedAt: Date;
	status: "lobby" | "active" | "finished";
	forfeitedPlayerIds: Set<string>;
}

// In-memory game state owned by this service
const rooms = new Map<string, Room>();
const playerRooms = new Map<string, string>(); // playerId -> roomId
const roomCodes = new Map<string, string>(); // inviteCode -> roomId

export const roomService = {
	getRoomForPlayer(playerId: string): Room | null {
		const roomId = playerRooms.get(playerId);
		return roomId ? (rooms.get(roomId) ?? null) : null;
	},

	isInRoom(playerId: string): boolean {
		return playerRooms.has(playerId);
	},

	assertCapacity(): void {
		if (rooms.size >= LIMITS.MAX_ROOMS) {
			throw new ApiError(503, GAME_MESSAGES.SERVER_BUSY);
		}
	},

	createMatchedRoom(roomPlayers: Player[], gridRows: number, gridCols: number): void {
		this.assertCapacity();

		const room: Room = {
			id: randomUUID(),
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

	createPrivateRoom(user: SocketUser, input: CreateRoomInput): void {
		if (playerRooms.has(user.id)) {
			return;
		}

		this.assertCapacity();

		const code = generateInviteCode();
		buildPrivateRoom(user, input.playerName, code, input.gridRows, input.gridCols, input.maxPlayers);
	},

	joinPrivateRoom(user: SocketUser, input: JoinRoomByCodeInput): void {
		if (playerRooms.has(user.id)) {
			return;
		}

		const roomId = roomCodes.get(input.code);
		if (!roomId) {
			// Unknown code: instead of rejecting, open a fresh room under that code
			// so friends can rendezvous on any code they agree on.
			this.assertCapacity();
			buildPrivateRoom(
				user,
				input.playerName,
				input.code,
				DEFAULT_ROOM.GRID_ROWS,
				DEFAULT_ROOM.GRID_COLS,
				DEFAULT_ROOM.MAX_PLAYERS,
			);
			return;
		}

		const room = rooms.get(roomId);
		if (!room) {
			throw new ApiError(404, GAME_MESSAGES.ROOM_GONE);
		}

		if (room.players.length >= room.maxPlayers) {
			throw new ApiError(409, GAME_MESSAGES.ROOM_FULL);
		}

		room.players.push({
			id: user.id,
			name: user.isGuest ? input.playerName : user.name,
			isGuest: user.isGuest,
			eliminated: false,
			eliminatedTurn: null,
		});
		playerRooms.set(user.id, roomId);

		logger.info("player joined private room", { roomId, playerId: user.id, playerCount: room.players.length });

		if (room.players.length === room.maxPlayers) {
			room.status = "active";
			emitGameStarted(room);
			return;
		}

		sendToPlayers(
			room.players.map((player) => player.id),
			SOCKET_EVENTS.GAME.ROOM_CREATED,
			{ roomId: room.id, code: room.inviteCode ?? input.code },
		);
	},

	destroyRoom(room: Room): void {
		rooms.delete(room.id);
		if (room.inviteCode) {
			roomCodes.delete(room.inviteCode);
		}
		for (const player of room.players) {
			playerRooms.delete(player.id);
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
			if (!room.players.some((player) => isPlayerConnected(player.id))) {
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

function buildPrivateRoom(
	user: SocketUser,
	playerName: string,
	code: string,
	gridRows: number,
	gridCols: number,
	maxPlayers: number,
): void {
	const player: Player = {
		id: user.id,
		name: user.isGuest ? playerName : user.name,
		isGuest: user.isGuest,
		eliminated: false,
		eliminatedTurn: null,
	};
	const room: Room = {
		id: randomUUID(),
		isPrivate: true,
		inviteCode: code,
		players: [player],
		gridRows,
		gridCols,
		maxPlayers,
		board: createBoard(gridRows, gridCols),
		currentTurn: 0,
		turnCount: 0,
		startedAt: new Date(),
		status: "lobby",
		forfeitedPlayerIds: new Set(),
	};

	rooms.set(room.id, room);
	roomCodes.set(code, room.id);
	playerRooms.set(user.id, room.id);

	logger.info("private room created", { roomId: room.id, code, playerId: user.id });

	sendToPlayer(user.id, SOCKET_EVENTS.GAME.ROOM_CREATED, { roomId: room.id, code });
	emitGameState(room);
}

function generateInviteCode(): string {
	let code: string;
	do {
		code = Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
	} while (roomCodes.has(code));
	return code;
}

function emitGameStarted(room: Room): void {
	sendToPlayers(
		room.players.map((player) => player.id),
		SOCKET_EVENTS.GAME.START,
		{
			roomId: room.id,
			players: room.players,
			gridRows: room.gridRows,
			gridCols: room.gridCols,
		},
	);
	emitGameState(room);
}

function emitGameState(room: Room): void {
	sendToPlayers(
		room.players.map((player) => player.id),
		SOCKET_EVENTS.GAME.STATE,
		{
			board: room.board,
			currentTurn: room.currentTurn,
			players: room.players,
		},
	);
}
