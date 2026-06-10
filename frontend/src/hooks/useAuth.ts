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

  useEffect(() => {
    let active = true;

    async function loadPlayer() {
      if (!getStoredAccessToken()) {
        if (active) {
          setPlayer(null);
          setLoading(false);
        }
        return;
      }

      try {
        const result = await authApi.me();
        if (active) {
          setPlayer(result.player);
        }
      } catch (err) {
        if (active) {
          if (err instanceof ApiClientError && err.status === 401) {
            logout();
          } else {
            clearStoredAccessToken();
            setPlayer(null);
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPlayer();

    return () => {
      active = false;
    };
  }, [logout]);

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
    updateDisplayName
  };
}
