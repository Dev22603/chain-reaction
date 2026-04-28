export type PlayerId = string;
export type PlayerIndex = number;

export interface Cell {
  owner: PlayerIndex | null;
  count: number;
}

export type Board = Cell[][];

export interface Player {
  id: PlayerId;
  name: string;
  eliminated: boolean;
}

export interface Room {
  id: string;
  players: Player[];
  gridRows: number;
  gridCols: number;
  board: Board;
  currentTurn: PlayerIndex;
  turnCount: number;
}
