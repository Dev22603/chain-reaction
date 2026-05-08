export type PlayerId = string;
export type PlayerIndex = number;
export type GameMode = "casual" | "ranked";

export interface Cell {
  owner: PlayerIndex | null;
  count: number;
}

export type Board = Cell[][];

export interface Player {
  id: PlayerId;
  name: string;
  isGuest: boolean;
  eliminated: boolean;
  eliminatedTurn: number | null;
}

export interface Room {
  id: string;
  mode: GameMode;
  players: Player[];
  gridRows: number;
  gridCols: number;
  maxPlayers: number;
  board: Board;
  currentTurn: PlayerIndex;
  turnCount: number;
  startedAt: Date;
  forfeitedPlayerIds: Set<PlayerId>;
}
