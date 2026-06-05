"use client";

import { useMemo, type CSSProperties } from "react";
import { PLAYER_COLORS } from "@/lib/colors";

const CONFETTI_COUNT = 22;

export function GameOverConfetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
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
    <>
      {pieces.map((piece) => (
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
    </>
  );
}
