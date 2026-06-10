import type { IncomingMessage } from "http";
import WebSocket, { WebSocketServer } from "ws";
import {
	LIMITS,
	WS_GLOBAL_MSG_BUDGET,
	WS_IDLE_TIMEOUT_MS,
	WS_MAX_PAYLOAD_BYTES,
	WS_PING_INTERVAL_MS,
	WS_RATE_LIMIT_MAX_PER_IP,
	WS_RATE_LIMIT_WINDOW_MS,
} from "../constants/app.constants";
import { config } from "../constants/config";
import { anonymizeIp, getClientIp } from "../utils/client_ip";
import { logSecurityEvent } from "../utils/security_logger";
import { getLogger } from "./logger";

const logger = getLogger("realtime");

// --- WebSocketServer singleton ---

let wss: WebSocketServer | null = null;

export function createWSS(): WebSocketServer {
	if (wss) return wss;

	wss = new WebSocketServer({
		noServer: true,
		maxPayload: WS_MAX_PAYLOAD_BYTES,
		// Echo the first offered subprotocol so browsers passing the JWT as
		// a subprotocol (new WebSocket(url, token)) complete the handshake.
		handleProtocols: (protocols) => [...protocols][0] ?? false,
	});

	const pingInterval = setInterval(() => {
		wss?.clients.forEach((socket) => {
			if (socketLiveness.get(socket) === false) {
				logger.info("reaping dead socket via heartbeat");
				socket.terminate();
				return;
			}
			socketLiveness.set(socket, false);
			socket.ping();
		});
	}, WS_PING_INTERVAL_MS);

	wss.on("close", () => clearInterval(pingInterval));
	return wss;
}

export function getWSS(): WebSocketServer {
	if (!wss) throw new Error("WSS not initialized — call createWSS() first");
	return wss;
}

// --- Player socket registry (playerId → socket) ---

const playerSockets = new Map<string, WebSocket>();

export function registerPlayerSocket(playerId: string, socket: WebSocket): void {
	playerSockets.set(playerId, socket);
}

export function unregisterPlayerSocket(playerId: string, socket: WebSocket): void {
	if (playerSockets.get(playerId) === socket) {
		playerSockets.delete(playerId);
	}
}

export function getPlayerSocket(playerId: string): WebSocket | undefined {
	return playerSockets.get(playerId);
}

export function isPlayerConnected(playerId: string): boolean {
	return playerSockets.has(playerId);
}

export function sendToPlayer(playerId: string, event: string, data: unknown): void {
	const socket = playerSockets.get(playerId);
	if (!socket || socket.readyState !== WebSocket.OPEN) return;
	socket.send(JSON.stringify({ event, data }));
}

export function sendToPlayers(playerIds: string[], event: string, data: unknown): void {
	const msg = JSON.stringify({ event, data });
	for (const playerId of playerIds) {
		const socket = playerSockets.get(playerId);
		if (socket && socket.readyState === WebSocket.OPEN) {
			socket.send(msg);
		}
	}
}

// --- Connection caps, message budgets, liveness ---

const ipRateLimits = new Map<string, { count: number; windowStart: number }>();
const globalMsgBucket = { count: 0, windowStart: Date.now() };
const socketLiveness = new WeakMap<WebSocket, boolean>();
const idleTimeouts = new WeakMap<WebSocket, NodeJS.Timeout>();
const perIp = new Map<string, number>();
let totalConnections = 0;

export type MessageBudgetResult = "allowed" | "server_busy" | "rate_limited" | "disconnect";

export type UpgradeLimitResult = { ok: true } | { ok: false; code: number; reason: string };

