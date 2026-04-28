"use client";

import { RotateCcw } from "lucide-react";
import type { Player } from "@/lib/types";

interface GameOverProps {
  winner: Pick<Player, "id" | "name"> | null;
  onPlayAgain: () => void;
}

export function GameOver({ winner, onPlayAgain }: GameOverProps) {
  return (
    <section className="panel gameover-panel" aria-labelledby="gameover-title">
      <p className="eyebrow">Game over</p>
      <h1 id="gameover-title">{winner ? `${winner.name} wins` : "Winner decided"}</h1>
      <button className="primary-button" type="button" onClick={onPlayAgain}>
        <RotateCcw size={18} aria-hidden="true" />
        Play again
      </button>
    </section>
  );
}
