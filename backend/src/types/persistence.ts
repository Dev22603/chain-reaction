export interface PersistedParticipant {
  playerId: string;
  displayName: string;
  playerIndex: number;
  eliminatedTurn: number | null;
  forfeited: boolean;
}

export interface RecordFinishedMatchInput {
  id: string;
  gridRows: number;
  gridCols: number;
  maxPlayers: number;
  startedAt: Date;
  endedAt: Date;
  winnerId: string;
  turnCount: number;
  participants: PersistedParticipant[];
}
