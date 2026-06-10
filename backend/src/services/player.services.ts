import { PLAYER_FEEDBACK_MESSAGES } from "../constants/app.messages";
import { matchRepository, MatchHistoryEntry } from "../repositories/match.repositories";
import { playerRepository, PlayerProfile } from "../repositories/player.repositories";
import { validateListQuery } from "../schemas/player.schemas";
import { ApiError } from "../utils/api_error";

export const playerService = {
	async getProfile(playerId: string): Promise<PlayerProfile> {
		const profile = await playerRepository.getProfile(playerId);
		if (!profile) {
			throw new ApiError(404, PLAYER_FEEDBACK_MESSAGES.PLAYER_NOT_FOUND);
		}

		return profile;
	},

	async listMatches(playerId: string, query: unknown): Promise<MatchHistoryEntry[]> {
		const { limit } = validateListQuery(query);
		return matchRepository.listForPlayer(playerId, limit);
	},
};
