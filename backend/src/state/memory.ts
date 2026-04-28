import type WebSocket from "ws";
import type { Player, Room } from "../types/game.js";

export const players = new Map<string, WebSocket>();
export const queues = new Map<string, Player[]>();
export const rooms = new Map<string, Room>();
export const playerRooms = new Map<string, string>();
