export const AUTH_TOKEN_STORAGE_KEY = "chain_reaction_access_token";

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setStoredAccessToken(token: string): void {
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearStoredAccessToken(): void {
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}
