"use client";

import { useEffect, useRef, useState } from "react";
import { GameBoard } from "@/components/GameBoard";
import { GameOver } from "@/components/GameOver";
import { LandingHub } from "@/components/LandingHub";
import { QueueScreen } from "@/components/QueueScreen";
import { Card } from "@/components/ui/card";
import { useGameWebSocket } from "@/hooks/useGameWebSocket";
import { useAuth } from "@/hooks/useAuth";
import type { CreateRoomConfig } from "@/components/dialogs/CreateRoomDialog";
import type { PlayConfig } from "@/components/dialogs/PlayDialog";
import { useSounds } from "@/hooks/useSounds";
import { loadOrCreateGuestName, saveGuestName } from "@/lib/guestName";
import { LobbyNav } from "@/components/LobbyNav";
import { DevCredit } from "@/components/DevCredit";
import { ToastStack } from "@/components/ToastStack";

const CONNECTING_NOTICE = "Still connecting, try again in a moment.";

export default function Home() {
  const game = useGameWebSocket();
  const auth = useAuth();
  const sounds = useSounds();
  const [guestName, setGuestName] = useState<string>("Player");
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

  const onPlay = (config: PlayConfig) => {
    if (game.connectionState !== "open") {
      flashNotice(CONNECTING_NOTICE);
      return;
    }
    game.joinQueue({
      gridRows: config.gridRows,
      gridCols: config.gridCols,
      maxPlayers: config.players,
      playerName
    });
  };

  const onCreateRoom = (config: CreateRoomConfig) => {
    if (game.connectionState !== "open") {
      flashNotice(CONNECTING_NOTICE);
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
      flashNotice(CONNECTING_NOTICE);
      return;
    }
    game.joinRoomByCode(code, playerName);
  };

  // Rematch: re-queue with the same settings derived from the finished game state
  const onRematch = () => {
    if (!game.gameState) return;
    const rows = game.gameState.board.length;
    const cols = game.gameState.board[0]?.length ?? 9;
    const maxPlayers = game.gameState.players.length;
    game.reset();
    game.joinQueue({ gridRows: rows, gridCols: cols, maxPlayers, playerName });
  };
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
      {/* Full-screen game overlay (covers TopBar) */}
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
            <h1 className="font-display text-4xl text-fg">
              Starting game
              <span className="ml-1 inline-block animate-[blink-cursor_1s_steps(1)_infinite] text-secondary">
                …
              </span>
            </h1>
          </Card>
        </div>
      ) : null}

      {/* No-scroll lobby shell */}
      {isLobby ? (
        <div className="fixed inset-0 z-10 grid h-[100svh] w-full grid-rows-[auto_1fr_auto] overflow-hidden px-3 pb-3 pt-3 sm:px-6 sm:pt-4">
          <LobbyNav
            playerName={playerName}
            isAuthenticated={auth.isAuthenticated}
            player={auth.player}
            onSaveName={handleNameSave}
            onLogout={auth.logout}
            onInteract={() => sounds.play("click")}
          />

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

          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <ToastStack
                disconnected={disconnected}
                error={game.lastError}
                notice={softNotice}
                compact={true}
              />
            </div>
            <DevCredit />
          </div>
        </div>
      ) : null}

      {/* Standard scrollable layout (queue / gameover) */}
      {!isLobby && !isPlaying ? (
        <main className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col gap-3 px-4 pb-3 sm:px-8 lg:px-10">
          <ToastStack
            disconnected={disconnected}
            error={game.lastError}
            notice={softNotice}
            compact={false}
          />

          {game.phase === "queued" ? (
            <QueueScreen info={game.queuedInfo} code={game.roomCode} onCancel={game.leaveQueue} />
          ) : null}

          {game.phase === "gameover" ? (
            <GameOver
              winner={game.winner}
              winnerIndex={game.gameState?.players.findIndex((p) => p.id === game.winner?.id) ?? null}
              players={game.gameState?.players ?? null}
              xpDeltas={game.xpDeltas}
              isAuthenticated={auth.isAuthenticated}
              onPlayAgain={game.reset}
              onRematch={onRematch}
            />
          ) : null}
        </main>
      ) : null}
    </>
  );
}
