"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, type PublicPlayer } from "@/lib/api";
import { clearStoredAccessToken, getStoredAccessToken } from "@/lib/auth";

export function useAuth() {
  const router = useRouter();
  const [player, setPlayer] = useState<PublicPlayer | null>(null);
  const [loading, setLoading] = useState(true);

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
      } catch {
        if (active) {
          clearStoredAccessToken();
          setPlayer(null);
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
  }, []);

  const logout = useCallback(() => {
    clearStoredAccessToken();
    setPlayer(null);
    router.refresh();
  }, [router]);

  return {
    player,
    loading,
    isAuthenticated: Boolean(player),
    logout
  };
}
