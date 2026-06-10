import * as z from "zod/v4";
import { LIMITS } from "../constants/app.constants";
import { ApiError } from "../utils/api_error";

const listQuerySchema = z.object({
	limit: z.coerce.number().int().positive().max(LIMITS.LIST_MAX).default(LIMITS.LIST_DEFAULT),
});

export type ListQueryInput = z.infer<typeof listQuerySchema>;

export function validateListQuery(data: unknown): ListQueryInput {
	const result = listQuerySchema.safeParse(data);
	if (!result.success) {
		throw new ApiError(
			400,
			"Invalid query filters",
			result.error.issues.map((issue) => issue.message),
		);
	}
	return result.data;
}
