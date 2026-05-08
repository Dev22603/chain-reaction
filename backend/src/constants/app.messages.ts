export const SERVER_MESSAGES = {
  INTERNAL_ERROR: "Something went wrong.",
  VALIDATION_FAILED: "Validation failed.",
  DATABASE_UNAVAILABLE: "Database is not configured.",
  EMAIL_TAKEN: "Email is already registered.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  NOT_AUTHENTICATED: "Authentication is required."
} as const;

export const AUTH_VALIDATION_ERRORS = {
  EMAIL_INVALID: "email must be valid",
  PASSWORD_MIN: "password must be at least 8 characters",
  DISPLAY_NAME_REQUIRED: "displayName is required",
  DISPLAY_NAME_MAX: "displayName must be 100 characters or less"
} as const;

export const QUEUE_VALIDATION_ERRORS = {
  PLAYER_NAME_REQUIRED: "playerName is required",
  PLAYER_NAME_MAX: "playerName must be 100 characters or less",
  GRID_ROWS_RANGE: "gridRows must be between 3 and 20",
  GRID_COLS_RANGE: "gridCols must be between 3 and 20",
  MAX_PLAYERS_RANGE: "maxPlayers must be between 2 and 4"
} as const;
