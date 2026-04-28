export const SERVER_MESSAGES = {
  INTERNAL_ERROR: "Something went wrong.",
  VALIDATION_FAILED: "Validation failed.",
  DATABASE_UNAVAILABLE: "Database is not configured."
} as const;

export const QUEUE_VALIDATION_ERRORS = {
  PLAYER_NAME_REQUIRED: "playerName is required",
  PLAYER_NAME_MAX: "playerName must be 100 characters or less",
  GRID_ROWS_RANGE: "gridRows must be between 3 and 20",
  GRID_COLS_RANGE: "gridCols must be between 3 and 20",
  MAX_PLAYERS_RANGE: "maxPlayers must be between 2 and 4"
} as const;
