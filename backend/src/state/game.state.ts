import type { Player, Room } from "../types/game.js";

export const queues = new Map<string, Player[]>();
export const rooms = new Map<string, Room>();
export const playerRooms = new Map<string, string>();
export const roomCodes = new Map<string, string>(); // inviteCode -> roomId
export const rankedCompletions = new Map<string, number[]>(); // playerId -> completion timestamps
