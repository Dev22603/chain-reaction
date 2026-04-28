import { prisma } from "../../lib/prisma.js";
import type { RecordFinishedMatchInput } from "../../types/persistence.js";

export const matchesRepo = {
  async recordFinished(input: RecordFinishedMatchInput): Promise<void> {
    await prisma.$transaction(async (tx) => {
      for (const participant of input.participants) {
        await tx.player.upsert({
          where: {
            id: participant.playerId
          },
          create: {
            id: participant.playerId,
            displayName: participant.displayName
          },
          update: {
            displayName: participant.displayName
          }
        });
      }

      await tx.match.create({
        data: {
          id: input.id,
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
              forfeited: participant.forfeited
            }))
          }
        }
      });
    });
  }
};
