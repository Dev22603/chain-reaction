-- Add auth columns to players.
ALTER TABLE "players" ADD COLUMN "email" TEXT;
ALTER TABLE "players" ADD COLUMN "password_hash" TEXT;
ALTER TABLE "players" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "players" ALTER COLUMN "updated_at" DROP DEFAULT;

-- Add match mode so casual history and ranked scoring can stay separate.
ALTER TABLE "matches" ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'casual';

-- CreateIndex
CREATE UNIQUE INDEX "players_email_key" ON "players"("email");
CREATE INDEX "idx_matches_mode_ended_at" ON "matches"("mode", "ended_at" DESC);
