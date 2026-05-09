"use client";

import { AlertTriangle, LogOut, Trophy, UserPlus } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { GameBoard } from "@/components/GameBoard";
import { GameOver } from "@/components/GameOver";
import { Lobby } from "@/components/Lobby";
import { QueueScreen } from "@/components/QueueScreen";
import { Card, CardCorners, CardEyebrow } from "@/components/ui/card";
import { useGameWebSocket } from "@/hooks/useGameWebSocket";
import { useAuth } from "@/hooks/useAuth";
import { useSounds } from "@/hooks/useSounds";
import type { PublicPlayer } from "@/lib/api";

export default function Home() {
  const game = useGameWebSocket();
  const auth = useAuth();
  const sounds = useSounds();

  useEffect(() => {
    if (game.phase === "gameover") sounds.play("win");
  }, [game.phase, sounds]);

  useEffect(() => {
    if (game.lastError) sounds.play("error");
  }, [game.lastError, sounds]);

  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1220px] flex-col px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <BackgroundLattice />
      <TopBar player={auth.player} onLogout={auth.logout} />

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
        <Lobby
          onSubmit={game.joinQueue}
          onInteract={() => sounds.play("click")}
          isAuthenticated={auth.isAuthenticated}
          defaultPlayerName={auth.player?.displayName}
        />
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
          mode={game.gameMode}
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

function TopBar({ player, onLogout }: { player: PublicPlayer | null; onLogout: () => void }) {
  return (
    <div className="mb-5 grid gap-4 border-b border-line pb-4 sm:mb-8 lg:flex lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className="relative grid h-8 w-8 place-items-center">
          <span className="absolute inset-0 animate-[orb-pulse_2.4s_ease-in-out_infinite] rounded-full bg-reactor opacity-80 shadow-reactor" />
          <span className="relative h-2 w-2 rounded-full bg-bg" />
        </span>
        <div className="grid min-w-0 leading-tight">
          <span className="truncate font-display text-sm uppercase tracking-[0.24em] text-fg sm:tracking-[0.32em]">
            Chain . Reaction
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-fg-muted">
            reactor.console
          </span>
        </div>
      </div>
      {player ? (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-fg-muted sm:gap-3 sm:tracking-[0.24em] lg:pb-0">
          <Link href="/leaderboard" className="inline-flex min-h-9 shrink-0 items-center gap-2 border border-line bg-surface/60 px-3 text-fg-soft hover:border-cherenkov hover:text-cherenkov">
            <Trophy size={13} aria-hidden="true" />
            leaderboard
          </Link>
          <span className="min-h-9 max-w-[52vw] shrink-0 truncate border border-line bg-bg-soft px-3 py-2 text-cherenkov sm:max-w-[180px]">
            {player.displayName}
          </span>
          <button type="button" className="inline-flex min-h-9 shrink-0 items-center gap-2 border border-line bg-surface/60 px-3 hover:text-fg" onClick={onLogout}>
            <LogOut size={13} aria-hidden="true" />
            logout
          </button>
        </div>
      ) : (
        <span className="flex items-center gap-2 overflow-x-auto pb-1 font-mono text-[10px] uppercase tracking-[0.22em] text-fg-muted sm:tracking-[0.3em] lg:pb-0">
          <Link href="/login" className="inline-flex min-h-9 shrink-0 items-center border border-line bg-surface/60 px-3 hover:border-cherenkov hover:text-cherenkov">
            login
          </Link>
          <Link href="/signup" className="inline-flex min-h-9 shrink-0 items-center gap-2 border border-line bg-surface/60 px-3 hover:border-cherenkov hover:text-cherenkov">
            <UserPlus size={13} aria-hidden="true" />
            signup
          </Link>
          <Link href="/leaderboard" className="inline-flex min-h-9 shrink-0 items-center gap-2 border border-line bg-surface/60 px-3 hover:border-cherenkov hover:text-cherenkov">
            <Trophy size={13} aria-hidden="true" />
            leaderboard
          </Link>
        </span>
      )}
    </div>
  );
}
