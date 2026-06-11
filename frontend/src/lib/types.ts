export interface Cell {
  owner: number | null;
  count: number;
}

export type Board = Cell[][];

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
  position: number;
  maxPlayers: number;
  gridRows?: number;
  gridCols?: number;
}

export interface LastError {
  code: number;
  message: string;
}

export interface JoinQueueInput {
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

// WebSocket frames are {event, data} envelopes; event names mirror the
// backend's SOCKET_EVENTS.GAME constants.
export type ServerEnvelope =
  | { event: "game:connected"; data: { playerId: string; displayName: string; isGuest: boolean } }
  | { event: "game:queued"; data: QueuedInfo }
  | {
      event: "game:start";
      data: { roomId: string; players: Player[]; gridRows: number; gridCols: number };
    }
  | { event: "game:state"; data: GameState }
  | {
      event: "game:over";
      data: { winner: Pick<Player, "id" | "name">; xpDeltas?: Record<string, number> };
    }
  | { event: "game:room-created"; data: { roomId: string; code: string } }
  | { event: "game:error"; data: { code: number; message: string; errors?: string[] } };
