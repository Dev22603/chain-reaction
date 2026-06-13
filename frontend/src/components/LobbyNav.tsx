import Link from "next/link";
import { LogOut, Sparkles, Trophy } from "lucide-react";
import { NameCard } from "@/components/NameCard";
import { LevelBadge } from "@/components/LevelBadge";
import { RemoveAdsButton } from "@/components/RemoveAdsButton";
import type { PublicPlayer } from "@/lib/api";

interface LobbyNavProps {
  playerName: string;
  isAuthenticated: boolean;
  player: PublicPlayer | null;
  onSaveName: (newName: string) => Promise<void>;
  onSignIn: () => void;
  onRequestSignOut: () => void;
  onInteract: () => void;
}

export function LobbyNav({
  playerName,
  isAuthenticated,
  player,
  onSaveName,
  onSignIn,
  onRequestSignOut,
  onInteract
}: LobbyNavProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      {/* Left column: level + XP. On small screens (no sidebar) the identity
          card and auth actions live here too. */}
      <div className="grid gap-2.5">
        <LevelBadge
          isAuthenticated={isAuthenticated}
          level={player?.level}
          xpIntoLevel={player?.xpIntoLevel}
          xpForNextLevel={player?.xpForNextLevel}
          onSignIn={onSignIn}
        />
        <div className="flex items-center gap-2 lg:hidden">
          <NameCard
            displayName={playerName}
            canEdit={isAuthenticated}
            onSave={onSaveName}
            onInteract={onInteract}
          />
          {isAuthenticated ? (
            <button
              type="button"
              onClick={onRequestSignOut}
              aria-label="Sign out"
              className="mt-4 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/80 bg-surface/90 text-fg-soft transition-colors hover:border-danger/60 hover:text-danger"
            >
              <LogOut size={14} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-full border-2 border-white/80 bg-surface/90 px-3.5 text-sm font-bold text-primary transition-colors hover:border-primary"
            >
              <Sparkles size={14} strokeWidth={2.5} aria-hidden="true" />
              Sign in
            </button>
          )}
        </div>
      </div>

      {/* Right column: chunky game-style buttons, like the ref's Shop row */}
      <nav className="flex items-center gap-2">
        <Link
          href="/leaderboard"
          onClick={onInteract}
          className="btn-secondary game-btn-shadow inline-flex h-10 items-center gap-2 px-4 text-sm tracking-wide"
        >
          <Trophy size={15} strokeWidth={2.5} aria-hidden="true" />
          <span className="hidden sm:inline">Leaderboard</span>
        </Link>
        <RemoveAdsButton />
      </nav>
    </div>
  );
}
