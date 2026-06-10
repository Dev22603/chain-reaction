import * as z from "zod/v4";
import { GAME_MODES, LIMITS } from "../constants/app.constants";
import { GAME_MESSAGES, QUEUE_VALIDATION_ERRORS } from "../constants/app.messages";
import { ApiError } from "../utils/api_error";

// Reusable validators
const playerNameField = z
	.string()
	.trim()
	.min(1, QUEUE_VALIDATION_ERRORS.PLAYER_NAME_REQUIRED)
	.max(LIMITS.PLAYER_NAME_MAX, QUEUE_VALIDATION_ERRORS.PLAYER_NAME_MAX);

const gridRowsField = z
	.number()
	.int()
	.min(LIMITS.GRID_MIN, QUEUE_VALIDATION_ERRORS.GRID_ROWS_RANGE)
	.max(LIMITS.GRID_MAX, QUEUE_VALIDATION_ERRORS.GRID_ROWS_RANGE);

const gridColsField = z
	.number()
	.int()
	.min(LIMITS.GRID_MIN, QUEUE_VALIDATION_ERRORS.GRID_COLS_RANGE)
	.max(LIMITS.GRID_MAX, QUEUE_VALIDATION_ERRORS.GRID_COLS_RANGE);

const gameModeField = z.enum([GAME_MODES.CASUAL, GAME_MODES.RANKED]);

// Schemas (one per client → server event; the {event, data} envelope carries the event name)
const joinQueueSchema = z.object({
	mode: gameModeField.optional().default(GAME_MODES.CASUAL),
	gridRows: gridRowsField,
	gridCols: gridColsField,
	maxPlayers: z
		.number()
		.int()
		.min(LIMITS.PLAYERS_MIN, QUEUE_VALIDATION_ERRORS.MAX_PLAYERS_RANGE)
		.max(LIMITS.PLAYERS_MAX, QUEUE_VALIDATION_ERRORS.MAX_PLAYERS_RANGE),
	playerName: playerNameField,
});

const makeMoveSchema = z.object({
	row: z.number().int(),
	col: z.number().int(),
});

const createRoomSchema = z.object({
	playerName: playerNameField,
	gridRows: gridRowsField,
	gridCols: gridColsField,
	maxPlayers: z
		.number()
		.int()
		.min(LIMITS.PLAYERS_MIN, QUEUE_VALIDATION_ERRORS.MAX_PLAYERS_RANGE)
		.max(LIMITS.PRIVATE_ROOM_PLAYERS_MAX, QUEUE_VALIDATION_ERRORS.MAX_PLAYERS_RANGE),
});

const joinRoomByCodeSchema = z.object({
	playerName: playerNameField,
	code: z.string().trim().length(6, QUEUE_VALIDATION_ERRORS.INVITE_CODE_LENGTH).toUpperCase(),
});

export type JoinQueueInput = z.infer<typeof joinQueueSchema>;
export type MakeMoveInput = z.infer<typeof makeMoveSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomByCodeInput = z.infer<typeof joinRoomByCodeSchema>;

// Validator functions (called in the gateway before services)
export function validateJoinQueue(data: unknown): JoinQueueInput {
	return validate(joinQueueSchema, data);
}

export function validateMakeMove(data: unknown): MakeMoveInput {
	return validate(makeMoveSchema, data);
}

export function validateCreateRoom(data: unknown): CreateRoomInput {
	return validate(createRoomSchema, data);
}

export function validateJoinRoomByCode(data: unknown): JoinRoomByCodeInput {
	return validate(joinRoomByCodeSchema, data);
}

function validate<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
	const result = schema.safeParse(data);
	if (!result.success) {
		throw new ApiError(
			400,
			GAME_MESSAGES.VALIDATION_FAILED,
			result.error.issues.map((issue) => issue.message),
		);
	}
	return result.data;
}
