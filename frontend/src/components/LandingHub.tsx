"use client";

import { Play, Users, LogIn } from "lucide-react";
import { useCallback, useState } from "react";
import { AtomicHero } from "@/components/AtomicHero";
import { CreateRoomDialog } from "@/components/dialogs/CreateRoomDialog";
import { JoinRoomDialog } from "@/components/dialogs/JoinRoomDialog";
import type { CreateRoomConfig } from "@/components/dialogs/CreateRoomDialog";
import { playerColor } from "@/lib/colors";

const PLAYER_OPTIONS = [2, 3, 4, 5, 6, 7, 8] as const;

interface LandingHubProps {
  connectionReady: boolean;
  onPlay: (playerCount: number) => void;
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
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const handlePlay = useCallback(() => {
    onInteract?.();
    onPlay(playerCount);
  }, [onInteract, onPlay, playerCount]);

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
    <div className="relative mx-auto grid w-full max-w-[820px] place-items-center gap-2 [animation:panel-rise_0.6s_cubic-bezier(0.2,0.8,0.4,1)_both]">
      <AtomicHero className="relative h-[72px] w-[140px] sm:h-[88px] sm:w-[170px]" />

      <div className="grid gap-1 text-center">
        <h1
          className="font-display text-[clamp(1.9rem,5vw,4.25rem)] leading-none tracking-tight text-fg whitespace-nowrap [animation:hero-drop_0.7s_cubic-bezier(0.2,0.8,0.4,1)_both]"
          aria-label="Chain Reaction"
        >
          CHAIN{" "}
          <span className="bg-gradient-to-b from-cherenkov via-reactor to-p1 bg-clip-text text-transparent">
            REACTION
          </span>
        </h1>
        <p className="font-body text-sm font-semibold text-fg-soft sm:text-base">
          Pop. Bounce. Take over the board.
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-[460px] gap-1.5">
        <p className="text-center font-display text-[11px] tracking-[0.2em] text-fg-muted sm:text-xs">
          HOW MANY PLAYERS?
        </p>
        <div
          className="grid grid-cols-7 gap-1.5 sm:gap-2"
          role="radiogroup"
          aria-label="Number of players"
        >
          {PLAYER_OPTIONS.map((count) => {
            const active = playerCount === count;
            const chipColor = playerColor(count - 2);
            return (
              <button
                key={count}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={`${count} players`}
                onClick={() => {
                  onInteract?.();
                  setPlayerCount(count);
                }}
                className={
                  "group relative grid aspect-square place-items-center overflow-hidden rounded-xl border-2 font-display text-xl sm:text-2xl transition-transform duration-150 active:scale-95 " +
                  (active
                    ? "scale-105 text-white"
                    : "text-fg-soft hover:scale-105 hover:text-fg")
                }
                style={
                  active
                    ? {
                        background: `linear-gradient(180deg, color-mix(in srgb, ${chipColor} 70%, white), ${chipColor})`,
                        borderColor: `color-mix(in srgb, ${chipColor} 80%, #0a0420)`
                      }
                    : {
                        background: "var(--color-surface)",
                        borderColor: "var(--color-line)"
                      }
                }
              >
                {count}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid w-full max-w-[460px] gap-2">
        <button
          type="button"
          onClick={handlePlay}
          disabled={!connectionReady}
          aria-disabled={!connectionReady}
          className="group relative grid w-full grid-flow-col items-center justify-center gap-3 rounded-3xl border-2 border-reactor bg-gradient-to-b from-reactor-glow to-reactor px-8 py-3 font-display text-2xl tracking-wide text-white transition-[transform,filter,opacity] hover:brightness-105 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 sm:py-4 sm:text-3xl [animation:button-bounce-in_0.5s_cubic-bezier(0.2,0.8,0.4,1)_0.15s_both]"
        >
          <Play
            size={24}
            strokeWidth={3}
            fill="currentColor"
            aria-hidden="true"
          />
          <span>{connectionReady ? "PLAY" : "CONNECTING…"}</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              onInteract?.();
              setCreateOpen(true);
            }}
            className="group relative grid place-items-center gap-1 rounded-2xl border-2 border-line bg-surface px-4 py-2 font-display text-base tracking-wide text-fg transition-colors hover:border-reactor hover:text-reactor sm:text-lg"
          >
            <Users size={16} strokeWidth={2.5} aria-hidden="true" />
            <span>CREATE</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onInteract?.();
              setJoinOpen(true);
            }}
            className="group relative grid place-items-center gap-1 rounded-2xl border-2 border-line bg-surface px-4 py-2 font-display text-base tracking-wide text-fg transition-colors hover:border-cherenkov hover:text-cherenkov sm:text-lg"
          >
            <LogIn size={16} strokeWidth={2.5} aria-hidden="true" />
            <span>JOIN</span>
          </button>
        </div>
      </div>

      <CreateRoomDialog
        open={createOpen}
        defaultPlayers={playerCount}
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
