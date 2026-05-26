import Link from "next/link";
import { LogOut, Sparkles, Trophy } from "lucide-react";
import { NameCard } from "@/components/NameCard";

interface LobbyNavProps {
  playerName: string;
  isAuthenticated: boolean;
  onSaveName: (newName: string) => Promise<void>;
  onLogout: () => void;
  onInteract: () => void;
}

export function LobbyNav({
  playerName,
  isAuthenticated,
  onSaveName,
  onLogout,
  onInteract
}: LobbyNavProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <NameCard
        displayName={playerName}
        canEdit={isAuthenticated}
        onSave={onSaveName}
        onInteract={onInteract}
      />

      <nav className="flex items-center gap-2">
        <Link
          href="/leaderboard"
          onClick={onInteract}
          className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-cherenkov/50 bg-surface px-3.5 font-body text-sm font-semibold text-cherenkov transition-colors hover:border-cherenkov hover:bg-cherenkov/10"
        >
          <Trophy size={14} strokeWidth={2.5} aria-hidden="true" />
          <span className="hidden sm:inline">Leaderboard</span>
        </Link>
        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Sign out? You'll leave any active queue or game.")) {
                onLogout();
              }
            }}
            aria-label="Sign out"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-line bg-surface text-fg-soft transition-colors hover:border-reactor hover:text-reactor"
          >
            <LogOut size={14} aria-hidden="true" />
          </button>
        ) : (
          <Link
            href="/login"
            onClick={onInteract}
            className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-reactor/50 bg-surface px-3.5 font-body text-sm font-semibold text-reactor transition-colors hover:border-reactor hover:bg-reactor/10"
          >
            <Sparkles size={14} strokeWidth={2.5} aria-hidden="true" />
            Sign in
          </Link>
        )}
      </nav>
    </div>
  );
}
