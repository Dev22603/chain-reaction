import type WebSocket from "ws";
import type { ConnectionIdentity } from "../types/connection.js";
import type { Player, Room } from "../types/game.js";

export const players = new Map<string, WebSocket>();
export const connections = new Map<string, ConnectionIdentity>();
export const queues = new Map<string, Player[]>();
export const rooms = new Map<string, Room>();
export const playerRooms = new Map<string, string>();
