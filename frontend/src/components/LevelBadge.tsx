"use client";

import Link from "next/link";
import { Lock, Star } from "lucide-react";

interface LevelBadgeProps {
  isAuthenticated: boolean;
  level?: number;
  xpIntoLevel?: number;
  xpForNextLevel?: number;
}

// Top-left level + XP bar, Smash Karts style. Guests see a locked badge
// with a sign-in prompt instead of a progress bar.
export function LevelBadge({ isAuthenticated, level, xpIntoLevel, xpForNextLevel }: LevelBadgeProps) {
  const maxed = isAuthenticated && (xpForNextLevel ?? 0) === 0;
  const percent = maxed
    ? 100
    : xpForNextLevel
      ? Math.min(100, Math.round(((xpIntoLevel ?? 0) / xpForNextLevel) * 100))
      : 0;

  return (
    <div className="flex items-center gap-2">
      <span className="relative grid h-12 w-12 shrink-0 place-items-center">
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
        <div className="grid w-36 gap-1 sm:w-48">
          <div className="h-4 overflow-hidden rounded-full border-2 border-white/85 bg-[#1f4f86] shadow-[0_3px_0_rgba(24,73,128,0.25)]">
            <div
              className="h-full rounded-full bg-gradient-to-b from-[#ffd95e] to-accent transition-[width] duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-center text-[11px] font-bold text-white drop-shadow-[0_1px_0_rgba(24,73,128,0.6)]">
            {maxed ? "MAX LEVEL" : `${xpIntoLevel ?? 0} / ${xpForNextLevel ?? 0} XP`}
          </span>
        </div>
      ) : (
        <Link
          href="/login"
          className="rounded-full border-2 border-white/80 bg-surface/90 px-3 py-1.5 text-xs font-bold text-fg-soft transition-colors hover:border-secondary hover:text-secondary-deep"
        >
          Sign in to earn XP
        </Link>
      )}
    </div>
  );
}
