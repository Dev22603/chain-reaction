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
