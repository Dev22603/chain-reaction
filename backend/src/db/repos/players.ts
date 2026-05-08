import { prisma } from "../../lib/prisma.js";

export const playersRepo = {
  async createAccount(input: { id: string; displayName: string; email: string; passwordHash: string }) {
    return prisma.player.create({
      data: {
        id: input.id,
        displayName: input.displayName,
        email: input.email,
        passwordHash: input.passwordHash
      }
    });
  },

  async findByEmail(email: string) {
    return prisma.player.findUnique({
      where: {
        email
      }
    });
  },

  async findById(id: string) {
    return prisma.player.findUnique({
      where: {
        id
      }
    });
  },

  async getProfile(id: string) {
    const player = await prisma.player.findUnique({
      where: {
        id
      },
      include: {
        score: true
      }
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
      createdAt: player.createdAt.toISOString()
    };
  },

  async upsert(input: { id: string; displayName: string }) {
    return prisma.player.upsert({
      where: {
        id: input.id
      },
      create: {
        id: input.id,
        displayName: input.displayName
      },
      update: {
        displayName: input.displayName
      }
    });
  }
};
