"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { GameBoard } from "@/components/GameBoard";
import { GameOver } from "@/components/GameOver";
import { Lobby } from "@/components/Lobby";
import { QueueScreen } from "@/components/QueueScreen";
import { Card, CardCorners, CardEyebrow } from "@/components/ui/card";
import { useGameWebSocket } from "@/hooks/useGameWebSocket";
import { useSounds } from "@/hooks/useSounds";

export default function Home() {
  const game = useGameWebSocket();
  const sounds = useSounds();

  useEffect(() => {
    if (game.phase === "gameover") sounds.play("win");
  }, [game.phase, sounds]);

  useEffect(() => {
    if (game.lastError) sounds.play("error");
  }, [game.lastError, sounds]);

  return (
    <main className="relative z-10 mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-8">
      <BackgroundLattice />
      <TopBar />

      {game.lastError ? (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 border border-p1/50 bg-p1/5 px-4 py-3 text-sm text-p1 [animation:panel-rise_0.4s_ease-out_both]"
        >
          <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span className="font-mono leading-relaxed">{game.lastError.message}</span>
        </div>
      ) : null}

      {game.phase === "lobby" ? (
        <Lobby onSubmit={game.joinQueue} onInteract={() => sounds.play("click")} />
      ) : null}

      {game.phase === "queued" ? (
        <QueueScreen info={game.queuedInfo} onCancel={game.leaveQueue} />
      ) : null}

      {game.phase === "playing" && game.gameState ? (
        <GameBoard
          gameState={game.gameState}
          playerId={game.playerId}
          onMove={game.makeMove}
          onLeaveGame={game.leaveGame}
          onPlace={(intensity) => sounds.play("place", { intensity })}
          onExplode={(intensity) => sounds.play("explode", { intensity })}
          onChain={(intensity) => sounds.play("chain", { intensity })}
          muted={sounds.muted}
          onToggleMute={() => {
            sounds.resume();
            sounds.toggleMute();
          }}
        />
      ) : null}

      {game.phase === "playing" && !game.gameState ? (
        <Card className="mx-auto mt-[10vh] grid w-[min(420px,100%)] gap-4 p-10 text-center [animation:panel-rise_0.5s_ease-out_both]">
          <CardCorners />
          <CardEyebrow>// initializing</CardEyebrow>
          <h1 className="font-display text-3xl uppercase tracking-[0.05em] text-fg">
            Priming Lattice
            <span className="ml-1 inline-block animate-[blink-cursor_1s_steps(1)_infinite] text-cherenkov">
              _
            </span>
          </h1>
        </Card>
      ) : null}

      {game.phase === "gameover" ? (
        <GameOver
          winner={game.winner}
          winnerIndex={game.gameState?.players.findIndex((player) => player.id === game.winner?.id) ?? null}
          onPlayAgain={game.reset}
        />
      ) : null}
    </main>
  );
}

function BackgroundLattice() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-[23vh] h-[460px] w-[820px] -translate-x-1/2 opacity-25 max-lg:hidden"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        maskImage: "radial-gradient(circle at center, black 42%, transparent 80%)"
      }}
    />
  );
}

function TopBar() {
  return (
    <div className="mb-8 flex items-center justify-between gap-4 border-b border-line pb-4">
      <div className="flex items-center gap-3">
        <span className="relative grid h-8 w-8 place-items-center">
          <span className="absolute inset-0 animate-[orb-pulse_2.4s_ease-in-out_infinite] rounded-full bg-reactor opacity-80 shadow-reactor" />
          <span className="relative h-2 w-2 rounded-full bg-bg" />
        </span>
        <div className="grid leading-tight">
          <span className="font-display text-sm uppercase tracking-[0.32em] text-fg">Chain . Reaction</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-fg-muted">
            reactor.console
          </span>
        </div>
      </div>
      <span className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-fg-muted sm:flex">
        <span className="h-px w-12 bg-line" />
        v1.0
      </span>
    </div>
  );
}
