export const LIMITS = {
	GRID_MIN: 3,
	GRID_MAX: 20,
	PLAYERS_MIN: 2,
	PLAYERS_MAX: 4,
	PRIVATE_ROOM_PLAYERS_MAX: 8,
	PLAYER_NAME_MAX: 100,
	SAFETY_BREAK: 2000,
	MAX_CONNECTIONS: 1000,
	MAX_CONNECTIONS_PER_IP: 20,
	MAX_ROOMS: 250,
	MAX_QUEUE_SIZE: 50,
} as const;

export const RECONNECT_GRACE_MS = 30_000;

export const MESSAGE_TYPES = {
	JOIN_QUEUE: "join_queue",
	LEAVE_QUEUE: "leave_queue",
	MAKE_MOVE: "make_move",
	LEAVE_GAME: "leave_game",
	CREATE_ROOM: "create_room",
	JOIN_ROOM_BY_CODE: "join_room_by_code",
	CONNECTED: "connected",
	QUEUED: "queued",
	GAME_START: "game_start",
	GAME_STATE: "game_state",
	GAME_OVER: "game_over",
	ROOM_CREATED: "room_created",
	ERROR: "error",
} as const;

export const GAME_MODES = {
	CASUAL: "casual",
	RANKED: "ranked",
} as const;

export const ERROR_CODES = {
	VALIDATION_FAILED: "validation_failed",
	EMAIL_TAKEN: "email_taken",
	INVALID_CREDENTIALS: "invalid_credentials",
	NOT_AUTHENTICATED: "not_authenticated",
	AUTH_TOKEN_EXPIRED: "auth_token_expired",
	NOT_AUTHORIZED: "not_authorized",
	NOT_FOUND: "not_found",
	PLAYER_NOT_FOUND: "player_not_found",
	ROOM_NOT_FOUND: "room_not_found",
	ROOM_CODE_INVALID: "room_code_invalid",
	ROOM_FULL: "room_full",
	NOT_IN_GAME: "not_in_game",
	NOT_YOUR_TURN: "not_your_turn",
	DATABASE_UNAVAILABLE: "database_unavailable",
	INTERNAL_ERROR: "internal_error",
	MATCH_NOT_SAVED: "match_not_saved",
	RATE_LIMITED: "rate_limited",
	SERVER_BUSY: "server_busy",
} as const;

export const SCORING_POINTS = {
	WIN: 3,
	LOSS: 1,
} as const;

export const WS_RATE_LIMIT_MAX = 60;
export const WS_RATE_LIMIT_WINDOW_MS = 60_000;
export const WS_RATE_LIMIT_MAX_PER_IP = 120; // 120 messages per minute per IP
export const WS_GLOBAL_MSG_BUDGET = 2000; // 2000 messages per minute globally

export const WS_MAX_PAYLOAD_BYTES = 16 * 1024; // 16 KB
export const WS_PING_INTERVAL_MS = 30_000; // 30 seconds
export const WS_IDLE_TIMEOUT_MS = 600_000; // 10 minutes (600,000 ms)

export const ROOM_IDLE_TTL_MS = 300_000; // 5 minutes

export const RANKED_VELOCITY_LIMIT = 10;
export const RANKED_VELOCITY_WINDOW_MS = 600_000; // 10 minutes
