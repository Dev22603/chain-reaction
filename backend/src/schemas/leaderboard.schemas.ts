import * as z from "zod/v4";
import { LIMITS } from "../constants/app.constants";
import { BOARD_PRESET_KEYS } from "../constants/presets.constants";
import { QUEUE_VALIDATION_ERRORS } from "../constants/app.messages";
import { ApiError } from "../utils/api_error";

const modeQuerySchema = z.object({
	size: z.enum(BOARD_PRESET_KEYS),
	players: z.coerce
		.number()
		.int()
		.min(LIMITS.PLAYERS_MIN, QUEUE_VALIDATION_ERRORS.MAX_PLAYERS_RANGE)
		.max(LIMITS.PLAYERS_MAX, QUEUE_VALIDATION_ERRORS.MAX_PLAYERS_RANGE),
	limit: z.coerce.number().int().positive().max(LIMITS.LIST_MAX).default(LIMITS.LIST_DEFAULT),
});

export type ModeQueryInput = z.infer<typeof modeQuerySchema>;

export function validateModeQuery(data: unknown): ModeQueryInput {
	const result = modeQuerySchema.safeParse(data);
	if (!result.success) {
		throw new ApiError(
			400,
			"Invalid query filters",
			result.error.issues.map((issue) => issue.message),
		);
	}
	return result.data;
}
