import { SCORING_POINTS } from "../../constants/app.constants.js";
import { prisma } from "../../lib/prisma.js";
import type { ApplyMatchResultInput, LeaderboardEntry, ScoreDeltas } from "../../types/scoring.js";

export const scoresRepo = {
	async getLeaderboard({ limit = 20 }: { limit?: number } = {}): Promise<LeaderboardEntry[]> {
		const rows = await prisma.playerScore.findMany({
			include: {
				player: true,
			},
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
	},

	async applyMatchResult(input: ApplyMatchResultInput): Promise<ScoreDeltas> {
		const deltas: ScoreDeltas = {};

		if (input.participants.length < 2) {
			return deltas;
		}

		for (const participant of input.participants) {
			deltas[participant.playerId] = participant.playerId === input.winnerId ? SCORING_POINTS.WIN : SCORING_POINTS.LOSS;
		}

		await prisma.$transaction(
			input.participants.map((participant) => {
				const won = participant.playerId === input.winnerId;

				return prisma.playerScore.upsert({
					where: {
						playerId: participant.playerId,
					},
					create: {
						playerId: participant.playerId,
						score: won ? SCORING_POINTS.WIN : SCORING_POINTS.LOSS,
						wins: won ? 1 : 0,
						losses: won ? 0 : 1,
						gamesPlayed: 1,
						forfeits: participant.forfeited ? 1 : 0,
					},
					update: {
						score: {
							increment: won ? SCORING_POINTS.WIN : SCORING_POINTS.LOSS,
						},
						wins: {
							increment: won ? 1 : 0,
						},
						losses: {
							increment: won ? 0 : 1,
						},
						gamesPlayed: {
							increment: 1,
						},
						forfeits: {
							increment: participant.forfeited ? 1 : 0,
						},
					},
				});
			}),
		);

		return deltas;
	},
};
