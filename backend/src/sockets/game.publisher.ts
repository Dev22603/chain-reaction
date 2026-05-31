import WebSocket from "ws";
import { domainEvents, type SocketPublication } from "../lib/events.js";
import { players } from "../state/connection.state.js";
import type { ServerMessage } from "../types/protocol.js";

export function send(socket: WebSocket | undefined, message: ServerMessage): void {
	if (!socket || socket.readyState !== WebSocket.OPEN) {
		return;
	}

	socket.send(JSON.stringify(message));
}

function publish({ playerIds, message }: SocketPublication): void {
	for (const playerId of playerIds) {
		send(players.get(playerId), message);
	}
}

export function registerGamePublisher(): void {
	domainEvents.removeListener("socket:publish", publish);
	domainEvents.on("socket:publish", publish);
}
