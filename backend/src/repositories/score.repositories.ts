import { SCORING_POINTS } from "../constants/app.constants";
import { prisma } from "../lib/prisma";
import { getLogger } from "../lib/logger";

const logger = getLogger("score.repository");

export interface LeaderboardEntry {
	playerId: string;
	displayName: string;
	score: number;
	wins: number;
	losses: number;
	gamesPlayed: number;
	forfeits: number;
}

export interface MatchScoreParticipant {
	playerId: string;
	forfeited: boolean;
}

export interface ApplyMatchResultInput {
	winnerId: string;
	participants: MatchScoreParticipant[];
}

export const scoreRepository = {
	async getLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
		try {
			const rows = await prisma.playerScore.findMany({
				include: { player: true },
				orderBy: [{ score: "desc" }, { wins: "desc" }, { gamesPlayed: "asc" }],
				take: limit,
			});

			return rows.map((row) => ({
				playerId: row.playerId,
				displayName: row.player.displayName,
				score: row.score,
				wins: row.wins,
				losses: row.losses,
				gamesPlayed: row.gamesPlayed,
				forfeits: row.forfeits,
			}));
		} catch (error) {
			logger.error("DB error — getLeaderboard", { error: (error as Error).message });
			throw error;
		}
	},

	async applyMatchResult(input: ApplyMatchResultInput): Promise<void> {
		if (input.participants.length < 2) {
			return;
		}

		try {
			await prisma.$transaction(
				input.participants.map((participant) => {
					const won = participant.playerId === input.winnerId;

					return prisma.playerScore.upsert({
						where: { playerId: participant.playerId },
						create: {
							playerId: participant.playerId,
							score: won ? SCORING_POINTS.WIN : SCORING_POINTS.LOSS,
							wins: won ? 1 : 0,
							losses: won ? 0 : 1,
							gamesPlayed: 1,
							forfeits: participant.forfeited ? 1 : 0,
						},
						update: {
							score: { increment: won ? SCORING_POINTS.WIN : SCORING_POINTS.LOSS },
							wins: { increment: won ? 1 : 0 },
							losses: { increment: won ? 0 : 1 },
							gamesPlayed: { increment: 1 },
							forfeits: { increment: participant.forfeited ? 1 : 0 },
						},
					});
				}),
			);
		} catch (error) {
			logger.error("DB error — applyMatchResult", { winnerId: input.winnerId, error: (error as Error).message });
			throw error;
		}
	},
};
