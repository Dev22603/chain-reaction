import { MESSAGE_TYPES } from "../constants/app.constants.js";
import { applyMove, isEliminated } from "../game/gameLogic.js";
import { playerRooms, rooms } from "../state/memory.js";
import type { PlayerIndex, Room } from "../types/game.js";
import type { MakeMoveMessage } from "../types/protocol.js";
import { broadcast } from "../utils/broadcast.js";

export function handleMove(playerId: string, payload: MakeMoveMessage): void {
  const room = getRoomForPlayer(playerId);
  if (!room) {
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
      player.eliminated = isEliminated(room.board, index);
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

  const winner = getWinner(room);
  if (winner) {
    endGame(room, winner);
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
    players: room.players
  });
}

function endGame(room: Room, winner: NonNullable<ReturnType<typeof getWinner>>): void {
  broadcast(room, {
    type: MESSAGE_TYPES.GAME_OVER,
    winner: {
      id: winner.id,
      name: winner.name
    }
  });

  rooms.delete(room.id);
  for (const player of room.players) {
    playerRooms.delete(player.id);
  }
}
