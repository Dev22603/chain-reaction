import { scoresRepo } from "../db/index.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const leaderboardService = {
  async listLeaderboard(limit?: number) {
    const safeLimit = normalizeLimit(limit);
    return scoresRepo.getLeaderboard({ limit: safeLimit });
  }
};

function normalizeLimit(limit?: number): number {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), MAX_LIMIT);
}
