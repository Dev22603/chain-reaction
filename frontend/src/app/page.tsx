"use client";

import { AlertTriangle, LogOut, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GameBoard } from "@/components/GameBoard";
import { GameOver } from "@/components/GameOver";
import { LandingHub } from "@/components/LandingHub";
import { QueueScreen } from "@/components/QueueScreen";
import { Card, CardCorners, CardEyebrow } from "@/components/ui/card";
import { useGameWebSocket } from "@/hooks/useGameWebSocket";
import { useAuth } from "@/hooks/useAuth";
import { useSounds } from "@/hooks/useSounds";
import type { PublicPlayer } from "@/lib/api";

const DEFAULT_GRID = { rows: 6, cols: 9 };

function makeGuestName() {
  if (typeof window === "undefined") return "Operator";
  const stored = window.localStorage.getItem("cr.guest.name");
  if (stored) return stored;
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  const generated = `Operator-${suffix}`;
  window.localStorage.setItem("cr.guest.name", generated);
  return generated;
}

export default function Home() {
  const game = useGameWebSocket();
  const auth = useAuth();
  const sounds = useSounds();
  const [guestName, setGuestName] = useState<string>("Operator");
  const [softNotice, setSoftNotice] = useState<string | null>(null);
  const noticeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setGuestName(makeGuestName());
  }, []);

  useEffect(() => {
    if (game.phase === "gameover") sounds.play("win");
  }, [game.phase, sounds]);

  useEffect(() => {
    if (game.lastError) sounds.play("error");
  }, [game.lastError, sounds]);

  const playerName = auth.player?.displayName?.trim() || guestName;

  function flashNotice(message: string) {
    setSoftNotice(message);
    if (noticeTimeout.current) clearTimeout(noticeTimeout.current);
    noticeTimeout.current = setTimeout(() => setSoftNotice(null), 5200);
  }

  const onPlay = (playerCount: number) => {
    game.joinQueue({
      mode: "casual",
      gridRows: DEFAULT_GRID.rows,
      gridCols: DEFAULT_GRID.cols,
      maxPlayers: playerCount,
      playerName
    });
  };

  const onCreate = (config: { players: number; gridRows: number; gridCols: number }) => {
    game.joinQueue({
      mode: "casual",
      gridRows: config.gridRows,
      gridCols: config.gridCols,
      maxPlayers: config.players,
      playerName
    });
    flashNotice("Room created — others can join the matching bracket. Shareable codes ship next.");
  };

  const onJoin = (code: string) => {
    flashNotice(`Code ${code} captured. Code-based join arrives in the next backend release — use Play to match now.`);
  };

  const errorVisible = Boolean(game.lastError) || Boolean(softNotice);

  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-8 px-4 py-6 sm:px-8 sm:py-8 lg:px-10">
      <AmbientBackdrop />
      <TopBar player={auth.player} onLogout={auth.logout} />

      {errorVisible ? (
        <div className="grid gap-2">
          {game.lastError ? (
            <div
              role="alert"
              className="flex items-start gap-3 border border-p1/50 bg-p1/5 px-4 py-3 text-sm text-p1 [animation:panel-rise_0.4s_ease-out_both]"
            >
              <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
              <span className="font-mono leading-relaxed">{game.lastError.message}</span>
            </div>
          ) : null}
          {softNotice ? (
            <div
              role="status"
              className="flex items-start gap-3 border border-cherenkov/40 bg-cherenkov/5 px-4 py-3 text-sm text-cherenkov [animation:panel-rise_0.4s_ease-out_both]"
            >
              <Sparkles size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
              <span className="font-mono leading-relaxed">{softNotice}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {game.phase === "lobby" ? (
        <LandingHub
          isAuthenticated={auth.isAuthenticated}
          displayName={auth.player?.displayName ?? guestName}
          onInteract={() => sounds.play("click")}
          onPlay={onPlay}
          onCreate={onCreate}
          onJoin={onJoin}
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
          <h1 className="font-display text-4xl font-black uppercase tracking-tight text-fg">
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

function AmbientBackdrop() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60vh] bg-gradient-to-b from-reactor/[0.10] via-transparent to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-15%] top-[20%] -z-10 h-[60vh] w-[60vh] rounded-full bg-cherenkov/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-10%] bottom-[10%] -z-10 h-[45vh] w-[45vh] rounded-full bg-radium/[0.06] blur-3xl"
      />
    </>
  );
}

function TopBar({ player, onLogout }: { player: PublicPlayer | null; onLogout: () => void }) {
  return (
    <header className="grid gap-4 border-b border-line/60 pb-5 lg:flex lg:items-center lg:justify-between">
      <Link href="/" className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-90">
        <span className="relative grid h-9 w-9 place-items-center">
          <span className="absolute inset-0 animate-[orb-pulse_2.4s_ease-in-out_infinite] rounded-full bg-reactor opacity-80 shadow-reactor" />
          <span className="relative h-2 w-2 rounded-full bg-bg" />
        </span>
        <div className="grid min-w-0 leading-tight">
          <span className="truncate font-display text-base font-black uppercase tracking-tight text-fg">
            Chain<span className="text-reactor">.</span>Reaction
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-fg-muted">
            atomic edition
          </span>
        </div>
      </Link>

      <nav className="flex items-center gap-2 overflow-x-auto pb-1 font-mono text-[10px] uppercase tracking-[0.24em] text-fg-muted sm:tracking-[0.3em] lg:pb-0">
        <Link
          href="/leaderboard"
          className="inline-flex min-h-9 shrink-0 items-center gap-2 border border-line bg-surface/60 px-3 hover:border-cherenkov hover:text-cherenkov"
        >
          <Trophy size={12} aria-hidden="true" />
          leaderboard
        </Link>
        {player ? (
          <>
            <span className="inline-flex min-h-9 shrink-0 items-center gap-2 border border-cherenkov/40 bg-cherenkov/5 px-3 text-cherenkov">
              <span className="h-1.5 w-1.5 rounded-full bg-cherenkov shadow-[0_0_8px_rgba(37,211,255,0.7)]" />
              <span className="max-w-[160px] truncate">{player.displayName}</span>
            </span>
            <button
              type="button"
              className="inline-flex min-h-9 shrink-0 items-center gap-2 border border-line bg-surface/60 px-3 hover:border-reactor hover:text-reactor"
              onClick={onLogout}
              aria-label="Sign out"
            >
              <LogOut size={12} aria-hidden="true" />
              <span className="hidden sm:inline">sign out</span>
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="inline-flex min-h-9 shrink-0 items-center gap-2 border border-uranium/40 bg-uranium/10 px-3 text-uranium hover:bg-uranium/15"
          >
            <Sparkles size={12} aria-hidden="true" />
            sign in · +xp
          </Link>
        )}
      </nav>
    </header>
  );
}
