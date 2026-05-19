"use client";

import { Lock, Play, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { AtomicHero } from "@/components/AtomicHero";
import type { GameMode } from "@/lib/types";

const PLAYER_OPTIONS = [2, 3, 4, 5, 6, 7, 8] as const;
const PLAYER_COLORS: Record<number, string> = {
  2: "#ff3b6b",
  3: "#2ad8ff",
  4: "#ffd23f",
  5: "#5cff9b",
  6: "#ff3da7",
  7: "#ff6b1f",
  8: "#b6ff3c"
};

interface LandingHubProps {
  isAuthenticated: boolean;
  displayName: string | null;
  connectionReady: boolean;
  onPlay: (playerCount: number, mode: GameMode) => void;
  onInteract?: () => void;
}

export function LandingHub({
  isAuthenticated,
  connectionReady,
  onPlay,
  onInteract
}: LandingHubProps) {
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [mode, setMode] = useState<GameMode>("casual");

  const handlePlay = useCallback(() => {
    onInteract?.();
    onPlay(playerCount, mode);
  }, [onInteract, onPlay, playerCount, mode]);

  const rankedLocked = !isAuthenticated;

  return (
    <div className="relative mx-auto grid w-full max-w-[860px] place-items-center gap-8 pt-2 pb-12 sm:gap-10 [animation:panel-rise_0.6s_cubic-bezier(0.2,0.8,0.4,1)_both]">
      <AtomicHero className="relative h-[150px] w-[280px] sm:h-[180px] sm:w-[340px]" />

      <div className="grid gap-3 text-center">
        <h1
          className="font-display text-[clamp(3.4rem,11vw,6.5rem)] leading-[0.95] tracking-tight text-white game-text-shadow [animation:hero-drop_0.7s_cubic-bezier(0.2,0.8,0.4,1)_both]"
          aria-label="Chain Reaction"
        >
          <span className="block text-white">CHAIN</span>
          <span
            className="block bg-gradient-to-b from-uranium via-reactor to-plasma bg-clip-text text-transparent"
            style={{ WebkitTextStroke: "0.5px rgba(255,255,255,0.08)" }}
          >
            REACTION
          </span>
        </h1>
        <p className="font-body text-base font-semibold text-fg-soft sm:text-lg">
          Pop. Bounce. Take over the board.
        </p>
      </div>

      <div className="grid w-full gap-3">
        <p className="text-center font-display text-xs tracking-[0.2em] text-fg-muted sm:text-sm">
          HOW MANY PLAYERS?
        </p>
        <div
          className="grid grid-cols-7 gap-2 sm:gap-3"
          role="radiogroup"
          aria-label="Number of players"
        >
          {PLAYER_OPTIONS.map((count) => {
            const active = playerCount === count;
            const chipColor = PLAYER_COLORS[count];
            return (
              <button
                key={count}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={`${count} players`}
                onClick={() => {
                  onInteract?.();
                  setPlayerCount(count);
                }}
                className={
                  "group relative grid aspect-square place-items-center overflow-hidden rounded-2xl font-display text-2xl sm:text-3xl transition-transform duration-150 active:scale-95 " +
                  (active
                    ? "scale-105 text-bg-deep"
                    : "text-white/80 hover:scale-105 hover:text-white")
                }
                style={
                  active
                    ? {
                        background: `radial-gradient(circle at 30% 25%, #ffffff, ${chipColor} 55%, ${chipColor})`,
                        boxShadow: `0 6px 0 0 rgba(0,0,0,0.35), 0 10px 22px 0 ${chipColor}80, inset 0 2px 0 0 rgba(255,255,255,0.5)`
                      }
                    : {
                        background: "rgba(46, 26, 111, 0.55)",
                        boxShadow: "0 4px 0 0 rgba(0,0,0,0.35), inset 0 1px 0 0 rgba(255,255,255,0.08)"
                      }
                }
              >
                {count}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="grid w-full max-w-[460px] gap-2"
        role="radiogroup"
        aria-label="Match mode"
      >
        <p className="text-center font-display text-xs tracking-[0.2em] text-fg-muted sm:text-sm">
          MATCH MODE
        </p>
        <div className="grid grid-cols-2 gap-2 rounded-2xl border-2 border-line bg-surface/40 p-1.5">
          <ModeChip
            label="Casual"
            description="Friendly. No leaderboard impact."
            selected={mode === "casual"}
            onSelect={() => {
              onInteract?.();
              setMode("casual");
            }}
          />
          <ModeChip
            label="Ranked"
            description={rankedLocked ? "Sign in to unlock" : "Earn leaderboard points"}
            selected={mode === "ranked"}
            locked={rankedLocked}
            onSelect={() => {
              onInteract?.();
              setMode("ranked");
            }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handlePlay}
        disabled={!connectionReady}
        aria-disabled={!connectionReady}
        className="game-btn-shadow group relative grid w-full max-w-[460px] grid-flow-col items-center justify-center gap-3 rounded-3xl bg-gradient-to-b from-uranium via-reactor to-[#d23a1a] px-8 py-5 font-display text-3xl tracking-wide text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50 sm:py-6 sm:text-4xl [animation:button-bounce-in_0.5s_cubic-bezier(0.2,0.8,0.4,1)_0.15s_both]"
      >
        <Play
          size={28}
          strokeWidth={3}
          fill="currentColor"
          aria-hidden="true"
          className="drop-shadow-[0_2px_0_rgba(0,0,0,0.45)]"
        />
        <span className="game-text-shadow">{connectionReady ? "PLAY" : "CONNECTING…"}</span>
      </button>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-sm">
        {!isAuthenticated ? (
          <Link
            href="/login"
            onClick={() => onInteract?.()}
            className="group inline-flex items-center gap-2 rounded-full border-2 border-uranium/40 bg-uranium/10 px-4 py-2 font-body font-semibold text-uranium transition-colors hover:border-uranium hover:bg-uranium/20"
          >
            <Sparkles size={14} strokeWidth={2.5} aria-hidden="true" />
            Sign in to earn XP
          </Link>
        ) : (
          <Link
            href="/leaderboard"
            onClick={() => onInteract?.()}
            className="group inline-flex items-center gap-2 rounded-full border-2 border-cherenkov/40 bg-cherenkov/10 px-4 py-2 font-body font-semibold text-cherenkov transition-colors hover:border-cherenkov hover:bg-cherenkov/20"
          >
            <Trophy size={14} strokeWidth={2.5} aria-hidden="true" />
            See the leaderboard
          </Link>
        )}
      </div>
    </div>
  );
}

function ModeChip({
  label,
  description,
  selected,
  locked,
  onSelect
}: {
  label: string;
  description: string;
  selected: boolean;
  locked?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={
        "grid gap-1 rounded-xl px-4 py-3 text-left font-body transition-colors " +
        (selected
          ? "bg-cherenkov/15 text-cherenkov shadow-[inset_0_0_0_2px_rgba(42,216,255,0.45)]"
          : "text-fg-soft hover:bg-surface/40")
      }
    >
      <span className="flex items-center gap-2 font-display text-base">
        {locked ? <Lock size={12} aria-hidden="true" /> : null}
        {label}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-muted">
        {description}
      </span>
    </button>
  );
}
