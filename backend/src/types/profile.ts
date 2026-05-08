import type { GameMode } from "./game.js";

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
  mode: GameMode;
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
