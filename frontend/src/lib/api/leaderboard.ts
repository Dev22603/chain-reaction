import { apiRequest } from "./client";
import type { LeaderboardEntry } from "@/types";

export const leaderboardApi = {
  list(limit = 20, options?: RequestInit) {
    return apiRequest<{ leaderboard: LeaderboardEntry[] }>(`/leaderboard?limit=${limit}`, {
      ...options
    });
  }
};
