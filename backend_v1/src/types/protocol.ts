import type { Board, GameMode, Player } from "./game.js";

export interface JoinQueueMessage {
	type: "join_queue";
	mode?: GameMode;
	gridRows: number;
	gridCols: number;
	maxPlayers: number;
	playerName: string;
}

export interface LeaveQueueMessage {
	type: "leave_queue";
}

export interface MakeMoveMessage {
	type: "make_move";
	row: number;
	col: number;
}

export interface LeaveGameMessage {
	type: "leave_game";
}

export interface CreateRoomMessage {
	type: "create_room";
	playerName: string;
	gridRows: number;
	gridCols: number;
	maxPlayers: number;
}

export interface JoinRoomByCodeMessage {
	type: "join_room_by_code";
	playerName: string;
	code: string;
}

export type ClientMessage =
	| JoinQueueMessage
	| LeaveQueueMessage
	| MakeMoveMessage
	| LeaveGameMessage
	| CreateRoomMessage
	| JoinRoomByCodeMessage;

export interface ConnectedMessage {
	type: "connected";
	playerId: string;
	displayName: string;
	isGuest: boolean;
}

export interface QueuedMessage {
	type: "queued";
	mode: GameMode;
	position: number;
	maxPlayers: number;
}

export interface GameStartMessage {
	type: "game_start";
	roomId: string;
	mode: GameMode;
	players: Player[];
	gridRows: number;
	gridCols: number;
}

export interface GameStateMessage {
	type: "game_state";
	board: Board;
	currentTurn: number;
	players: Player[];
}

export interface GameOverMessage {
	type: "game_over";
	mode: GameMode;
	winner: Pick<Player, "id" | "name">;
	score_deltas?: Record<string, number>;
}

export interface ErrorMessage {
	type: "error";
	code: string;
	message: string;
	errors?: string[];
}

export interface RoomCreatedMessage {
	type: "room_created";
	roomId: string;
	code: string;
}

export type ServerMessage =
	| ConnectedMessage
	| QueuedMessage
	| GameStartMessage
	| GameStateMessage
	| GameOverMessage
	| RoomCreatedMessage
	| ErrorMessage;
