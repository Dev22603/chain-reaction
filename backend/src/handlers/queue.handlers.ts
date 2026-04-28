import { randomUUID } from "node:crypto";
import { MESSAGE_TYPES } from "../constants/app.constants.js";
import { createBoard } from "../game/gameLogic.js";
import { players, playerRooms, queues, rooms } from "../state/memory.js";
import type { Player, Room } from "../types/game.js";
import type { JoinQueueMessage } from "../types/protocol.js";
import { broadcast, send } from "../utils/broadcast.js";

function getQueueKey(gridRows: number, gridCols: number, maxPlayers: number): string {
  return `${gridRows}x${gridCols}x${maxPlayers}`;
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
          position: index + 1,
          maxPlayers: Number(key.split("x")[2])
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

  const key = getQueueKey(payload.gridRows, payload.gridCols, payload.maxPlayers);
  const queue = queues.get(key) ?? [];
  const player: Player = {
    id: playerId,
    name: payload.playerName,
    eliminated: false
  };

  queue.push(player);
  queues.set(key, queue);

  send(players.get(playerId), {
    type: MESSAGE_TYPES.QUEUED,
    position: queue.length,
    maxPlayers: payload.maxPlayers
  });

  if (queue.length >= payload.maxPlayers) {
    const roomPlayers = queue.splice(0, payload.maxPlayers);
    if (queue.length === 0) {
      queues.delete(key);
    }

    createRoom(roomPlayers, payload.gridRows, payload.gridCols);
  }
}

export function handleLeaveQueue(playerId: string): void {
  removeFromAllQueues(playerId);
}

function createRoom(roomPlayers: Player[], gridRows: number, gridCols: number): void {
  const room: Room = {
    id: randomUUID(),
    players: roomPlayers.map((player) => ({ ...player, eliminated: false })),
    gridRows,
    gridCols,
    board: createBoard(gridRows, gridCols),
    currentTurn: 0,
    turnCount: 0
  };

  rooms.set(room.id, room);
  for (const player of room.players) {
    playerRooms.set(player.id, room.id);
  }

  broadcast(room, {
    type: MESSAGE_TYPES.GAME_START,
    roomId: room.id,
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
