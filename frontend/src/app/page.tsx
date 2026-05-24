"use client";

import { AlertTriangle, Sparkles, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GameBoard } from "@/components/GameBoard";
import { GameOver } from "@/components/GameOver";
import { LandingHub } from "@/components/LandingHub";
import { QueueScreen } from "@/components/QueueScreen";
import { Card, CardCorners } from "@/components/ui/card";
import { useGameWebSocket } from "@/hooks/useGameWebSocket";
import { useAuth } from "@/hooks/useAuth";
import type { CreateRoomConfig } from "@/components/dialogs/CreateRoomDialog";
import { useSounds } from "@/hooks/useSounds";

const DEFAULT_GRID = { rows: 6, cols: 9 };

function makeGuestName() {
  if (typeof window === "undefined") return "Player";
  const stored = window.localStorage.getItem("cr.guest.name");
  if (stored) return stored;
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  const generated = `Player-${suffix}`;
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

  return (
    <>
      {/* ── Full-screen game overlay (covers TopBar) ── */}
      {isPlaying && game.gameState ? (
        <div className="fixed inset-0 z-50 bg-bg">
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
        <div className="fixed inset-0 z-50 grid place-items-center bg-bg">
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

      {/* ── Standard scrollable layout (lobby / queue / gameover) ── */}
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

        {game.phase === "lobby" ? (
          <LandingHub
            isAuthenticated={auth.isAuthenticated}
            displayName={auth.player?.displayName ?? guestName}
            connectionReady={game.connectionState === "open"}
            onInteract={() => sounds.play("click")}
            onPlay={onPlay}
            onCreateRoom={onCreateRoom}
            onJoinRoom={onJoinRoom}
          />
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
    </>
  );
}
