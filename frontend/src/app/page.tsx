"use client";

import { useEffect, useRef, useState } from "react";
import { GameBoard } from "@/components/GameBoard";
import { GameOver } from "@/components/GameOver";
import { LandingHub } from "@/components/LandingHub";
import { LobbyFooter } from "@/components/LobbyFooter";
import { LobbyNav } from "@/components/LobbyNav";
import { LobbySidebar } from "@/components/LobbySidebar";
import { QueueScreen } from "@/components/QueueScreen";
import { ToastStack } from "@/components/ToastStack";
import { Card } from "@/components/ui/card";
import { AuthDialog } from "@/components/dialogs/AuthDialog";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { CreateRoomDialog } from "@/components/dialogs/CreateRoomDialog";
import { JoinRoomDialog } from "@/components/dialogs/JoinRoomDialog";
import { PlayDialog } from "@/components/dialogs/PlayDialog";
import type { MatchConfig } from "@/components/dialogs/MatchDialogParts";
import { useAuth } from "@/hooks/useAuth";
import { useGameWebSocket } from "@/hooks/useGameWebSocket";
import { useSounds } from "@/hooks/useSounds";
import { loadOrCreateGuestName, saveGuestName } from "@/lib/guestName";

const CONNECTING_NOTICE = "Still connecting, try again in a moment.";

/** Which lobby dialog is open; at most one shows at a time. */
type LobbyDialog = "auth" | "signOut" | "play" | "create" | "join";

export default function Home() {
  const game = useGameWebSocket();
  const auth = useAuth();
  const sounds = useSounds();
  const [guestName, setGuestName] = useState<string>("Player");
  const [softNotice, setSoftNotice] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<LobbyDialog | null>(null);
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
  const disconnected = game.connectionState !== "open" && game.connectionState !== "connecting";
  const isPlaying = game.phase === "playing";
  const isLobby = game.phase === "lobby";

  const playClick = () => sounds.play("click");
  const closeDialog = () => setOpenDialog(null);

  const toggleMute = () => {
    sounds.resume();
    sounds.toggleMute();
  };

  function flashNotice(message: string) {
    setSoftNotice(message);
    if (noticeTimeout.current) clearTimeout(noticeTimeout.current);
    noticeTimeout.current = setTimeout(() => setSoftNotice(null), 5200);
  }

  /** Lobby actions need an open socket; when it isn't, show a soft notice. */
  function ensureConnected(): boolean {
    if (game.connectionState === "open") return true;
    flashNotice(CONNECTING_NOTICE);
    return false;
  }

  const onPlay = (config: MatchConfig) => {
    closeDialog();
    if (!ensureConnected()) return;
    game.joinQueue({
      gridRows: config.gridRows,
      gridCols: config.gridCols,
      maxPlayers: config.players,
      playerName
    });
  };

  const onCreateRoom = (config: MatchConfig) => {
    closeDialog();
    if (!ensureConnected()) return;
    game.createRoom({
      playerName,
      gridRows: config.gridRows,
      gridCols: config.gridCols,
      maxPlayers: config.players
    });
  };

  const onJoinRoom = (code: string) => {
    closeDialog();
    if (!ensureConnected()) return;
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

  async function handleNameSave(newName: string) {
    if (auth.isAuthenticated) {
      await auth.updateDisplayName(newName);
    } else {
      saveGuestName(newName);
      setGuestName(newName);
    }
  }

  const openSignIn = () => {
    playClick();
    setOpenDialog("auth");
  };

  const requestSignOut = () => {
    playClick();
    setOpenDialog("signOut");
  };

  // The socket only carries the JWT during the handshake, so identity changes
  // without a navigation must reconnect it.
  const handleAuthSuccess = () => {
    void auth.refresh();
    game.reconnect();
  };

  const confirmSignOut = () => {
    closeDialog();
    auth.logout();
    game.reconnect();
  };

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
            onToggleMute={toggleMute}
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
        <div className="fixed inset-0 z-10 grid h-[100svh] w-full grid-rows-[auto_1fr_auto] gap-3 overflow-hidden px-3 pb-3 pt-3 sm:px-6 sm:pt-4">
          <LobbyNav
            playerName={playerName}
            isAuthenticated={auth.isAuthenticated}
            player={auth.player}
            onSaveName={handleNameSave}
            onSignIn={openSignIn}
            onRequestSignOut={requestSignOut}
            onInteract={playClick}
          />

          {/* Middle row: sidebar panels on the left (desktop only), hero
              centered relative to the viewport like the ref. */}
          <div className="relative min-h-0">
            <LobbySidebar
              className="absolute inset-y-0 left-0 z-20 hidden lg:flex"
              playerName={playerName}
              isAuthenticated={auth.isAuthenticated}
              player={auth.player}
              onSaveName={handleNameSave}
              onSignIn={openSignIn}
              onRequestSignOut={requestSignOut}
              onInteract={playClick}
            />
            <div className="grid h-full place-items-center overflow-hidden">
              <LandingHub
                connectionReady={game.connectionState === "open"}
                onInteract={playClick}
                onPlayClick={() => setOpenDialog("play")}
                onCreateClick={() => setOpenDialog("create")}
                onJoinClick={() => setOpenDialog("join")}
              />
            </div>
          </div>

          <LobbyFooter
            disconnected={disconnected}
            error={game.lastError}
            notice={softNotice}
            muted={sounds.muted}
            onToggleMute={toggleMute}
          />
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

      <AuthDialog
        open={openDialog === "auth"}
        onClose={closeDialog}
        onSuccess={handleAuthSuccess}
        onInteract={playClick}
      />

      <ConfirmDialog
        open={openDialog === "signOut"}
        title="Confirm Sign Out"
        message="Are you sure you wish to sign out of this account?"
        onConfirm={confirmSignOut}
        onCancel={closeDialog}
      />

      <PlayDialog
        open={openDialog === "play"}
        onClose={closeDialog}
        onConfirm={onPlay}
        onInteract={playClick}
      />

      <CreateRoomDialog
        open={openDialog === "create"}
        defaultPlayers={2}
        onClose={closeDialog}
        onConfirm={onCreateRoom}
        onInteract={playClick}
      />

      <JoinRoomDialog
        open={openDialog === "join"}
        onClose={closeDialog}
        onConfirm={onJoinRoom}
        onInteract={playClick}
      />
    </>
  );
}
