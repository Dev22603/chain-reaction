"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, LogOut, Sparkles, Trophy, UserCircle2 } from "lucide-react";
import { NameCard } from "@/components/NameCard";
import { cn } from "@/lib/cn";
import { leaderboardApi, type LeaderboardEntry, type PublicPlayer } from "@/lib/api";

interface LobbySidebarProps {
  playerName: string;
  isAuthenticated: boolean;
  player: PublicPlayer | null;
  onSaveName: (newName: string) => Promise<void>;
  onSignIn: () => void;
  onRequestSignOut: () => void;
  onInteract: () => void;
  className?: string;
}

// Left column of stacked panels, Smash Karts style: identity panel on top
// (name + account actions), top-players panel filling the rest.
export function LobbySidebar({
  playerName,
  isAuthenticated,
  player,
  onSaveName,
  onSignIn,
  onRequestSignOut,
  onInteract,
  className
}: LobbySidebarProps) {
  return (
    <aside className={cn("w-60 flex-col gap-3", className)}>
      <section className="panel-card-blue grid gap-2.5 p-3 [animation:panel-rise_0.5s_cubic-bezier(0.2,0.8,0.4,1)_0.1s_both]">
        <NameCard
          displayName={playerName}
          canEdit={isAuthenticated}
          onSave={onSaveName}
          onInteract={onInteract}
        />

        {isAuthenticated && player ? (
          <>
            <Link
              href={`/players/${player.id}`}
              onClick={onInteract}
              className="btn-primary game-btn-shadow w-full px-3 py-2 text-sm tracking-wide"
            >
              <UserCircle2 size={15} strokeWidth={2.5} aria-hidden="true" />
              <span>My Profile</span>
            </Link>
            <button
              type="button"
              onClick={onRequestSignOut}
              className="game-btn-shadow inline-flex w-full items-center justify-center gap-2 rounded-2xl border-[3px] border-white/90 bg-white px-3 py-2 font-display text-sm tracking-wide text-fg-soft [--btn-depth:#b9cfe4]"
            >
              <LogOut size={14} strokeWidth={2.5} aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onSignIn}
              className="btn-primary game-btn-shadow w-full px-3 py-2 text-sm tracking-wide"
            >
              <Sparkles size={15} strokeWidth={2.5} aria-hidden="true" />
              <span>Sign In / Up</span>
            </button>
            <p className="text-center text-[11px] font-bold text-white/85">
              Keep your XP, stats &amp; name
            </p>
          </>
        )}
      </section>

      <TopPlayersPanel onInteract={onInteract} />
    </aside>
  );
}

function TopPlayersPanel({ onInteract }: { onInteract: () => void }) {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    leaderboardApi
      .list(5)
      .then((result) => {
        if (!cancelled) setEntries(result.leaderboard);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="panel-card-blue flex min-h-0 flex-1 flex-col overflow-hidden p-3 [animation:panel-rise_0.5s_cubic-bezier(0.2,0.8,0.4,1)_0.2s_both]">
      <header className="mb-2 flex items-center gap-2 font-display text-sm tracking-wide text-white [text-shadow:0_2px_0_rgba(24,73,128,0.45)]">
        <Trophy size={15} aria-hidden="true" className="text-accent drop-shadow-[0_2px_0_rgba(24,73,128,0.45)]" />
        TOP PLAYERS
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {failed ? (
          <p className="px-1 text-[11px] font-bold text-white/75">Couldn&apos;t load players.</p>
        ) : entries === null ? (
          <ul className="grid gap-1.5" aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="h-8 animate-pulse rounded-xl bg-white/25" />
            ))}
          </ul>
        ) : entries.length === 0 ? (
          <p className="px-1 text-[11px] font-bold text-white/75">No games played yet.</p>
        ) : (
          <ol className="grid gap-1.5">
            {entries.map((entry, index) => (
              <li key={entry.playerId}>
                <Link
                  href={`/players/${entry.playerId}`}
                  onClick={onInteract}
                  className="flex items-center gap-2 rounded-xl bg-white/95 px-2.5 py-1.5 text-xs font-bold text-fg transition-colors hover:bg-white"
                >
                  <span className="w-4 shrink-0 text-center font-display text-secondary-deep">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{entry.displayName}</span>
                  <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full border border-accent bg-accent/20 px-1 font-display text-[10px] text-[#7a4d00]">
                    {entry.level}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>

      <Link
        href="/leaderboard"
        onClick={onInteract}
        className="mt-2.5 inline-flex items-center justify-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-white/25"
      >
        Full leaderboard
        <ChevronRight size={12} strokeWidth={3} aria-hidden="true" />
      </Link>
    </section>
  );
}
