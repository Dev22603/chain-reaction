import { z } from "zod";
import { ERROR_CODES, LIMITS, MESSAGE_TYPES } from "../constants/app.constants.js";
import { QUEUE_VALIDATION_ERRORS, SERVER_MESSAGES } from "../constants/app.messages.js";
import { ApiError } from "../utils/api_error.js";
import type { ClientMessage } from "../types/protocol.js";

const BaseMessageSchema = z.object({
  type: z.string()
});

export const JoinQueueSchema = z.object({
  type: z.literal(MESSAGE_TYPES.JOIN_QUEUE),
  gridRows: z
    .number()
    .int()
    .min(LIMITS.GRID_MIN, QUEUE_VALIDATION_ERRORS.GRID_ROWS_RANGE)
    .max(LIMITS.GRID_MAX, QUEUE_VALIDATION_ERRORS.GRID_ROWS_RANGE),
  gridCols: z
    .number()
    .int()
    .min(LIMITS.GRID_MIN, QUEUE_VALIDATION_ERRORS.GRID_COLS_RANGE)
    .max(LIMITS.GRID_MAX, QUEUE_VALIDATION_ERRORS.GRID_COLS_RANGE),
  maxPlayers: z
    .number()
    .int()
    .min(LIMITS.PLAYERS_MIN, QUEUE_VALIDATION_ERRORS.MAX_PLAYERS_RANGE)
    .max(LIMITS.PLAYERS_MAX, QUEUE_VALIDATION_ERRORS.MAX_PLAYERS_RANGE),
  playerName: z
    .string()
    .trim()
    .min(1, QUEUE_VALIDATION_ERRORS.PLAYER_NAME_REQUIRED)
    .max(LIMITS.PLAYER_NAME_MAX, QUEUE_VALIDATION_ERRORS.PLAYER_NAME_MAX)
});

export const LeaveQueueSchema = z.object({
  type: z.literal(MESSAGE_TYPES.LEAVE_QUEUE)
});

export const MakeMoveSchema = z.object({
  type: z.literal(MESSAGE_TYPES.MAKE_MOVE),
  row: z.number().int(),
  col: z.number().int()
});

export const LeaveGameSchema = z.object({
  type: z.literal(MESSAGE_TYPES.LEAVE_GAME)
});

export function validateMessage(parsed: unknown): ClientMessage | null {
  const base = BaseMessageSchema.safeParse(parsed);
  if (!base.success) {
    return null;
  }

  const schema = getSchemaForType(base.data.type);
  if (!schema) {
    return null;
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new ApiError(
      ERROR_CODES.VALIDATION_FAILED,
      SERVER_MESSAGES.VALIDATION_FAILED,
      result.error.issues.map((issue) => issue.message)
    );
  }

  return result.data;
}

function getSchemaForType(type: string) {
  switch (type) {
    case MESSAGE_TYPES.JOIN_QUEUE:
      return JoinQueueSchema;
    case MESSAGE_TYPES.LEAVE_QUEUE:
      return LeaveQueueSchema;
    case MESSAGE_TYPES.MAKE_MOVE:
      return MakeMoveSchema;
    case MESSAGE_TYPES.LEAVE_GAME:
      return LeaveGameSchema;
    default:
      return null;
  }
}
