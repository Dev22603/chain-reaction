import { EventEmitter } from "node:events";
import type { Room } from "../types/game.js";
import type { ServerMessage } from "../types/protocol.js";

export interface SocketPublication {
	playerIds: string[];
	message: ServerMessage;
}

const globalForEvents = globalThis as typeof globalThis & { domainEvents?: EventEmitter };

export const domainEvents = globalForEvents.domainEvents ?? new EventEmitter();

if (process.env.NODE_ENV !== "production") {
	globalForEvents.domainEvents = domainEvents;
}

export function emitToPlayer(playerId: string, message: ServerMessage): void {
	domainEvents.emit("socket:publish", { playerIds: [playerId], message } satisfies SocketPublication);
}

export function emitToRoom(room: Room, message: ServerMessage): void {
	domainEvents.emit("socket:publish", {
		playerIds: room.players.map((player) => player.id),
		message,
	} satisfies SocketPublication);
}
