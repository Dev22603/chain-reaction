"use client";

import { AlertTriangle, LogOut, Sparkles, Trophy, WifiOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GameBoard } from "@/components/GameBoard";
import { GameOver } from "@/components/GameOver";
import { LandingHub } from "@/components/LandingHub";
import { NameCard } from "@/components/NameCard";
import { QueueScreen } from "@/components/QueueScreen";
import { Card, CardCorners } from "@/components/ui/card";
import { useGameWebSocket } from "@/hooks/useGameWebSocket";
import { useAuth } from "@/hooks/useAuth";
import type { CreateRoomConfig } from "@/components/dialogs/CreateRoomDialog";
import { useSounds } from "@/hooks/useSounds";
import { loadOrCreateGuestName, saveGuestName } from "@/lib/guestName";

const DEFAULT_GRID = { rows: 6, cols: 9 };

export default function Home() {
  const game = useGameWebSocket();
  const auth = useAuth();
  const sounds = useSounds();
  const [guestName, setGuestName] = useState<string>("Operator");
  const [softNotice, setSoftNotice] = useState<string | null>(null);
  const noticeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setGuestName(loadOrCreateGuestName());
  }, []);

  useEffect(() => {
    if (game.phase === "gameover") sounds.play("win");
  }, [game.phase, sounds]);

  useEffect(() => {
    if (game.lastError) sounds.play("error");
  }, [game.lastError, sounds]);

  useEffect(() => {
    return () => {
      if (noticeTimeout.current) clearTimeout(noticeTimeout.current);
    };
  }, []);

  const playerName = auth.player?.displayName?.trim() || guestName;

  function flashNotice(message: string) {
    setSoftNotice(message);
    if (noticeTimeout.current) clearTimeout(noticeTimeout.current);
    noticeTimeout.current = setTimeout(() => setSoftNotice(null), 5200);
  }

  const onPlay = (playerCount: number) => {
    if (game.connectionState !== "open") {
      flashNotice("Connecting to the reactor… try again in a moment.");
      return;
    }
    game.joinQueue({
      mode: "casual",
      gridRows: DEFAULT_GRID.rows,
      gridCols: DEFAULT_GRID.cols,
      maxPlayers: playerCount,
      playerName
    });
  };

  const onCreateRoom = (config: CreateRoomConfig) => {
    if (game.connectionState !== "open") {
      flashNotice("Connecting to the reactor… try again in a moment.");
      return;
    }
    game.createRoom({
      playerName,
      gridRows: config.gridRows,
      gridCols: config.gridCols,
      maxPlayers: config.players
    });
  };

  const onJoinRoom = (code: string) => {
    if (game.connectionState !== "open") {
      flashNotice("Connecting to the reactor… try again in a moment.");
      return;
    }
    game.joinRoomByCode(code, playerName);
  };

  // Rematch: re-queue with the same settings derived from the finished game state
  const onRematch = () => {
    if (!game.gameState) return;
    const rows = game.gameState.board.length;
    const cols = game.gameState.board[0]?.length ?? DEFAULT_GRID.cols;
    const maxPlayers = game.gameState.players.length;
    const mode = game.gameMode ?? "casual";
    game.reset();
    game.joinQueue({ mode, gridRows: rows, gridCols: cols, maxPlayers, playerName });
  };

  const errorVisible = Boolean(game.lastError) || Boolean(softNotice);
  const disconnected = game.connectionState !== "open" && game.connectionState !== "connecting";

  const isPlaying = game.phase === "playing";
  const isLobby = game.phase === "lobby";

  async function handleNameSave(newName: string) {
    if (auth.isAuthenticated) {
      await auth.updateDisplayName(newName);
    } else {
      saveGuestName(newName);
      setGuestName(newName);
    }
  }

  return (
    <>
      {/* ── Full-screen game overlay (covers TopBar) ── */}
      {isPlaying && game.gameState ? (
        <div className="fixed inset-0 z-50 bg-surface">
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
            roomCode={game.roomCode}
          />
        </div>
      ) : null}

      {isPlaying && !game.gameState ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-surface">
          <Card className="grid w-[min(420px,90vw)] gap-4 p-10 text-center [animation:panel-rise_0.5s_ease-out_both]">
            <CardCorners />
            <h1 className="font-display text-4xl tracking-tight text-fg">
              Starting game
              <span className="ml-1 inline-block animate-[blink-cursor_1s_steps(1)_infinite] text-cherenkov">
                _
              </span>
            </h1>
          </Card>
        </div>
      ) : null}

      {/* ── No-scroll lobby shell ── */}
      {isLobby ? (
        <div className="fixed inset-0 z-10 grid h-[100svh] w-full grid-rows-[auto_1fr_auto] overflow-hidden px-3 pb-3 pt-3 sm:px-6 sm:pt-4">
          {/* Top rail: name (left) + leaderboard/auth (right) */}
          <div className="flex items-start justify-between gap-3">
            <NameCard
              displayName={playerName}
              canEdit={auth.isAuthenticated}
              onSave={handleNameSave}
              onInteract={() => sounds.play("click")}
            />

            <nav className="flex items-center gap-2">
              <Link
                href="/leaderboard"
                onClick={() => sounds.play("click")}
                className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-cherenkov/50 bg-surface px-3.5 font-body text-sm font-semibold text-cherenkov transition-colors hover:border-cherenkov hover:bg-cherenkov/10"
              >
                <Trophy size={14} strokeWidth={2.5} aria-hidden="true" />
                <span className="hidden sm:inline">Leaderboard</span>
              </Link>
              {auth.isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Sign out? You'll leave any active queue or game.")) {
                      auth.logout();
                    }
                  }}
                  aria-label="Sign out"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-line bg-surface text-fg-soft transition-colors hover:border-reactor hover:text-reactor"
                >
                  <LogOut size={14} aria-hidden="true" />
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => sounds.play("click")}
                  className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-reactor/50 bg-surface px-3.5 font-body text-sm font-semibold text-reactor transition-colors hover:border-reactor hover:bg-reactor/10"
                >
                  <Sparkles size={14} strokeWidth={2.5} aria-hidden="true" />
                  Sign in
                </Link>
              )}
            </nav>
          </div>

          {/* Centered hero */}
          <div className="relative grid place-items-center overflow-hidden">
            <LandingHub
              connectionReady={game.connectionState === "open"}
              onInteract={() => sounds.play("click")}
              onPlay={onPlay}
              onCreateRoom={onCreateRoom}
              onJoinRoom={onJoinRoom}
            />
          </div>

          {/* Bottom: connection / error toasts */}
          <div className="grid gap-2">
            {disconnected ? (
              <div
                role="status"
                className="flex items-start gap-3 border border-p1/50 bg-p1/5 px-4 py-2 text-xs text-p1"
              >
                <WifiOff size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
                <span className="font-mono leading-relaxed">
                  Reactor offline — reconnecting. Gameplay paused until the link is back.
                </span>
              </div>
            ) : null}
            {game.lastError ? (
              <div
                role="alert"
                className="flex items-start gap-3 border border-p1/50 bg-p1/5 px-4 py-2 text-xs text-p1 [animation:panel-rise_0.4s_ease-out_both]"
              >
                <AlertTriangle size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
                <span className="font-mono leading-relaxed">{game.lastError.message}</span>
              </div>
            ) : null}
            {softNotice ? (
              <div
                role="status"
                className="flex items-start gap-3 border border-cherenkov/40 bg-cherenkov/5 px-4 py-2 text-xs text-cherenkov [animation:panel-rise_0.4s_ease-out_both]"
              >
                <Sparkles size={12} aria-hidden="true" className="mt-0.5 shrink-0" />
                <span className="font-mono leading-relaxed">{softNotice}</span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ── Standard scrollable layout (queue / gameover) ── */}
      {!isLobby && !isPlaying ? (
        <main className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col gap-3 px-4 pb-3 sm:px-8 lg:px-10">
          {disconnected ? (
            <div
              role="status"
              className="flex items-start gap-3 border border-p1/50 bg-p1/5 px-4 py-3 text-sm text-p1"
            >
              <WifiOff size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
              <span className="font-mono leading-relaxed">
                Reactor offline — reconnecting to the backend. Gameplay paused until the link is back.
              </span>
            </div>
          ) : null}

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

          {game.phase === "queued" ? (
            <QueueScreen info={game.queuedInfo} code={game.roomCode} onCancel={game.leaveQueue} />
          ) : null}

          {game.phase === "gameover" ? (
            <GameOver
              winner={game.winner}
              mode={game.gameMode}
              winnerIndex={game.gameState?.players.findIndex((p) => p.id === game.winner?.id) ?? null}
              players={game.gameState?.players ?? null}
              scoreDeltas={game.scoreDeltas}
              onPlayAgain={game.reset}
              onRematch={onRematch}
            />
          ) : null}
        </main>
      ) : null}
    </>
  );
}
