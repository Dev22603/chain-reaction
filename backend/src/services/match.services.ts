import { GAME_MODES, RANKED_VELOCITY_LIMIT, RANKED_VELOCITY_WINDOW_MS, SCORING_POINTS } from "../constants/app.constants.js";
import { getLogger } from "../lib/logger.js";
import { matchesRepository } from "../repositories/matches.repositories.js";
import { scoresRepository } from "../repositories/scores.repositories.js";
import { rankedCompletions } from "../state/game.state.js";
import type { Room } from "../types/game.js";
import type { ScoreDeltas } from "../types/scoring.js";

const logger = getLogger("match.service");

interface FinishedRoomSnapshot {
	id: string;
	mode: Room["mode"];
	players: Room["players"];
	gridRows: number;
	gridCols: number;
	maxPlayers: number;
	startedAt: Date;
	turnCount: number;
	forfeitedPlayerIds: Set<string>;
}

export const matchService = {
	computeScoreDeltas(room: Room, winnerId: string): ScoreDeltas {
		const deltas: ScoreDeltas = {};
		for (const player of room.players) {
			if (!player.isGuest) {
				deltas[player.id] = player.id === winnerId ? SCORING_POINTS.WIN : SCORING_POINTS.LOSS;
			}
		}
		return deltas;
	},

	snapshot(room: Room): FinishedRoomSnapshot {
		return {
			id: room.id,
			mode: room.mode,
			players: room.players.map((player) => ({ ...player })),
			gridRows: room.gridRows,
			gridCols: room.gridCols,
			maxPlayers: room.maxPlayers,
			startedAt: room.startedAt,
			turnCount: room.turnCount,
			forfeitedPlayerIds: new Set(room.forfeitedPlayerIds),
		};
	},

	async persistFinishedMatch(room: FinishedRoomSnapshot, winnerId: string): Promise<void> {
		const winner = room.players.find((player) => player.id === winnerId);
		if (!winner) {
			logger.info("skipping match persistence: winner not found", { roomId: room.id });
			return;
		}

		const authParticipants = room.players.filter((player) => !player.isGuest);
		if (authParticipants.length === 0) {
			logger.info("skipping match persistence: no authenticated participants", { roomId: room.id });
			return;
		}

		await matchesRepository.recordFinished({
			id: room.id,
			mode: room.mode,
			gridRows: room.gridRows,
			gridCols: room.gridCols,
			maxPlayers: room.maxPlayers,
			startedAt: room.startedAt,
			endedAt: new Date(),
			winnerId,
			turnCount: room.turnCount,
			participants: room.players.map((player, playerIndex) => ({
				playerId: player.id,
				displayName: player.name,
				playerIndex,
				eliminatedTurn: player.id === winnerId ? null : player.eliminatedTurn,
				forfeited: room.forfeitedPlayerIds.has(player.id),
			})),
		});

		if (room.mode !== GAME_MODES.RANKED || authParticipants.length < 2 || winner.isGuest) {
			return;
		}

		const now = Date.now();
		let isCapped = false;
		for (const player of authParticipants) {
			const timestamps = getRecentRankedCompletions(player.id, now);
			if (timestamps.length >= RANKED_VELOCITY_LIMIT) {
				isCapped = true;
				logger.warn("Ranked velocity cap exceeded for player, skipping leaderboard update", {
					playerId: player.id,
					roomId: room.id,
				});
			}
		}

		for (const player of authParticipants) {
			const timestamps = getRecentRankedCompletions(player.id, now);
			timestamps.push(now);
			rankedCompletions.set(player.id, timestamps);
		}

		if (isCapped) {
			logger.info("skipping scoresRepository.applyMatchResult due to velocity cap", { roomId: room.id });
			return;
		}

		await scoresRepository.applyMatchResult({
			winnerId,
			participants: authParticipants.map((player) => ({
				playerId: player.id,
				forfeited: room.forfeitedPlayerIds.has(player.id),
			})),
		});
	},
};

function getRecentRankedCompletions(playerId: string, now: number): number[] {
	return (rankedCompletions.get(playerId) ?? []).filter((timestamp) => now - timestamp < RANKED_VELOCITY_WINDOW_MS);
}
