import WebSocket from "ws";
import { players } from "../state/memory.js";
import type { Room } from "../types/game.js";
import type { ServerMessage } from "../types/protocol.js";

export function send(socket: WebSocket | undefined, data: ServerMessage): void {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }

  socket.send(JSON.stringify(data));
}

export function broadcast(room: Room, message: ServerMessage): void {
  for (const player of room.players) {
    send(players.get(player.id), message);
  }
}
