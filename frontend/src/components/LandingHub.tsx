"use client";

import { Play, Users, LogIn } from "lucide-react";
import { useCallback, useState } from "react";
import { GameLogo } from "@/components/GameLogo";
import { CreateRoomDialog } from "@/components/dialogs/CreateRoomDialog";
import { JoinRoomDialog } from "@/components/dialogs/JoinRoomDialog";
import { PlayDialog } from "@/components/dialogs/PlayDialog";
import type { CreateRoomConfig } from "@/components/dialogs/CreateRoomDialog";
import type { PlayConfig } from "@/components/dialogs/PlayDialog";

interface LandingHubProps {
  connectionReady: boolean;
  onPlay: (config: PlayConfig) => void;
  onCreateRoom: (config: CreateRoomConfig) => void;
  onJoinRoom: (code: string) => void;
  onInteract?: () => void;
}

export function LandingHub({
  connectionReady,
  onPlay,
  onCreateRoom,
  onJoinRoom,
  onInteract
}: LandingHubProps) {
  const [playOpen, setPlayOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const handlePlayConfirm = useCallback(
    (config: PlayConfig) => {
      setPlayOpen(false);
      onPlay(config);
    },
    [onPlay]
  );

  const handleCreateConfirm = useCallback(
    (config: CreateRoomConfig) => {
      setCreateOpen(false);
      onCreateRoom(config);
    },
    [onCreateRoom]
  );

  const handleJoinConfirm = useCallback(
    (code: string) => {
      setJoinOpen(false);
      onJoinRoom(code);
    },
    [onJoinRoom]
  );

  return (
    <div className="relative mx-auto grid w-full max-w-[820px] place-items-center gap-6 [animation:panel-rise_0.6s_cubic-bezier(0.2,0.8,0.4,1)_both]">
      <GameLogo />

      <div className="grid w-full max-w-[420px] gap-3">
        <button
          type="button"
          onClick={() => {
            onInteract?.();
            setPlayOpen(true);
          }}
          disabled={!connectionReady}
          aria-disabled={!connectionReady}
          className="game-btn-shadow group relative grid w-full grid-flow-col items-center justify-center gap-3 rounded-3xl border-[3px] border-white/90 bg-gradient-to-b from-primary-glow to-primary px-8 py-4 font-display text-3xl tracking-wide text-white [--btn-depth:var(--color-primary-deep)] disabled:cursor-not-allowed disabled:opacity-60 sm:py-5 sm:text-4xl [animation:button-bounce-in_0.5s_cubic-bezier(0.2,0.8,0.4,1)_0.15s_both]"
        >
          <Play size={28} strokeWidth={3} fill="currentColor" aria-hidden="true" />
          <span className="game-text-shadow">{connectionReady ? "PLAY" : "CONNECTING…"}</span>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              onInteract?.();
              setCreateOpen(true);
            }}
            className="btn-secondary game-btn-shadow px-4 py-2.5 text-base tracking-wide sm:text-lg"
          >
            <Users size={16} strokeWidth={2.5} aria-hidden="true" />
            <span>Create</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onInteract?.();
              setJoinOpen(true);
            }}
            className="btn-secondary game-btn-shadow px-4 py-2.5 text-base tracking-wide sm:text-lg"
          >
            <LogIn size={16} strokeWidth={2.5} aria-hidden="true" />
            <span>Join</span>
          </button>
        </div>
      </div>

      <PlayDialog
        open={playOpen}
        onClose={() => setPlayOpen(false)}
        onConfirm={handlePlayConfirm}
        onInteract={onInteract}
      />

      <CreateRoomDialog
        open={createOpen}
        defaultPlayers={2}
        onClose={() => setCreateOpen(false)}
        onConfirm={handleCreateConfirm}
        onInteract={onInteract}
      />

      <JoinRoomDialog
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        onConfirm={handleJoinConfirm}
        onInteract={onInteract}
      />
    </div>
  );
}
