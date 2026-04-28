import { prisma } from "../../lib/prisma.js";

export const playersRepo = {
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
