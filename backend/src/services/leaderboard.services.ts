import { levelForXp } from "../constants/xp.constants";
import { ModeLeaderboardRow, statsRepository } from "../repositories/stats.repositories";
import { validateModeQuery } from "../schemas/leaderboard.schemas";
import { validateListQuery } from "../schemas/player.schemas";

export interface OverallLeaderboardEntry {
	playerId: string;
	displayName: string;
	totalXp: number;
	level: number;
}

export const leaderboardService = {
	async listOverall(query: unknown): Promise<OverallLeaderboardEntry[]> {
		const { limit } = validateListQuery(query);
		const rows = await statsRepository.getOverallLeaderboard(limit);
		return rows.map((row) => ({ ...row, level: levelForXp(row.totalXp) }));
	},

	async listMode(query: unknown): Promise<ModeLeaderboardRow[]> {
		const { size, players, limit } = validateModeQuery(query);
		return statsRepository.getModeLeaderboard(size, players, limit);
	},
};
