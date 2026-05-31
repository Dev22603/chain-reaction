// Rebuilds player_scores from scratch using stored match_players rows.
// Run intentionally: npm run recompute-scores
// Only ranked matches affect scores (see src/repositories/scores.repositories.ts applyMatchResult).

import { prisma } from "../src/lib/prisma.js";
import { getLogger } from "../src/lib/logger.js";

const logger = getLogger("recompute-scores");

async function main(): Promise<void> {
	const start = Date.now();

	const matches = await prisma.match.findMany({
		where: { mode: "ranked" },
		orderBy: { startedAt: "asc" },
		include: { participants: true },
	});

	const affectedPlayerIds = new Set<string>();
	for (const match of matches) {
		for (const p of match.participants) {
			affectedPlayerIds.add(p.playerId);
		}
	}

	// Accumulate deltas in memory, then write in a single transaction.
	const scoreMap = new Map<string, { score: number; wins: number; losses: number; gamesPlayed: number; forfeits: number }>();

	const ensure = (playerId: string) => {
		if (!scoreMap.has(playerId)) {
			scoreMap.set(playerId, { score: 0, wins: 0, losses: 0, gamesPlayed: 0, forfeits: 0 });
		}
		return scoreMap.get(playerId)!;
	};

	for (const match of matches) {
		for (const participant of match.participants) {
			const row = ensure(participant.playerId);
			const won = participant.playerId === match.winnerId;

			// Scoring policy mirrors src/repositories/scores.repositories.ts applyMatchResult:
			// winner +3 points, losers +1 point, all counted in gamesPlayed and wins/losses.
			row.score += won ? 3 : 1;
			row.wins += won ? 1 : 0;
			row.losses += won ? 0 : 1;
			row.gamesPlayed += 1;
			row.forfeits += participant.forfeited ? 1 : 0;
		}
	}

	await prisma.$transaction(async (tx) => {
		// Wipe existing scores for players that appear in ranked matches.
		await tx.playerScore.deleteMany({
			where: { playerId: { in: [...affectedPlayerIds] } },
		});

		if (scoreMap.size === 0) {
			return;
		}

		await tx.playerScore.createMany({
			data: [...scoreMap.entries()].map(([playerId, s]) => ({
				playerId,
				score: s.score,
				wins: s.wins,
				losses: s.losses,
				gamesPlayed: s.gamesPlayed,
				forfeits: s.forfeits,
			})),
		});
	});

	const elapsed = Date.now() - start;
	logger.info("recompute complete", {
		matches: matches.length,
		players: scoreMap.size,
		elapsedMs: elapsed,
	});
	console.log(`recomputed ${matches.length} matches across ${scoreMap.size} players, total time ${elapsed}ms`);
}

main()
	.catch((err: unknown) => {
		logger.error("recompute-scores failed", { error: (err as Error).message });
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
