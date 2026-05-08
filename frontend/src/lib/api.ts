import { clearStoredAccessToken, getStoredAccessToken } from "@/lib/auth";

const DEFAULT_API_URL = "http://localhost:8080/api";

export interface ApiErrorBody {
  type?: "error";
  code?: string;
  message?: string;
  errors?: string[];
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code = "request_failed",
    public readonly errors: string[] = []
  ) {
    super(message);
  }
}

export interface PublicPlayer {
  id: string;
  displayName: string;
  email: string | null;
}

export interface AuthResult {
  player: PublicPlayer;
  accessToken: string;
}

export interface LeaderboardEntry {
  playerId: string;
  displayName: string;
  score: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
  forfeits: number;
}

export interface PlayerProfile {
  playerId: string;
  displayName: string;
  score: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
  forfeits: number;
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
  mode: "casual" | "ranked";
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
  success: true;
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

    throw new ApiClientError(
      error.message ?? "Request failed.",
      response.status,
      error.code ?? "request_failed",
      error.errors ?? []
    );
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

  me() {
    return apiRequest<{ player: PublicPlayer }>("/auth/me", {
      auth: true
    });
  }
};

export const leaderboardApi = {
  list(limit = 20) {
    return apiRequest<{ leaderboard: LeaderboardEntry[] }>(`/leaderboard?limit=${limit}`);
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
    return apiRequest<{ matches: MatchHistoryEntry[] }>(`/me/matches?limit=${limit}`, {
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
