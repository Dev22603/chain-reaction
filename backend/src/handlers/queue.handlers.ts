import { randomUUID } from "node:crypto";
import { ERROR_CODES, GAME_MODES, MESSAGE_TYPES } from "../constants/app.constants.js";
import { SERVER_MESSAGES } from "../constants/app.messages.js";
import { createBoard } from "../game/gameLogic.js";
import { connections, players, playerRooms, queues, rooms } from "../state/memory.js";
import type { GameMode, Player, Room } from "../types/game.js";
import type { JoinQueueMessage } from "../types/protocol.js";
import { ApiError } from "../utils/api_error.js";
import { broadcast, send } from "../utils/broadcast.js";

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
    const nextQueue = queue.filter((player) => player.id !== playerId);
    if (nextQueue.length === 0) {
      queues.delete(key);
    } else {
      queues.set(key, nextQueue);
      nextQueue.forEach((player, index) => {
        send(players.get(player.id), {
          type: MESSAGE_TYPES.QUEUED,
          mode: getQueueMode(key),
          position: index + 1,
          maxPlayers: getQueueMaxPlayers(key)
        });
      });
    }
  }
}

export function handleJoinQueue(playerId: string, payload: JoinQueueMessage): void {
  if (playerRooms.has(playerId)) {
    return;
  }

  removeFromAllQueues(playerId);

  const identity = connections.get(playerId);
  const isGuest = identity?.isGuest ?? true;
  if (payload.mode === GAME_MODES.RANKED && isGuest) {
    throw new ApiError(ERROR_CODES.NOT_AUTHENTICATED, SERVER_MESSAGES.RANKED_REQUIRES_AUTH, [], 401);
  }

  const key = getQueueKey(payload.mode, payload.gridRows, payload.gridCols, payload.maxPlayers);
  const queue = queues.get(key) ?? [];
  const player: Player = {
    id: playerId,
    name: identity && !identity.isGuest ? identity.displayName : payload.playerName,
    isGuest,
    eliminated: false,
    eliminatedTurn: null
  };

  queue.push(player);
  queues.set(key, queue);

  send(players.get(playerId), {
    type: MESSAGE_TYPES.QUEUED,
    mode: payload.mode,
    position: queue.length,
    maxPlayers: payload.maxPlayers
  });

  if (queue.length >= payload.maxPlayers) {
    const roomPlayers = queue.splice(0, payload.maxPlayers);
    if (queue.length === 0) {
      queues.delete(key);
    }

    createRoom(roomPlayers, payload.mode, payload.gridRows, payload.gridCols);
  }
}

export function handleLeaveQueue(playerId: string): void {
  removeFromAllQueues(playerId);
}

function createRoom(roomPlayers: Player[], mode: GameMode, gridRows: number, gridCols: number): void {
  const room: Room = {
    id: randomUUID(),
    mode,
    players: roomPlayers.map((player) => ({ ...player, eliminated: false })),
    gridRows,
    gridCols,
    maxPlayers: roomPlayers.length,
    board: createBoard(gridRows, gridCols),
    currentTurn: 0,
    turnCount: 0,
    startedAt: new Date(),
    forfeitedPlayerIds: new Set()
  };

  rooms.set(room.id, room);
  for (const player of room.players) {
    playerRooms.set(player.id, room.id);
  }

  broadcast(room, {
    type: MESSAGE_TYPES.GAME_START,
    roomId: room.id,
    mode,
    players: room.players,
    gridRows,
    gridCols
  });

  broadcast(room, {
    type: MESSAGE_TYPES.GAME_STATE,
    board: room.board,
    currentTurn: room.currentTurn,
    players: room.players
  });
}
