"use client";

import { Lock, Star } from "lucide-react";

interface LevelBadgeProps {
  isAuthenticated: boolean;
  level?: number;
  xpIntoLevel?: number;
  xpForNextLevel?: number;
  onSignIn?: () => void;
}

// Top-left level + XP bar, Smash Karts style: a star level badge overlapping
// a dark navy pill whose gold fill tracks progress. Guests see a locked badge
// with a sign-in prompt instead of a progress bar.
export function LevelBadge({ isAuthenticated, level, xpIntoLevel, xpForNextLevel, onSignIn }: LevelBadgeProps) {
  const maxed = isAuthenticated && (xpForNextLevel ?? 0) === 0;
  const percent = maxed
    ? 100
    : xpForNextLevel
      ? Math.min(100, Math.round(((xpIntoLevel ?? 0) / xpForNextLevel) * 100))
      : 0;

  return (
    <div className="flex items-center">
      <span className="relative z-10 grid h-12 w-12 shrink-0 place-items-center">
        <Star
          size={48}
          aria-hidden="true"
          className="absolute inset-0 text-accent drop-shadow-[0_3px_0_rgba(24,73,128,0.35)]"
          fill="currentColor"
          strokeWidth={1}
          stroke="#fff"
        />
        {isAuthenticated ? (
          <span className="relative font-display text-base text-[#7a4d00]" aria-label={`Level ${level}`}>
            {level}
          </span>
        ) : (
          <Lock size={14} aria-hidden="true" className="relative text-[#7a4d00]" />
        )}
      </span>

      {isAuthenticated ? (
        <div className="relative -ml-4 h-7 w-44 overflow-hidden rounded-full border-2 border-white/85 bg-[#1c4577] shadow-[0_3px_0_rgba(24,73,128,0.25)] sm:w-56">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-b from-[#ffd95e] to-accent transition-[width] duration-500"
            style={{ width: `${percent}%` }}
          />
          <span className="relative z-10 grid h-full place-items-center pl-3 font-display text-xs tracking-wide text-white [text-shadow:0_1px_0_rgba(24,73,128,0.7)]">
            {maxed ? "MAX LEVEL" : `${xpIntoLevel ?? 0} / ${xpForNextLevel ?? 0}`}
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={onSignIn}
          className="relative -ml-4 inline-flex h-7 items-center rounded-full border-2 border-white/85 bg-[#1c4577] pl-6 pr-4 font-display text-xs tracking-wide text-white/90 shadow-[0_3px_0_rgba(24,73,128,0.25)] transition-colors hover:bg-[#25558d] hover:text-white"
        >
          Sign in to earn XP
        </button>
      )}
    </div>
  );
}
