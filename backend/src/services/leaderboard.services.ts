import { LeaderboardEntry, scoreRepository } from "../repositories/score.repositories";
import { validateListQuery } from "../schemas/player.schemas";

export const leaderboardService = {
	async listLeaderboard(query: unknown): Promise<LeaderboardEntry[]> {
		const { limit } = validateListQuery(query);
		return scoreRepository.getLeaderboard(limit);
	},
};
