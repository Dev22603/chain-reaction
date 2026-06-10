import { prisma } from "../lib/prisma";
import { getLogger } from "../lib/logger";

const logger = getLogger("player.repository");

export interface PlayerProfile {
	playerId: string;
	displayName: string;
	score: number;
	wins: number;
	losses: number;
	gamesPlayed: number;
	forfeits: number;
	createdAt: string;
}

export const playerRepository = {
	async createAccount(data: { id: string; displayName: string; email: string; passwordHash: string }) {
		try {
			return await prisma.player.create({
				data: {
					id: data.id,
					displayName: data.displayName,
					email: data.email,
					passwordHash: data.passwordHash,
				},
			});
		} catch (error) {
			logger.error("DB error — createAccount", { error: (error as Error).message });
			throw error;
		}
	},

	async findByEmail(email: string) {
		try {
			return await prisma.player.findUnique({ where: { email } });
		} catch (error) {
			logger.error("DB error — findByEmail", { error: (error as Error).message });
			throw error;
		}
	},

	async findById(id: string) {
		try {
			return await prisma.player.findUnique({ where: { id } });
		} catch (error) {
			logger.error("DB error — findById", { id, error: (error as Error).message });
			throw error;
		}
	},

	async getProfile(id: string): Promise<PlayerProfile | null> {
		try {
			const player = await prisma.player.findUnique({
				where: { id },
				include: { score: true },
			});

			if (!player) {
				return null;
			}

			return {
				playerId: player.id,
				displayName: player.displayName,
				score: player.score?.score ?? 0,
				wins: player.score?.wins ?? 0,
				losses: player.score?.losses ?? 0,
				gamesPlayed: player.score?.gamesPlayed ?? 0,
				forfeits: player.score?.forfeits ?? 0,
				createdAt: player.createdAt.toISOString(),
			};
		} catch (error) {
			logger.error("DB error — getProfile", { id, error: (error as Error).message });
			throw error;
		}
	},

	async updateDisplayName(id: string, displayName: string) {
		try {
			return await prisma.player.update({
				where: { id },
				data: { displayName },
			});
		} catch (error) {
			logger.error("DB error — updateDisplayName", { id, error: (error as Error).message });
			throw error;
		}
	},
};
