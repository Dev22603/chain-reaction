export interface Cell {
  owner: number | null;
  count: number;
}

export type Board = Cell[][];

export interface Player {
  id: string;
  name: string;
  eliminated: boolean;
}

export type Phase = "lobby" | "queued" | "playing" | "gameover";

export interface GameState {
  board: Board;
  currentTurn: number;
  players: Player[];
}

export interface QueuedInfo {
  position: number;
  maxPlayers: number;
}

export interface LastError {
  code: string;
  message: string;
}

export interface JoinQueueInput {
  gridRows: number;
  gridCols: number;
  maxPlayers: number;
  playerName: string;
}

export type ClientMessage =
  | ({ type: "join_queue" } & JoinQueueInput)
  | { type: "leave_queue" }
  | { type: "make_move"; row: number; col: number }
  | { type: "leave_game" };

export type ServerMessage =
  | { type: "connected"; playerId: string }
  | { type: "queued"; position: number; maxPlayers: number }
  | {
      type: "game_start";
      roomId: string;
      players: Player[];
      gridRows: number;
      gridCols: number;
    }
  | {
      type: "game_state";
      board: Board;
      currentTurn: number;
      players: Player[];
    }
  | { type: "game_over"; winner: Pick<Player, "id" | "name"> }
  | { type: "error"; code: string; message: string; errors?: string[] };
