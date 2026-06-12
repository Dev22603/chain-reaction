"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, ApiClientError, type PublicPlayer } from "@/lib/api";
import { clearStoredAccessToken, getStoredAccessToken } from "@/lib/auth";

export function useAuth() {
  const router = useRouter();
  const [player, setPlayer] = useState<PublicPlayer | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearStoredAccessToken();
    setPlayer(null);
    router.refresh();
  }, [router]);

  // Re-reads the stored token and refetches the player. Called on mount and
  // after a modal login stores a fresh token.
  const refresh = useCallback(async () => {
    if (!getStoredAccessToken()) {
      setPlayer(null);
      setLoading(false);
      return;
    }

    try {
      const result = await authApi.me();
      setPlayer(result.player);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        logout();
      } else {
        clearStoredAccessToken();
        setPlayer(null);
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateDisplayName = useCallback(async (displayName: string) => {
    const result = await authApi.updateDisplayName(displayName);
    setPlayer(result.player);
    return result.player;
  }, []);

  return {
    player,
    loading,
    isAuthenticated: Boolean(player),
    logout,
    refresh,
    updateDisplayName
  };
}
