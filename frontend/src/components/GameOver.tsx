"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardCorners, CardEyebrow } from "@/components/ui/card";
import type { Player } from "@/lib/types";

interface GameOverProps {
  winner: Pick<Player, "id" | "name"> | null;
  onPlayAgain: () => void;
}

export function GameOver({ winner, onPlayAgain }: GameOverProps) {
  return (
    <Card
      className="mx-auto mt-[10vh] grid w-[min(520px,100%)] gap-8 p-10 [animation:panel-rise_0.6s_cubic-bezier(0.2,0.8,0.4,1)_both]"
      aria-labelledby="gameover-title"
    >
      <CardCorners />
      <div className="grid gap-3 text-center">
        <CardEyebrow>// containment breached</CardEyebrow>
        <h1
          id="gameover-title"
          className="font-display text-4xl uppercase tracking-[0.06em] text-fg [animation:win-burst_0.8s_cubic-bezier(0.2,1.4,0.4,1)_both] sm:text-5xl"
        >
          {winner ? (
            <>
              <span className="block text-fg-soft text-xs tracking-[0.4em]">winner</span>
              <span className="block text-reactor [text-shadow:0_0_30px_rgba(255,91,46,0.6)]">
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
