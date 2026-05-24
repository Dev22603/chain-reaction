import type WebSocket from "ws";
import type { ConnectionIdentity } from "../types/connection.js";
import type { Player, Room } from "../types/game.js";

export interface PendingReconnect {
	roomId: string;
	expiresAt: number;
	timeoutHandle: ReturnType<typeof setTimeout>;
}

export const players = new Map<string, WebSocket>();
export const connections = new Map<string, ConnectionIdentity>();
export const queues = new Map<string, Player[]>();
export const rooms = new Map<string, Room>();
export const playerRooms = new Map<string, string>();
export const pendingReconnects = new Map<string, PendingReconnect>();
export const roomCodes = new Map<string, string>(); // inviteCode -> roomId
export const rankedCompletions = new Map<string, number[]>(); // playerId -> completion timestamps
