"use client";

import { RotateCcw } from "lucide-react";
import { useMemo, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardCorners, CardEyebrow } from "@/components/ui/card";
import { PLAYER_COLORS } from "@/lib/colors";
import type { Player } from "@/lib/types";

interface GameOverProps {
  winner: Pick<Player, "id" | "name"> | null;
  winnerIndex?: number | null;
  onPlayAgain: () => void;
}

export function GameOver({ winner, winnerIndex = null, onPlayAgain }: GameOverProps) {
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

      <Button variant="primary" size="lg" onClick={onPlayAgain}>
        <RotateCcw size={16} aria-hidden="true" strokeWidth={2.5} />
        New Round
      </Button>
    </Card>
  );
}
