import { XP_VELOCITY_LIMIT, XP_VELOCITY_WINDOW_MS } from "../constants/app.constants";
import { presetForGrid } from "../constants/presets.constants";
import { XP } from "../constants/xp.constants";
import { getLogger } from "../lib/logger";
import { matchRepository } from "../repositories/match.repositories";
import { statsRepository } from "../repositories/stats.repositories";
import type { Room } from "./room.services";

const logger = getLogger("match.service");

export type XpDeltas = Record<string, number>;

export interface FinishedRoomSnapshot {
	id: string;
	players: Room["players"];
	gridRows: number;
	gridCols: number;
	maxPlayers: number;
	startedAt: Date;
	turnCount: number;
	forfeitedPlayerIds: Set<string>;
}

// Match completion timestamps per player, owned by this service (XP velocity cap)
const xpCompletions = new Map<string, number[]>();

export const matchService = {
	// XP per player: winner = WINNER_PER_OPPONENT × opponents × sizeFactor, loser = LOSER_BASE × sizeFactor.
	// Forfeiters and guests get 0. Returns all-zeros when any participant is over the
	// velocity cap, so emitted deltas always match what actually persists.
	computeXpDeltas(room: Room, winnerId: string): XpDeltas {
		const deltas: XpDeltas = {};
		const preset = presetForGrid(room.gridRows, room.gridCols);
		const sizeFactor = preset?.sizeFactor ?? 1;
		const capped = isVelocityCapped(room.players.filter((player) => !player.isGuest).map((player) => player.id));

		for (const player of room.players) {
			if (player.isGuest) {
				continue;
			}
			if (capped || room.forfeitedPlayerIds.has(player.id)) {
				deltas[player.id] = 0;
				continue;
			}
			deltas[player.id] =
				player.id === winnerId
					? XP.WINNER_PER_OPPONENT * (room.players.length - 1) * sizeFactor
					: XP.LOSER_BASE * sizeFactor;
		}
		return deltas;
	},

	snapshot(room: Room): FinishedRoomSnapshot {
		return {
			id: room.id,
			players: room.players.map((player) => ({ ...player })),
			gridRows: room.gridRows,
			gridCols: room.gridCols,
			maxPlayers: room.maxPlayers,
			startedAt: room.startedAt,
			turnCount: room.turnCount,
			forfeitedPlayerIds: new Set(room.forfeitedPlayerIds),
		};
	},

	async persistFinishedMatch(room: FinishedRoomSnapshot, winnerId: string, xpDeltas: XpDeltas): Promise<void> {
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

		await matchRepository.recordFinished({
			id: room.id,
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

		const preset = presetForGrid(room.gridRows, room.gridCols);
		if (!preset) {
			// Pre-preset legacy rooms only; nothing to bucket stats under.
			logger.warn("skipping stats update: board is not a preset", { roomId: room.id });
			return;
		}

		const now = Date.now();
		const capped = isVelocityCapped(
			authParticipants.map((player) => player.id),
			room.id,
		);

		for (const player of authParticipants) {
			const timestamps = getRecentCompletions(player.id, now);
			timestamps.push(now);
			xpCompletions.set(player.id, timestamps);
		}

		if (capped) {
			logger.info("skipping statsRepository.applyMatchResult due to velocity cap", { roomId: room.id });
			return;
		}

		await statsRepository.applyMatchResult({
			boardPreset: preset.key,
			maxPlayers: room.maxPlayers,
			winnerId,
			participants: authParticipants.map((player) => ({
				playerId: player.id,
				xpDelta: xpDeltas[player.id] ?? 0,
				won: player.id === winnerId,
				forfeited: room.forfeitedPlayerIds.has(player.id),
			})),
		});
	},
};

function isVelocityCapped(playerIds: string[], roomId?: string): boolean {
	const now = Date.now();
	for (const playerId of playerIds) {
		if (getRecentCompletions(playerId, now).length >= XP_VELOCITY_LIMIT) {
			logger.warn("XP velocity cap exceeded for player", { playerId, roomId });
			return true;
		}
	}
	return false;
}

function getRecentCompletions(playerId: string, now: number): number[] {
	return (xpCompletions.get(playerId) ?? []).filter((timestamp) => now - timestamp < XP_VELOCITY_WINDOW_MS);
}
