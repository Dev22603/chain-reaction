import { GAME_MODES } from "../constants/app.constants";
import { prisma } from "../lib/prisma";
import { getLogger } from "../lib/logger";

const logger = getLogger("match.repository");

export interface PersistedParticipant {
	playerId: string;
	displayName: string;
	playerIndex: number;
	eliminatedTurn: number | null;
	forfeited: boolean;
}

export interface RecordFinishedMatchInput {
	id: string;
	mode: GAME_MODES;
	gridRows: number;
	gridCols: number;
	maxPlayers: number;
	startedAt: Date;
	endedAt: Date;
	winnerId: string;
	turnCount: number;
	participants: PersistedParticipant[];
}

export interface MatchHistoryPlayer {
	playerId: string;
	displayName: string;
	playerIndex: number;
	eliminatedTurn: number | null;
	forfeited: boolean;
}

export interface MatchHistoryEntry {
	matchId: string;
	mode: GAME_MODES;
	gridRows: number;
	gridCols: number;
	maxPlayers: number;
	startedAt: string;
	endedAt: string;
	winnerId: string;
	winnerName: string;
	turnCount: number;
	participants: MatchHistoryPlayer[];
}

export const matchRepository = {
	async recordFinished(input: RecordFinishedMatchInput): Promise<void> {
		try {
			await prisma.$transaction(async (tx) => {
				for (const participant of input.participants) {
					await tx.player.upsert({
						where: { id: participant.playerId },
						create: { id: participant.playerId, displayName: participant.displayName },
						update: { displayName: participant.displayName },
					});
				}

				await tx.match.create({
					data: {
						id: input.id,
						mode: input.mode,
						gridRows: input.gridRows,
						gridCols: input.gridCols,
						maxPlayers: input.maxPlayers,
						startedAt: input.startedAt,
						endedAt: input.endedAt,
						winnerId: input.winnerId,
						turnCount: input.turnCount,
						participants: {
							create: input.participants.map((participant) => ({
								playerId: participant.playerId,
								playerIndex: participant.playerIndex,
								eliminatedTurn: participant.eliminatedTurn,
								forfeited: participant.forfeited,
							})),
						},
					},
				});
			});
		} catch (error) {
			logger.error("DB error — recordFinished", { matchId: input.id, error: (error as Error).message });
			throw error;
		}
	},

	async listForPlayer(playerId: string, limit: number): Promise<MatchHistoryEntry[]> {
		try {
			const rows = await prisma.match.findMany({
				where: {
					participants: {
						some: { playerId },
					},
				},
				include: {
					winner: true,
					participants: {
						include: { player: true },
						orderBy: { playerIndex: "asc" },
					},
				},
				orderBy: { endedAt: "desc" },
				take: limit,
			});

			return rows.map((match) => ({
				matchId: match.id,
				mode: match.mode as GAME_MODES,
				gridRows: match.gridRows,
				gridCols: match.gridCols,
				maxPlayers: match.maxPlayers,
				startedAt: match.startedAt.toISOString(),
				endedAt: match.endedAt.toISOString(),
				winnerId: match.winnerId,
				winnerName: match.winner.displayName,
				turnCount: match.turnCount,
				participants: match.participants.map((participant) => ({
					playerId: participant.playerId,
					displayName: participant.player.displayName,
					playerIndex: participant.playerIndex,
					eliminatedTurn: participant.eliminatedTurn,
					forfeited: participant.forfeited,
				})),
			}));
		} catch (error) {
			logger.error("DB error — listForPlayer", { playerId, error: (error as Error).message });
			throw error;
		}
	},
};
