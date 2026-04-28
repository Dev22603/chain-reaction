export const LIMITS = {
  GRID_MIN: 3,
  GRID_MAX: 20,
  PLAYERS_MIN: 2,
  PLAYERS_MAX: 4,
  PLAYER_NAME_MAX: 100,
  SAFETY_BREAK: 2000
} as const;

export const MESSAGE_TYPES = {
  JOIN_QUEUE: "join_queue",
  LEAVE_QUEUE: "leave_queue",
  MAKE_MOVE: "make_move",
  LEAVE_GAME: "leave_game",
  CONNECTED: "connected",
  QUEUED: "queued",
  GAME_START: "game_start",
  GAME_STATE: "game_state",
  GAME_OVER: "game_over",
  ERROR: "error"
} as const;

export const ERROR_CODES = {
  VALIDATION_FAILED: "validation_failed",
  NOT_AUTHENTICATED: "not_authenticated",
  NOT_AUTHORIZED: "not_authorized",
  ROOM_NOT_FOUND: "room_not_found",
  NOT_IN_GAME: "not_in_game",
  NOT_YOUR_TURN: "not_your_turn",
  INTERNAL_ERROR: "internal_error"
} as const;
