export interface ApiErrorBody {
  type?: "error";
  code?: string;
  message?: string;
  errors?: string[];
}

export interface PublicPlayer {
  id: string;
  displayName: string;
  email: string | null;
}

export interface AuthResult {
  player: PublicPlayer;
  accessToken: string;
}

export interface LeaderboardEntry {
  playerId: string;
  displayName: string;
  score: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
  forfeits: number;
}

export interface PlayerProfile {
  playerId: string;
  displayName: string;
  score: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
  forfeits: number;
  createdAt: string;
}

export interface MatchHistoryPlayer {
  playerId: string;
  displayName: string;
  playerIndex: number;
  eliminatedTurn: number | null;
  forfeited: boolean;
}

export interface MatchHistoryEntry {
  matchId: string;
  mode: "casual" | "ranked";
  gridRows: number;
  gridCols: number;
  maxPlayers: number;
  startedAt: string;
  endedAt: string;
  winnerId: string;
  winnerName: string;
  turnCount: number;
  participants: MatchHistoryPlayer[];
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface RequestOptions extends RequestInit {
  auth?: boolean;
}

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
  mode?: GameMode;
  gridRows: number;
  gridCols: number;
  maxPlayers: number;
  playerName: string;
}

export interface CreateRoomInput {
  playerName: string;
  gridRows: number;
  gridCols: number;
  maxPlayers: number;
}

export type ClientMessage =
  | ({ type: "join_queue" } & JoinQueueInput)
  | { type: "leave_queue" }
  | { type: "make_move"; row: number; col: number }
  | { type: "leave_game" }
  | ({ type: "create_room" } & CreateRoomInput)
  | { type: "join_room_by_code"; playerName: string; code: string };

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
  | {
      type: "game_over";
      mode: GameMode;
      winner: Pick<Player, "id" | "name">;
      score_deltas?: Record<string, number>;
    }
  | { type: "error"; code: string; message: string; errors?: string[] }
  | { type: "room_created"; roomId: string; code: string };
