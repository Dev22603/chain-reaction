const GLOBAL_ERROR_MESSAGES = {
	SERVER_ERROR: "Internal Server Error. Please try again later.",
	RATE_LIMITED: "Too many requests. Try again later.",
};

const AUTH_VALIDATION_ERRORS = {
	EMAIL_INVALID: "email must be valid",
	PASSWORD_MIN: "password must be at least 8 characters",
	PASSWORD_MAX: "password must be 200 characters or less",
	DISPLAY_NAME_REQUIRED: "displayName is required",
	DISPLAY_NAME_MAX: "displayName must be 30 characters or less",
	DISPLAY_NAME_NO_DIGITS: "displayName cannot contain numbers",
	DISPLAY_NAME_INVALID_CHARS: "displayName can only contain letters, spaces, hyphens, and underscores",
};

const AUTH_FEEDBACK_MESSAGES = {
	SIGNUP_SUCCESS: "Account created successfully",
	LOGIN_SUCCESS: "Logged in successfully",
	PROFILE_FETCHED: "Profile fetched successfully",
	PROFILE_UPDATED: "Profile updated successfully",
	EMAIL_TAKEN: "Email is already registered.",
	INVALID_CREDENTIALS: "Invalid email or password.",
	NOT_AUTHENTICATED: "Authentication is required.",
	TOKEN_EXPIRED: "Access token has expired.",
};

const PLAYER_FEEDBACK_MESSAGES = {
	PLAYER_NOT_FOUND: "Player was not found.",
	PROFILE_FETCHED: "Player profile fetched successfully",
	MATCHES_FETCHED: "Match history fetched successfully",
	LEADERBOARD_FETCHED: "Leaderboard fetched successfully",
};

const QUEUE_VALIDATION_ERRORS = {
	PLAYER_NAME_REQUIRED: "playerName is required",
	PLAYER_NAME_MAX: "playerName must be 100 characters or less",
	GRID_ROWS_RANGE: "gridRows must be between 3 and 20",
	GRID_COLS_RANGE: "gridCols must be between 3 and 20",
	MAX_PLAYERS_RANGE: "maxPlayers must be between 2 and 4",
	INVITE_CODE_LENGTH: "code must be exactly 6 characters",
};

const GAME_MESSAGES = {
	VALIDATION_FAILED: "Validation failed.",
	RANKED_REQUIRES_AUTH: "Login is required to join ranked queue.",
	SERVER_BUSY: "Server is at capacity. Please try again later.",
	QUEUE_FULL: "Queue is full. Please try again later.",
	INVALID_INVITE_CODE: "Invalid invite code.",
	ROOM_GONE: "Room no longer exists.",
	ROOM_FULL: "Room is full.",
	MATCH_NOT_SAVED: "Match result could not be saved. Leaderboard may not reflect this game.",
	TOO_MANY_MESSAGES: "Too many messages. Slow down.",
	SERVER_OVERLOADED: "Server is under high load. Please try again later.",
	INVALID_JSON: "Invalid JSON",
};

export {
	GLOBAL_ERROR_MESSAGES,
	AUTH_VALIDATION_ERRORS,
	AUTH_FEEDBACK_MESSAGES,
	PLAYER_FEEDBACK_MESSAGES,
	QUEUE_VALIDATION_ERRORS,
	GAME_MESSAGES,
};
