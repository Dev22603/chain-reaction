export interface LeaderboardEntry {
  playerId: string;
  displayName: string;
  score: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
  forfeits: number;
}

export interface MatchScoreParticipant {
  playerId: string;
  forfeited: boolean;
}

export interface ApplyMatchResultInput {
  winnerId: string;
  participants: MatchScoreParticipant[];
}