export function checkUpgradeLimits(req: IncomingMessage): UpgradeLimitResult {
	const ip = getClientIp(req);
	const origin = req.headers.origin ?? "";

	const originOk = config.ALLOWED_ORIGINS.length === 0 || (origin && config.ALLOWED_ORIGINS.includes(origin));
	if (!originOk) {
		logSecurityEvent("rejected_origin", { ip, origin });
		logger.warn("websocket upgrade rejected: origin not allowed", { origin });
		return { ok: false, code: 403, reason: "origin not allowed" };
	}

	if (totalConnections >= LIMITS.MAX_CONNECTIONS) {
		logSecurityEvent("rate_limit_trip", { ip, details: "server connection cap reached", totalConnections });
		logger.warn("websocket upgrade rejected: server full", { ip: anonymizeIp(ip), totalConnections });
		return { ok: false, code: 503, reason: "server full" };
	}

	const currentIpConnections = perIp.get(ip) ?? 0;
	if (currentIpConnections >= LIMITS.MAX_CONNECTIONS_PER_IP) {
		logSecurityEvent("rate_limit_trip", { ip, details: "IP connection cap reached", currentIpConnections });
		logger.warn("websocket upgrade rejected: too many connections from IP", { ip: anonymizeIp(ip), currentIpConnections });
		return { ok: false, code: 429, reason: "too many connections" };
	}

	return { ok: true };
}

export function trackSocket(socket: WebSocket, req: IncomingMessage): void {
	const ip = getClientIp(req);
	totalConnections += 1;
	perIp.set(ip, (perIp.get(ip) ?? 0) + 1);
	socketLiveness.set(socket, true);
	socket.on("pong", () => socketLiveness.set(socket, true));
	socket.on("error", (error) => {
		if (error.message.includes("Max payload size exceeded") || error.message.includes("payload")) {
			logSecurityEvent("malformed_frame", { ip, details: "oversized WS frame", error: error.message });
		}
	});
	touchSocket(socket);

	socket.on("close", () => {
		const handle = idleTimeouts.get(socket);
		if (handle) {
			clearTimeout(handle);
			idleTimeouts.delete(socket);
		}

		totalConnections = Math.max(0, totalConnections - 1);
		const count = perIp.get(ip) ?? 1;
		if (count <= 1) {
			perIp.delete(ip);
			ipRateLimits.delete(ip);
		} else {
			perIp.set(ip, count - 1);
		}
	});
}

export function touchSocket(socket: WebSocket): void {
	const existing = idleTimeouts.get(socket);
	if (existing) {
		clearTimeout(existing);
	}

	const handle = setTimeout(() => {
		logger.info("terminating idle socket");
		socket.terminate();
	}, WS_IDLE_TIMEOUT_MS);
	idleTimeouts.set(socket, handle);
}

export function consumeMessageBudget(ip: string, playerId: string): MessageBudgetResult {
	const now = Date.now();
	if (now - globalMsgBucket.windowStart > WS_RATE_LIMIT_WINDOW_MS) {
		globalMsgBucket.count = 0;
		globalMsgBucket.windowStart = now;
	}
	globalMsgBucket.count += 1;
	if (globalMsgBucket.count > WS_GLOBAL_MSG_BUDGET) {
		return "server_busy";
	}

	let ipBucket = ipRateLimits.get(ip);
	if (!ipBucket || now - ipBucket.windowStart > WS_RATE_LIMIT_WINDOW_MS) {
		ipBucket = { count: 0, windowStart: now };
	}
	ipBucket.count += 1;
	ipRateLimits.set(ip, ipBucket);

	if (ipBucket.count > Math.floor(WS_RATE_LIMIT_MAX_PER_IP * 1.5)) {
		logSecurityEvent("rate_limit_trip", { ip, details: "sustained WS message abuse", playerId });
		logger.warn("terminating socket due to sustained message rate abuse", { ip: anonymizeIp(ip), playerId });
		return "disconnect";
	}

	if (ipBucket.count > WS_RATE_LIMIT_MAX_PER_IP) {
		logSecurityEvent("rate_limit_trip", { ip, details: "WS message rate limit exceeded", playerId });
		return "rate_limited";
	}

	return "allowed";
}
