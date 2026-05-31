import type { Server } from "node:http";
import type { WebSocketServer } from "ws";
import { createWSS } from "../lib/realtime.js";
import { handleGameConnection } from "./game.gateway.js";
import { registerGamePublisher } from "./game.publisher.js";

export function attachWebSocketServer(server: Server): WebSocketServer {
	registerGamePublisher();
	const wss = createWSS(server);
	wss.on("connection", (socket, request) => void handleGameConnection(socket, request));
	return wss;
}
