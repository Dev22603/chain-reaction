import type { Board, Player } from "./game.js";

export interface JoinQueueMessage {
  type: "join_queue";
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

export type ClientMessage =
  | JoinQueueMessage
  | LeaveQueueMessage
  | MakeMoveMessage
  | LeaveGameMessage;

export interface ConnectedMessage {
  type: "connected";
  playerId: string;
}

export interface QueuedMessage {
  type: "queued";
  position: number;
  maxPlayers: number;
}

export interface GameStartMessage {
  type: "game_start";
  roomId: string;
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
  winner: Pick<Player, "id" | "name">;
}

export interface ErrorMessage {
  type: "error";
  code: string;
  message: string;
  errors?: string[];
}

export type ServerMessage =
  | ConnectedMessage
  | QueuedMessage
  | GameStartMessage
  | GameStateMessage
  | GameOverMessage
  | ErrorMessage;
