"use client";

import Link from "next/link";
import { RotateCcw, Trophy } from "lucide-react";
import { useMemo, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardCorners, CardEyebrow } from "@/components/ui/card";
import { PLAYER_COLORS } from "@/lib/colors";
import type { GameMode, Player } from "@/lib/types";

interface GameOverProps {
  winner: Pick<Player, "id" | "name"> | null;
  mode: GameMode | null;
  winnerIndex?: number | null;
  players?: Player[] | null;
  scoreDeltas?: Record<string, number> | null;
  onPlayAgain: () => void;
}

export function GameOver({
  winner,
  mode,
  winnerIndex = null,
  players = null,
  scoreDeltas = null,
  onPlayAgain
}: GameOverProps) {
  const color = winnerIndex === null ? "#ff5b2e" : PLAYER_COLORS[winnerIndex] ?? "#ff5b2e";
  const confetti = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left: 10 + Math.random() * 80,
        delay: Math.random() * 1.2,
        duration: 1.4 + Math.random() * 0.8,
        size: 5 + Math.random() * 6,
        color: PLAYER_COLORS[i % PLAYER_COLORS.length] ?? "#ff5b2e"
      })),
    []
  );

  return (
    <Card
      className="mx-auto mt-[10vh] grid w-[min(520px,100%)] gap-8 overflow-hidden p-10 [animation:panel-rise_0.6s_cubic-bezier(0.2,0.8,0.4,1)_both]"
      aria-labelledby="gameover-title"
      style={{
        borderColor: `${color}66`,
        boxShadow: `0 0 60px color-mix(in srgb, ${color} 15%, transparent)`
      }}
    >
      <CardCorners />
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
        <CardEyebrow>// containment breached</CardEyebrow>
        <span className="mx-auto border border-line bg-bg-soft px-3 py-1 font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
          {mode ?? "casual"} result
        </span>
        {winner ? (
          <span
            className="mx-auto block h-14 w-14 rounded-full"
            style={{
              background: `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${color} 70%, white) 0%, ${color} 55%, color-mix(in srgb, ${color} 65%, black) 100%)`,
              boxShadow: `0 0 30px ${color}, 0 0 60px color-mix(in srgb, ${color} 40%, transparent)`,
              animation: "orb-critical 0.7s ease-in-out infinite"
            }}
          />
        ) : null}
        <h1
          id="gameover-title"
          className="font-display text-4xl uppercase tracking-[0.06em] text-fg [animation:win-burst_0.8s_cubic-bezier(0.2,1.4,0.4,1)_both] sm:text-5xl"
        >
          {winner ? (
            <>
              <span className="block text-fg-soft text-xs tracking-[0.4em]">winner</span>
              <span className="block" style={{ color }}>
                {winner.name}
              </span>
            </>
          ) : (
            "Stalemate"
          )}
        </h1>
      </div>

      <div className="border border-line bg-bg-soft px-4 py-3 text-center font-mono text-xs leading-relaxed text-fg-muted">
        {mode === "ranked"
          ? "Ranked result saved. Leaderboard points update after persistence completes."
          : "Casual result complete. Leaderboard points are unchanged."}
      </div>

      {players && players.length > 0 && scoreDeltas ? (
        <ul className="grid gap-1">
          {players.map((player, index) => {
            const delta = scoreDeltas[player.id];
            const isWinner = player.id === winner?.id;
            const playerColor = PLAYER_COLORS[index] ?? "#ff5b2e";
            return (
              <li
                key={player.id}
                className="flex items-center justify-between border border-line bg-bg-soft px-4 py-2 font-mono text-xs"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: playerColor }}
                    aria-hidden="true"
                  />
                  <span className="text-fg-soft">{player.name}</span>
                </span>
                {delta !== undefined ? (
                  <span
                    className={
                      isWinner ? "font-display text-cherenkov" : "font-display text-fg-muted"
                    }
                  >
                    {`+${delta}`}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Button variant="primary" size="lg" onClick={onPlayAgain}>
          <RotateCcw size={16} aria-hidden="true" strokeWidth={2.5} />
          New Round
        </Button>
        <Link
          href="/leaderboard"
          className="relative inline-flex min-h-14 select-none items-center justify-center gap-2 border border-line bg-surface/60 px-5 py-3 font-display text-xs uppercase tracking-[0.14em] text-fg-soft backdrop-blur transition-[transform,box-shadow,background,color,border-color] duration-200 ease-out hover:border-cherenkov hover:text-cherenkov hover:shadow-cherenkov active:translate-y-px sm:px-6 sm:text-sm"
        >
          <Trophy size={16} aria-hidden="true" strokeWidth={2.5} />
          Leaderboard
        </Link>
      </div>
    </Card>
  );
}
