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
  onLogout: () => void;
  onInteract: () => void;
}

export function LobbyNav({
  playerName,
  isAuthenticated,
  player,
  onSaveName,
  onLogout,
  onInteract
}: LobbyNavProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      {/* Left column: level + XP, then identity card */}
      <div className="grid gap-2.5">
        <LevelBadge
          isAuthenticated={isAuthenticated}
          level={player?.level}
          xpIntoLevel={player?.xpIntoLevel}
          xpForNextLevel={player?.xpForNextLevel}
        />
        <div className="flex items-center gap-2">
          <NameCard
            displayName={playerName}
            canEdit={isAuthenticated}
            onSave={onSaveName}
            onInteract={onInteract}
          />
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Sign out? You'll leave any active queue or game.")) {
                  onLogout();
                }
              }}
              aria-label="Sign out"
              className="mt-4 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/80 bg-surface/90 text-fg-soft transition-colors hover:border-danger/60 hover:text-danger"
            >
              <LogOut size={14} aria-hidden="true" />
            </button>
          ) : (
            <Link
              href="/login"
              onClick={onInteract}
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-full border-2 border-white/80 bg-surface/90 px-3.5 text-sm font-bold text-primary transition-colors hover:border-primary"
            >
              <Sparkles size={14} strokeWidth={2.5} aria-hidden="true" />
              Sign in
            </Link>
          )}
        </div>
      </div>

      {/* Right column: leaderboard + remove ads */}
      <nav className="flex items-center gap-2">
        <Link
          href="/leaderboard"
          onClick={onInteract}
          className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-white/80 bg-surface/90 px-3.5 text-sm font-bold text-secondary-deep transition-colors hover:border-secondary"
        >
          <Trophy size={14} strokeWidth={2.5} aria-hidden="true" />
          <span className="hidden sm:inline">Leaderboard</span>
        </Link>
        <RemoveAdsButton />
      </nav>
    </div>
  );
}
