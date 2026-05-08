import { ERROR_CODES } from "../constants/app.constants.js";
import { SERVER_MESSAGES } from "../constants/app.messages.js";
import { playersRepo, matchesRepo } from "../db/index.js";
import type { MatchHistoryEntry, PlayerProfile } from "../types/profile.js";
import { ApiError } from "../utils/api_error.js";

const DEFAULT_MATCH_LIMIT = 20;
const MAX_MATCH_LIMIT = 100;

export const playersService = {
  async getProfile(playerId: string): Promise<PlayerProfile> {
    const profile = await playersRepo.getProfile(playerId);
    if (!profile) {
      throw new ApiError(ERROR_CODES.PLAYER_NOT_FOUND, SERVER_MESSAGES.PLAYER_NOT_FOUND, [], 404);
    }

    return profile;
  },

  async listMatches(playerId: string, limit?: number): Promise<MatchHistoryEntry[]> {
    return matchesRepo.listForPlayer(playerId, {
      limit: normalizeLimit(limit)
    });
  }
};

function normalizeLimit(limit?: number): number {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_MATCH_LIMIT;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), MAX_MATCH_LIMIT);
}
