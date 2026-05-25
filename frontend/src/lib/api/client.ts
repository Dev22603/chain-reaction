import { config } from "@/config";
import { getStoredAccessToken, clearStoredAccessToken } from "@/lib/auth";
import type { ApiErrorBody, ApiSuccess, RequestOptions } from "@/types";

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

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = false, headers, body, ...requestInit } = options;
  const requestHeaders = new Headers(headers);

  if (body && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = await getStoredAccessToken();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const fetchOptions: RequestInit = {
    ...requestInit,
    headers: requestHeaders,
    body
  };

  try {
    const response = await fetch(`${config.apiUrl}${path}`, fetchOptions);

    const payload = await readJson<ApiSuccess<T> | ApiErrorBody>(response);

    if (!response.ok) {
      const error = payload as ApiErrorBody;
      if (response.status === 401) {
        if (typeof window !== "undefined") {
            clearStoredAccessToken();
        }
      }

      throw new ApiClientError(
        error.message ?? "Request failed.",
        response.status,
        error.code ?? "request_failed",
        error.errors ?? []
      );
    }

    return (payload as ApiSuccess<T>).data;
  } catch (error) {
     if (error instanceof TypeError && error.message === "fetch failed" && typeof window === "undefined") {
        console.warn("Backend not reachable during build, mocking response.", path);
        return { leaderboard: [], profile: {
          playerId: "",
          displayName: "",
          score: 0,
          wins: 0,
          losses: 0,
          gamesPlayed: 0,
          forfeits: 0,
          createdAt: ""
        }, matches: [] } as unknown as T;
    }
    throw error;
  }
}

async function readJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {
      message: "Server returned an invalid response."
    } as T;
  }
}
