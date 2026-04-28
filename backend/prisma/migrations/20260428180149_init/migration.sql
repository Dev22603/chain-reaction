-- CreateTable
CREATE TABLE "players" (
    "id" UUID NOT NULL,
    "display_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL,
    "grid_rows" SMALLINT NOT NULL,
    "grid_cols" SMALLINT NOT NULL,
    "max_players" SMALLINT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3) NOT NULL,
    "winner_id" UUID NOT NULL,
    "turn_count" INTEGER NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_players" (
    "match_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "player_index" SMALLINT NOT NULL,
    "eliminated_turn" INTEGER,
    "forfeited" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "match_players_pkey" PRIMARY KEY ("match_id","player_id")
);

-- CreateTable
CREATE TABLE "player_scores" (
    "player_id" UUID NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "games_played" INTEGER NOT NULL DEFAULT 0,
    "forfeits" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_scores_pkey" PRIMARY KEY ("player_id")
);

-- CreateIndex
CREATE INDEX "idx_players_display_name" ON "players"("display_name");

-- CreateIndex
CREATE INDEX "idx_matches_ended_at" ON "matches"("ended_at" DESC);

-- CreateIndex
CREATE INDEX "idx_matches_winner" ON "matches"("winner_id");

-- CreateIndex
CREATE INDEX "idx_match_players_player" ON "match_players"("player_id");

-- CreateIndex
CREATE INDEX "idx_player_scores_leaderboard" ON "player_scores"("score" DESC, "wins" DESC, "games_played");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_scores" ADD CONSTRAINT "player_scores_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
