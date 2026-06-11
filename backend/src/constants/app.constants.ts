const REGEX = {
	DISPLAY_NAME: /^[A-Za-z][A-Za-z _-]*$/,
	DIGITS: /\d/,
};

const LIMITS = {
	DISPLAY_NAME_MAX: 30,
	PASSWORD_MIN: 8,
	PASSWORD_MAX: 200,
	PLAYER_NAME_MAX: 100,
	GRID_MIN: 3,
	GRID_MAX: 20,
	PLAYERS_MIN: 2,
	// Single knob for how many players a game can hold (queue and private rooms alike).
	PLAYERS_MAX: 20,
	LIST_DEFAULT: 20,
	LIST_MAX: 100,
	SAFETY_BREAK: 2000,
	MAX_CONNECTIONS: 1000,
	MAX_CONNECTIONS_PER_IP: 20,
	MAX_ROOMS: 250,
	MAX_QUEUE_SIZE: 50,
} as const;

// Settings used when joining with a code that doesn't exist yet (room is created on the fly).
// MAX_PLAYERS must stay 2: rooms auto-start when full and have no host "start" button.
const DEFAULT_ROOM = {
	GRID_ROWS: 6,
	GRID_COLS: 9,
	MAX_PLAYERS: 2,
} as const;

const RECONNECT_GRACE_MS = 30_000;
const ROOM_IDLE_TTL_MS = 300_000; // 5 minutes

const WS_RATE_LIMIT_WINDOW_MS = 60_000;
const WS_RATE_LIMIT_MAX_PER_IP = 120; // 120 messages per minute per IP
const WS_GLOBAL_MSG_BUDGET = 2000; // 2000 messages per minute globally
const WS_MAX_PAYLOAD_BYTES = 16 * 1024; // 16 KB
const WS_PING_INTERVAL_MS = 30_000;
const WS_IDLE_TIMEOUT_MS = 600_000; // 10 minutes

// Anti-farm cap: matches finished above this rate stop granting XP for a while.
const XP_VELOCITY_LIMIT = 10;
const XP_VELOCITY_WINDOW_MS = 600_000; // 10 minutes

export {
	REGEX,
	LIMITS,
	DEFAULT_ROOM,
	RECONNECT_GRACE_MS,
	ROOM_IDLE_TTL_MS,
	WS_RATE_LIMIT_WINDOW_MS,
	WS_RATE_LIMIT_MAX_PER_IP,
	WS_GLOBAL_MSG_BUDGET,
	WS_MAX_PAYLOAD_BYTES,
	WS_PING_INTERVAL_MS,
	WS_IDLE_TIMEOUT_MS,
	XP_VELOCITY_LIMIT,
	XP_VELOCITY_WINDOW_MS,
};
