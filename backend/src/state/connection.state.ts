import type WebSocket from "ws";
import type { ConnectionIdentity } from "../types/connection.js";

export interface PendingReconnect {
	roomId: string;
	expiresAt: number;
	timeoutHandle: ReturnType<typeof setTimeout>;
}

export const players = new Map<string, WebSocket>();
export const connections = new Map<string, ConnectionIdentity>();
export const pendingReconnects = new Map<string, PendingReconnect>();
