import { randomUUID } from "node:crypto";
import { ERROR_CODES, GAME_MODES, MESSAGE_TYPES } from "../constants/app.constants.js";
import { createBoard } from "../game/gameLogic.js";
import { getLogger } from "../lib/logger.js";
import { connections, players, playerRooms, roomCodes, rooms } from "../state/memory.js";
import type { Player, Room } from "../types/game.js";
import type { CreateRoomMessage, JoinRoomByCodeMessage } from "../types/protocol.js";
import { ApiError } from "../utils/api_error.js";
import { broadcast, send } from "../utils/broadcast.js";

const logger = getLogger("room.handlers");

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode(): string {
  let code: string;
  do {
    code = Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
  } while (roomCodes.has(code));
  return code;
}

export function handleCreateRoom(playerId: string, payload: CreateRoomMessage): void {
  if (playerRooms.has(playerId)) {
    return;
  }

  const identity = connections.get(playerId);
  const isGuest = identity?.isGuest ?? true;
  const name = identity && !identity.isGuest ? identity.displayName : payload.playerName;

  const code = generateInviteCode();
  const roomId = randomUUID();

  const player: Player = {
    id: playerId,
    name,
    isGuest,
    eliminated: false,
    eliminatedTurn: null
  };

  const room: Room = {
    id: roomId,
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
    forfeitedPlayerIds: new Set()
  };

  rooms.set(roomId, room);
  roomCodes.set(code, roomId);
  playerRooms.set(playerId, roomId);

  logger.info("private room created", { roomId, code, playerId });

  send(players.get(playerId), {
    type: MESSAGE_TYPES.ROOM_CREATED,
    roomId,
    code
  });

  send(players.get(playerId), {
    type: MESSAGE_TYPES.GAME_STATE,
    board: room.board,
    currentTurn: room.currentTurn,
    players: room.players
  });
}

export function handleJoinRoomByCode(playerId: string, payload: JoinRoomByCodeMessage): void {
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
  const isGuest = identity?.isGuest ?? true;
  const name = identity && !identity.isGuest ? identity.displayName : payload.playerName;

  const player: Player = {
    id: playerId,
    name,
    isGuest,
    eliminated: false,
    eliminatedTurn: null
  };

  room.players.push(player);
  playerRooms.set(playerId, roomId);

  logger.info("player joined private room", { roomId, playerId, playerCount: room.players.length });

  if (room.players.length === room.maxPlayers) {
    broadcast(room, {
      type: MESSAGE_TYPES.GAME_START,
      roomId: room.id,
      mode: room.mode,
      players: room.players,
      gridRows: room.gridRows,
      gridCols: room.gridCols
    });

    broadcast(room, {
      type: MESSAGE_TYPES.GAME_STATE,
      board: room.board,
      currentTurn: room.currentTurn,
      players: room.players
    });
  } else {
    // Room not full yet — keep all members in the waiting state.
    // Send room_created so every member (including the new joiner) stays
    // on the queued screen and sees the invite code.
    broadcast(room, {
      type: MESSAGE_TYPES.ROOM_CREATED,
      roomId: room.id,
      code: room.inviteCode ?? payload.code
    });
  }
}
