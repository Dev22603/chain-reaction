import { prisma } from "../../lib/prisma.js";
import type { GameMode } from "../../types/game.js";
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
              forfeited: participant.forfeited
            }))
          }
        }
      });
    });
  },

  async listForPlayer(playerId: string, { limit = 20 }: { limit?: number } = {}) {
    const rows = await prisma.match.findMany({
      where: {
        participants: {
          some: {
            playerId
          }
        }
      },
      include: {
        winner: true,
        participants: {
          include: {
            player: true
          },
          orderBy: {
            playerIndex: "asc"
          }
        }
      },
      orderBy: {
        endedAt: "desc"
      },
      take: limit
    });

    return rows.map((match) => ({
      matchId: match.id,
      mode: match.mode as GameMode,
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
        forfeited: participant.forfeited
      }))
    }));
  }
};
