import { apiRequest } from "./client";
import type { PlayerProfile, MatchHistoryEntry } from "@/types";

export const playersApi = {
  profile(playerId: string, options?: RequestInit) {
    return apiRequest<{ profile: PlayerProfile }>(`/players/${playerId}`, {
      ...options
    });
  },

  matches(playerId: string, limit = 20, options?: RequestInit) {
    return apiRequest<{ matches: MatchHistoryEntry[] }>(`/players/${playerId}/matches?limit=${limit}`, {
      ...options
    });
  },

  myMatches(limit = 20) {
    return apiRequest<{ matches: MatchHistoryEntry[] }>(`/me/matches?limit=${limit}`, {
      auth: true
    });
  }
};
