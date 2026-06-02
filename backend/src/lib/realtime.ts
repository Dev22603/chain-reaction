import type { IncomingMessage, Server } from "node:http";
import type WebSocket from "ws";
import { WebSocketServer } from "ws";
import {
	LIMITS,
	WS_GLOBAL_MSG_BUDGET,
	WS_IDLE_TIMEOUT_MS,
	WS_MAX_PAYLOAD_BYTES,
	WS_PING_INTERVAL_MS,
	WS_RATE_LIMIT_MAX_PER_IP,
	WS_RATE_LIMIT_WINDOW_MS,
} from "../constants/app.constants.js";
import { config } from "../constants/config.js";
import { anonymizeIp, getClientIp } from "../utils/clientIp.js";
import { logSecurityEvent } from "../utils/securityLogger.js";
import { getLogger } from "./logger.js";

const logger = getLogger("realtime");
const ipRateLimits = new Map<string, { count: number; windowStart: number }>();
const globalMsgBucket = { count: 0, windowStart: Date.now() };
const socketLiveness = new WeakMap<WebSocket, boolean>();
const idleTimeouts = new WeakMap<WebSocket, NodeJS.Timeout>();
const perIp = new Map<string, number>();
let totalConnections = 0;

export type MessageBudgetResult = "allowed" | "server_busy" | "rate_limited" | "disconnect";

export function createWSS(server: Server): WebSocketServer {
	const wss = new WebSocketServer({
		server,
		maxPayload: WS_MAX_PAYLOAD_BYTES,
		verifyClient: verifyClient,
	});

	const pingInterval = setInterval(() => {
		wss.clients.forEach((socket) => {
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
	wss.on("connection", trackSocket);
	return wss;
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

function verifyClient(
	info: { origin: string; req: IncomingMessage },
	done: (result: boolean, code?: number, message?: string) => void,
): void {
	const originOk = config.ALLOWED_ORIGINS.length === 0 || (info.origin && config.ALLOWED_ORIGINS.includes(info.origin));
	const ip = getClientIp(info.req);
	if (!originOk) {
		logSecurityEvent("rejected_origin", { ip, origin: info.origin });
		logger.warn("websocket upgrade rejected: origin not allowed", { origin: info.origin });
		done(false, 1008, "origin not allowed");
		return;
	}

	if (totalConnections >= LIMITS.MAX_CONNECTIONS) {
		logSecurityEvent("rate_limit_trip", { ip, details: "server connection cap reached", totalConnections });
		logger.warn("websocket upgrade rejected: server full", { ip: anonymizeIp(ip), totalConnections });
		done(false, 1013, "server full");
		return;
	}

	const currentIpConnections = perIp.get(ip) ?? 0;
	if (currentIpConnections >= LIMITS.MAX_CONNECTIONS_PER_IP) {
		logSecurityEvent("rate_limit_trip", { ip, details: "IP connection cap reached", currentIpConnections });
		logger.warn("websocket upgrade rejected: too many connections from IP", { ip: anonymizeIp(ip), currentIpConnections });
		done(false, 1013, "too many connections");
		return;
	}

	done(true);
}

function trackSocket(socket: WebSocket, request: IncomingMessage): void {
	const ip = getClientIp(request);
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
