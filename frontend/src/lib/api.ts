import { clearStoredAccessToken, getStoredAccessToken } from "@/lib/auth";

const DEFAULT_API_URL = "http://localhost:8080/api";

export interface ApiErrorBody {
  code?: number;
  message?: string;
  errors?: string[];
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors: string[] = []
  ) {
    super(message);
  }
}

export interface PublicPlayer {
  id: string;
  displayName: string;
  email: string | null;
  totalXp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
}

export interface AuthResult {
  player: PublicPlayer;
  accessToken: string;
}

export interface LeaderboardEntry {
  playerId: string;
  displayName: string;
  totalXp: number;
  level: number;
}

export interface ModeLeaderboardEntry {
  playerId: string;
  displayName: string;
  xp: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
  forfeits: number;
}

export interface PlayerModeStats {
  boardPreset: string;
  maxPlayers: number;
  xp: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
  forfeits: number;
}

export interface PlayerProfile {
  playerId: string;
  displayName: string;
  totalXp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  modeStats: PlayerModeStats[];
  createdAt: string;
}

export interface MatchHistoryPlayer {
  playerId: string;
  displayName: string;
  playerIndex: number;
  eliminatedTurn: number | null;
  forfeited: boolean;
}

export interface MatchHistoryEntry {
  matchId: string;
  gridRows: number;
  gridCols: number;
  maxPlayers: number;
  startedAt: string;
  endedAt: string;
  winnerId: string;
  winnerName: string;
  turnCount: number;
  participants: MatchHistoryPlayer[];
}

interface ApiSuccess<T> {
  code: number;
  message: string;
  data: T;
}

interface RequestOptions extends RequestInit {
  auth?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = false, headers, body, ...requestInit } = options;
  const requestHeaders = new Headers(headers);

  if (body && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getStoredAccessToken();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL}${path}`, {
    ...requestInit,
    headers: requestHeaders,
    body
  });

  const payload = await readJson<ApiSuccess<T> | ApiErrorBody>(response);

  if (!response.ok) {
    const error = payload as ApiErrorBody;
    if (response.status === 401) {
      clearStoredAccessToken();
    }

    throw new ApiClientError(error.message ?? "Request failed.", response.status, error.errors ?? []);
  }

  return (payload as ApiSuccess<T>).data;
}

export const authApi = {
  signup(input: { displayName: string; email: string; password: string }) {
    return apiRequest<AuthResult>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  login(input: { email: string; password: string }) {
    return apiRequest<AuthResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  googleLogin(accessToken: string) {
    return apiRequest<AuthResult>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ accessToken })
    });
  },

  me() {
    return apiRequest<{ player: PublicPlayer }>("/auth/me", {
      auth: true
    });
  },

  updateDisplayName(displayName: string) {
    return apiRequest<{ player: PublicPlayer }>("/auth/me", {
      method: "PATCH",
      auth: true,
      body: JSON.stringify({ displayName })
    });
  }
};

export const leaderboardApi = {
  list(limit = 20) {
    return apiRequest<{ leaderboard: LeaderboardEntry[] }>(`/leaderboard?limit=${limit}`);
  },

  mode(size: string, players: number, limit = 20) {
    return apiRequest<{ leaderboard: ModeLeaderboardEntry[] }>(
      `/leaderboard/mode?size=${size}&players=${players}&limit=${limit}`
    );
  }
};

export const playersApi = {
  profile(playerId: string) {
    return apiRequest<{ profile: PlayerProfile }>(`/players/${playerId}`);
  },

  matches(playerId: string, limit = 20) {
    return apiRequest<{ matches: MatchHistoryEntry[] }>(`/players/${playerId}/matches?limit=${limit}`);
  },

  myMatches(limit = 20) {
    return apiRequest<{ matches: MatchHistoryEntry[] }>(`/players/me/matches?limit=${limit}`, {
      auth: true
    });
  }
};

async function readJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {
      message: "Server returned an invalid response."
    } as T;
  }
}
