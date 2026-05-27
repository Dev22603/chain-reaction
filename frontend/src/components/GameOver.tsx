"use client";

import Link from "next/link";
import { RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardCorners, CardEyebrow } from "@/components/ui/card";
import { GameOverConfetti } from "@/components/gameover/GameOverConfetti";
import { GameOverScoreList } from "@/components/gameover/GameOverScoreList";
import { WinnerBadge } from "@/components/gameover/WinnerBadge";
import { PLAYER_COLORS } from "@/lib/colors";
import type { GameMode, Player } from "@/lib/types";

interface GameOverProps {
  winner: Pick<Player, "id" | "name"> | null;
  mode: GameMode | null;
  winnerIndex?: number | null;
  players?: Player[] | null;
  scoreDeltas?: Record<string, number> | null;
  onPlayAgain: () => void;
  onRematch?: () => void;
}

const FALLBACK_COLOR = "#ff5b2e";

export function GameOver({
  winner,
  mode,
  winnerIndex = null,
  players = null,
  scoreDeltas = null,
  onPlayAgain,
  onRematch
}: GameOverProps) {
  const color = winnerIndex === null ? FALLBACK_COLOR : PLAYER_COLORS[winnerIndex] ?? FALLBACK_COLOR;

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
      <GameOverConfetti />

      <div className="grid gap-3 text-center">
        <CardEyebrow>// containment breached</CardEyebrow>
        <span className="mx-auto border border-line bg-bg-soft px-3 py-1 font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
          {mode ?? "casual"} result
        </span>
        {winner ? <WinnerBadge color={color} /> : null}
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

      <ModeNotice mode={mode} />

      {players && players.length > 0 && scoreDeltas ? (
        <GameOverScoreList players={players} scoreDeltas={scoreDeltas} winnerId={winner?.id} />
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
        className="flex items-center justify-center gap-2 font-body text-xs font-semibold text-fg-muted transition-colors hover:text-cherenkov"
      >
        <Trophy size={12} aria-hidden="true" strokeWidth={2.5} />
        View leaderboard
      </Link>
    </Card>
  );
}

function ModeNotice({ mode }: { mode: GameMode | null }) {
  return (
    <div className="border border-line bg-bg-soft px-4 py-3 text-center font-mono text-xs leading-relaxed text-fg-muted">
      {mode === "ranked"
        ? "Ranked result saved. Leaderboard points update after persistence completes."
        : "Casual result complete. Leaderboard points are unchanged."}
    </div>
  );
}
