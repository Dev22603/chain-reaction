import { prisma } from "../lib/prisma";
import { getLogger } from "../lib/logger";

const logger = getLogger("stats.repository");

export interface OverallLeaderboardRow {
	playerId: string;
	displayName: string;
	totalXp: number;
}

export interface ModeLeaderboardRow {
	playerId: string;
	displayName: string;
	xp: number;
	wins: number;
	losses: number;
	gamesPlayed: number;
	forfeits: number;
}

export interface MatchStatsParticipant {
	playerId: string;
	xpDelta: number;
	won: boolean;
	forfeited: boolean;
}

export interface ApplyMatchResultInput {
	boardPreset: string;
	maxPlayers: number;
	winnerId: string;
	participants: MatchStatsParticipant[];
}

export const statsRepository = {
	async getOverallLeaderboard(limit: number): Promise<OverallLeaderboardRow[]> {
		try {
			// totalXp > 0 keeps guest placeholder rows (always 0 XP) off the board.
			const rows = await prisma.player.findMany({
				where: { totalXp: { gt: 0 } },
				orderBy: [{ totalXp: "desc" }, { createdAt: "asc" }],
				take: limit,
				select: { id: true, displayName: true, totalXp: true },
			});

			return rows.map((row) => ({
				playerId: row.id,
				displayName: row.displayName,
				totalXp: row.totalXp,
			}));
		} catch (error) {
			logger.error("DB error - getOverallLeaderboard", { error: (error as Error).message });
			throw error;
		}
	},

	async getModeLeaderboard(boardPreset: string, maxPlayers: number, limit: number): Promise<ModeLeaderboardRow[]> {
		try {
			const rows = await prisma.playerModeStat.findMany({
				where: { boardPreset, maxPlayers },
				include: { player: true },
				orderBy: [{ xp: "desc" }, { wins: "desc" }, { gamesPlayed: "asc" }],
				take: limit,
			});

			return rows.map((row) => ({
				playerId: row.playerId,
				displayName: row.player.displayName,
				xp: row.xp,
				wins: row.wins,
				losses: row.losses,
				gamesPlayed: row.gamesPlayed,
				forfeits: row.forfeits,
			}));
		} catch (error) {
			logger.error("DB error - getModeLeaderboard", { boardPreset, maxPlayers, error: (error as Error).message });
			throw error;
		}
	},

	async applyMatchResult(input: ApplyMatchResultInput): Promise<void> {
		if (input.participants.length === 0) {
			return;
		}

		try {
			await prisma.$transaction(
				input.participants.flatMap((participant) => [
					prisma.playerModeStat.upsert({
						where: {
							playerId_boardPreset_maxPlayers: {
								playerId: participant.playerId,
								boardPreset: input.boardPreset,
								maxPlayers: input.maxPlayers,
							},
						},
						create: {
							playerId: participant.playerId,
							boardPreset: input.boardPreset,
							maxPlayers: input.maxPlayers,
							xp: participant.xpDelta,
							wins: participant.won ? 1 : 0,
							losses: participant.won ? 0 : 1,
							gamesPlayed: 1,
							forfeits: participant.forfeited ? 1 : 0,
						},
						update: {
							xp: { increment: participant.xpDelta },
							wins: { increment: participant.won ? 1 : 0 },
							losses: { increment: participant.won ? 0 : 1 },
							gamesPlayed: { increment: 1 },
							forfeits: { increment: participant.forfeited ? 1 : 0 },
						},
					}),
					prisma.player.update({
						where: { id: participant.playerId },
						data: { totalXp: { increment: participant.xpDelta } },
					}),
				]),
			);
		} catch (error) {
			logger.error("DB error - applyMatchResult", { winnerId: input.winnerId, error: (error as Error).message });
			throw error;
		}
	},
};
