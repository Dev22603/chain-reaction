export interface Cell {
  owner: number | null;
  count: number;
}

export type Board = Cell[][];
export type GameMode = "casual" | "ranked";

export interface Player {
  id: string;
  name: string;
  isGuest: boolean;
  eliminated: boolean;
  eliminatedTurn: number | null;
}

export type Phase = "lobby" | "queued" | "playing" | "gameover";

export interface GameState {
  board: Board;
  currentTurn: number;
  players: Player[];
}

export interface QueuedInfo {
  mode: GameMode;
  position: number;
  maxPlayers: number;
}

export interface LastError {
  code: string;
  message: string;
}

export interface JoinQueueInput {
  mode: GameMode;
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
  | { type: "connected"; playerId: string; displayName: string; isGuest: boolean }
  | { type: "queued"; mode: GameMode; position: number; maxPlayers: number }
  | {
      type: "game_start";
      roomId: string;
      mode: GameMode;
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
  | { type: "game_over"; mode: GameMode; winner: Pick<Player, "id" | "name"> }
  | { type: "error"; code: string; message: string; errors?: string[] };
