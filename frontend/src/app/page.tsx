"use client";

import { useEffect, useState } from "react";
import type { CreateRoomConfig } from "@/components/dialogs/CreateRoomDialog";
import { GameBoard } from "@/components/GameBoard";
import { GameOver } from "@/components/GameOver";
import { LandingHub } from "@/components/LandingHub";
import { LobbyNav } from "@/components/LobbyNav";
import { QueueScreen } from "@/components/QueueScreen";
import { StartingGameSplash } from "@/components/StartingGameSplash";
import { ToastStack } from "@/components/ToastStack";
import { useAuth } from "@/hooks/useAuth";
import { useFlashNotice } from "@/hooks/useFlashNotice";
import { useGameWebSocket } from "@/hooks/useGameWebSocket";
import { useSounds } from "@/hooks/useSounds";
import { CONNECTING_NOTICE, DEFAULT_GRID } from "@/lib/constants";
import { loadOrCreateGuestName, saveGuestName } from "@/lib/guestName";

export default function Home() {
  const game = useGameWebSocket();
  const auth = useAuth();
  const sounds = useSounds();
  const { notice, flash } = useFlashNotice();
  const [guestName, setGuestName] = useState<string>("Operator");

  useEffect(() => {
    setGuestName(loadOrCreateGuestName());
  }, []);

  useEffect(() => {
    if (game.phase === "gameover") sounds.play("win");
  }, [game.phase, sounds]);

  useEffect(() => {
    if (game.lastError) sounds.play("error");
  }, [game.lastError, sounds]);

  const playerName = auth.player?.displayName?.trim() || guestName;
  const isConnected = game.connectionState === "open";
  const disconnected = !isConnected && game.connectionState !== "connecting";
  const isPlaying = game.phase === "playing";
  const isLobby = game.phase === "lobby";

  function whenConnected(action: () => void) {
    if (!isConnected) {
      flash(CONNECTING_NOTICE);
      return;
    }
    action();
  }

  const onPlay = (playerCount: number) =>
    whenConnected(() =>
      game.joinQueue({
        mode: "casual",
        gridRows: DEFAULT_GRID.rows,
        gridCols: DEFAULT_GRID.cols,
        maxPlayers: playerCount,
        playerName
      })
    );

  const onCreateRoom = (config: CreateRoomConfig) =>
    whenConnected(() =>
      game.createRoom({
        playerName,
        gridRows: config.gridRows,
        gridCols: config.gridCols,
        maxPlayers: config.players
      })
    );

  const onJoinRoom = (code: string) =>
    whenConnected(() => game.joinRoomByCode(code, playerName));

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

  async function handleNameSave(newName: string) {
    if (auth.isAuthenticated) {
      await auth.updateDisplayName(newName);
    } else {
      saveGuestName(newName);
      setGuestName(newName);
    }
  }

  if (isPlaying && game.gameState) {
    return (
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
    );
  }

  if (isPlaying) {
    return <StartingGameSplash />;
  }

  if (isLobby) {
    return (
      <div className="fixed inset-0 z-10 grid h-[100svh] w-full grid-rows-[auto_1fr_auto] overflow-hidden px-3 pb-3 pt-3 sm:px-6 sm:pt-4">
        <LobbyNav
          playerName={playerName}
          isAuthenticated={auth.isAuthenticated}
          onSaveName={handleNameSave}
          onLogout={auth.logout}
          onInteract={() => sounds.play("click")}
        />

        <div className="relative grid place-items-center overflow-hidden">
          <LandingHub
            connectionReady={isConnected}
            onInteract={() => sounds.play("click")}
            onPlay={onPlay}
            onCreateRoom={onCreateRoom}
            onJoinRoom={onJoinRoom}
          />
        </div>

        <ToastStack disconnected={disconnected} error={game.lastError} notice={notice} compact />
      </div>
    );
  }

  return (
    <main className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col gap-3 px-4 pb-3 sm:px-8 lg:px-10">
      <ToastStack disconnected={disconnected} error={game.lastError} notice={notice} />

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
  );
}
