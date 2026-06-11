"use client";

import Link from "next/link";
import { RotateCcw, Trophy } from "lucide-react";
import { useMemo, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PLAYER_COLORS } from "@/lib/colors";
import type { Player } from "@/lib/types";

interface GameOverProps {
  winner: Pick<Player, "id" | "name"> | null;
  winnerIndex?: number | null;
  players?: Player[] | null;
  xpDeltas?: Record<string, number> | null;
  isAuthenticated?: boolean;
  onPlayAgain: () => void;
  onRematch?: () => void;
}

export function GameOver({
  winner,
  winnerIndex = null,
  players = null,
  xpDeltas = null,
  isAuthenticated = false,
  onPlayAgain,
  onRematch,
}: GameOverProps) {
  const color = winnerIndex === null ? "#FF8A00" : PLAYER_COLORS[winnerIndex] ?? "#FF8A00";
  const confetti = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left: 10 + Math.random() * 80,
        delay: Math.random() * 1.2,
        duration: 1.4 + Math.random() * 0.8,
        size: 5 + Math.random() * 6,
        color: PLAYER_COLORS[i % PLAYER_COLORS.length] ?? "#FF8A00"
      })),
    []
  );

  return (
    <Card
      className="mx-auto mt-[10vh] grid w-[min(520px,100%)] gap-8 overflow-hidden p-10 [animation:panel-rise_0.6s_cubic-bezier(0.2,0.8,0.4,1)_both]"
      aria-labelledby="gameover-title"
      style={{ borderColor: color }}
    >
      {confetti.map((piece) => (
        <span
          key={piece.id}
          className="pointer-events-none absolute top-0 rounded-[2px]"
          style={
            {
              left: `${piece.left}%`,
              width: `${piece.size}px`,
              height: `${piece.size}px`,
              background: piece.color,
              animation: `confetti-fall ${piece.duration}s ease-in ${piece.delay}s forwards`
            } as CSSProperties
          }
        />
      ))}

      <div className="grid gap-3 text-center">
        {winner ? (
          <span
            className="mx-auto block h-14 w-14 rounded-full"
            style={{
              background: `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${color} 70%, white) 0%, ${color} 55%, color-mix(in srgb, ${color} 65%, black) 100%)`,
              boxShadow: "0 6px 14px rgba(20,60,110,0.35)",
              animation: "orb-critical 0.7s ease-in-out infinite"
            }}
          />
        ) : null}
        <h1
          id="gameover-title"
          className="font-display text-4xl text-fg [animation:win-burst_0.8s_cubic-bezier(0.2,1.4,0.4,1)_both] sm:text-5xl"
        >
          {winner ? (
            <>
              <span className="block text-xs uppercase tracking-[0.4em] text-fg-muted">Winner</span>
              <span className="block" style={{ color }}>
                {winner.name}
              </span>
            </>
          ) : (
            "It's a draw"
          )}
        </h1>
      </div>

      {players && players.length > 0 && xpDeltas ? (
        <ul className="grid gap-1.5">
          {players.map((player, index) => {
            const delta = xpDeltas[player.id];
            const isWinner = player.id === winner?.id;
            const entryColor = PLAYER_COLORS[index] ?? "#FF8A00";
            return (
              <li
                key={player.id}
                className="flex items-center justify-between rounded-xl border-2 border-line bg-surface-2 px-4 py-2 text-sm font-semibold"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: entryColor }}
                    aria-hidden="true"
                  />
                  <span className="text-fg-soft">{player.name}</span>
                </span>
                {delta !== undefined ? (
                  <span className={isWinner ? "font-display text-primary" : "font-display text-fg-muted"}>
                    +{delta} XP
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {!isAuthenticated ? (
        <p className="rounded-xl border-2 border-line bg-surface-2 px-4 py-3 text-center text-xs font-semibold text-fg-muted">
          Sign in to earn XP and climb the leaderboard.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {onRematch ? (
          <Button variant="ghost" size="lg" onClick={onRematch}>
            <RotateCcw size={16} aria-hidden="true" strokeWidth={2.5} />
            Rematch
          </Button>
        ) : null}
        <Button
          variant="primary"
          size="lg"
          onClick={onPlayAgain}
          className={onRematch ? "" : "sm:col-span-2"}
        >
          Back to Lobby
        </Button>
      </div>
      <Link
        href="/leaderboard"
        className="flex items-center justify-center gap-2 text-xs font-semibold text-fg-muted transition-colors hover:text-secondary-deep"
      >
        <Trophy size={12} aria-hidden="true" strokeWidth={2.5} />
        View leaderboard
      </Link>
    </Card>
  );
}
