"use client";

import { LogOut, Sparkles, Trophy, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export function TopBar() {
  const { player, loading, isAuthenticated, logout } = useAuth();

  return (
    <header className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-3 px-4 py-5 sm:px-8 sm:py-6 lg:px-10">
      <Link href="/" className="flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-90">
        <span className="relative grid h-9 w-9 place-items-center">
          <span className="absolute inset-0 animate-[orb-pulse_2.4s_ease-in-out_infinite] rounded-full bg-gradient-to-br from-reactor-glow to-reactor opacity-90 shadow-[0_0_24px_rgba(255,107,31,0.5)]" />
          <span className="relative h-2.5 w-2.5 rounded-full bg-white" />
        </span>
        <span className="truncate font-display text-base text-white">
          Chain Reaction
        </span>
      </Link>

      <nav className="flex items-center gap-2">
        <Link
          href="/leaderboard"
          className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border-2 border-line bg-surface/60 px-3 font-body text-sm font-semibold text-fg-soft transition-colors hover:border-cherenkov hover:text-cherenkov"
        >
          <Trophy size={14} aria-hidden="true" />
          <span className="hidden sm:inline">Leaderboard</span>
        </Link>

        {loading ? (
          <span
            aria-hidden="true"
            className="inline-flex min-h-10 w-24 shrink-0 animate-pulse rounded-full border-2 border-line bg-surface/40"
          />
        ) : isAuthenticated && player ? (
          <>
            <Link
              href={`/players/${player.id}`}
              aria-label={`Profile and match history for ${player.displayName}`}
              className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border-2 border-cherenkov/50 bg-cherenkov/10 px-3 font-body text-sm font-semibold text-cherenkov transition-colors hover:bg-cherenkov/20"
            >
              <UserCircle2 size={14} aria-hidden="true" />
              <span className="max-w-[140px] truncate">{player.displayName}</span>
            </Link>
            <button
              type="button"
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full border-2 border-line bg-surface/60 px-3 font-body text-sm font-semibold text-fg-soft transition-colors hover:border-reactor hover:text-reactor"
              onClick={() => {
                if (window.confirm("Sign out? You'll leave any active queue or game.")) {
                  logout();
                }
              }}
              aria-label="Sign out"
            >
              <LogOut size={14} aria-hidden="true" />
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border-2 border-uranium/40 bg-uranium/10 px-3.5 font-body text-sm font-semibold text-uranium transition-colors hover:border-uranium hover:bg-uranium/20"
          >
            <Sparkles size={14} aria-hidden="true" />
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
