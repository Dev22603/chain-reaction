-- Replace the global score table with per-mode XP stats; drop casual/ranked split.

-- DropTable
DROP TABLE "player_scores";

-- AlterTable
ALTER TABLE "players" ADD COLUMN "total_xp" INTEGER NOT NULL DEFAULT 0;

-- DropIndex
DROP INDEX "idx_matches_mode_ended_at";

-- AlterTable
ALTER TABLE "matches" DROP COLUMN "mode";

-- CreateTable
CREATE TABLE "player_mode_stats" (
    "player_id" UUID NOT NULL,
    "board_preset" TEXT NOT NULL,
    "max_players" SMALLINT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "games_played" INTEGER NOT NULL DEFAULT 0,
    "forfeits" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_mode_stats_pkey" PRIMARY KEY ("player_id","board_preset","max_players")
);

-- CreateIndex
CREATE INDEX "idx_players_total_xp" ON "players"("total_xp" DESC);

-- CreateIndex
CREATE INDEX "idx_mode_stats_leaderboard" ON "player_mode_stats"("board_preset", "max_players", "xp" DESC, "wins" DESC);

-- AddForeignKey
ALTER TABLE "player_mode_stats" ADD CONSTRAINT "player_mode_stats_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
