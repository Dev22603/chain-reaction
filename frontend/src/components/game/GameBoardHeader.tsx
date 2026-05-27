"use client";

import { LogOut, Volume2, VolumeX } from "lucide-react";

interface GameBoardHeaderProps {
  turnColor: string;
  isMyTurn: boolean;
  currentPlayerName: string | undefined;
  muted?: boolean;
  onToggleMute?: () => void;
  onLeaveGame: () => void;
}

export function GameBoardHeader({
  turnColor,
  isMyTurn,
  currentPlayerName,
  muted,
  onToggleMute,
  onLeaveGame
}: GameBoardHeaderProps) {
  return (
    <header
      className="grid items-center gap-2"
      style={{ gridTemplateColumns: "1fr auto 1fr" }}
    >
      <Brand />
      <TurnChip turnColor={turnColor} isMyTurn={isMyTurn} currentPlayerName={currentPlayerName} />
      <HeaderActions muted={muted} onToggleMute={onToggleMute} onLeaveGame={onLeaveGame} />
    </header>
  );
}

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="relative grid h-6 w-6 flex-shrink-0 place-items-center">
        <span className="absolute inset-0 animate-[orb-pulse_2.4s_ease-in-out_infinite] rounded-full bg-gradient-to-br from-reactor-glow to-reactor opacity-90 shadow-[0_0_16px_rgba(255,107,31,0.55)]" />
        <span className="relative h-1.5 w-1.5 rounded-full bg-white" />
      </span>
      <span className="hidden truncate font-display text-xs tracking-wide text-white/80 sm:block">
        Chain Reaction
      </span>
    </div>
  );
}

function TurnChip({
  turnColor,
  isMyTurn,
  currentPlayerName
}: {
  turnColor: string;
  isMyTurn: boolean;
  currentPlayerName: string | undefined;
}) {
  return (
    <div
      className="inline-flex max-w-[55vw] items-center gap-2 rounded-full border px-3 py-1.5 font-display text-xs uppercase tracking-widest text-white transition-[border-color,box-shadow] duration-300 sm:text-sm"
      style={{
        borderColor: `color-mix(in srgb, ${turnColor} 55%, transparent)`,
        boxShadow: `0 0 16px color-mix(in srgb, ${turnColor} 28%, transparent)`,
        background: "rgba(20,8,50,.72)"
      }}
    >
      <span
        className="h-2.5 w-2.5 flex-shrink-0 animate-[orb-pulse_1.2s_ease-in-out_infinite] rounded-full"
        style={{
          background: `radial-gradient(circle at 30% 30%, #fff, ${turnColor} 60%, color-mix(in srgb, ${turnColor} 50%, black))`,
          boxShadow: `0 0 10px ${turnColor}`
        }}
      />
      <span
        className="overflow-hidden text-ellipsis whitespace-nowrap"
        style={{
          color: isMyTurn ? turnColor : undefined,
          textShadow: isMyTurn ? `0 0 12px ${turnColor}` : undefined
        }}
      >
        {isMyTurn ? "YOUR TURN" : (currentPlayerName ?? "…")}
      </span>
    </div>
  );
}

function HeaderActions({
  muted,
  onToggleMute,
  onLeaveGame
}: {
  muted?: boolean;
  onToggleMute?: () => void;
  onLeaveGame: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      {onToggleMute ? (
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          className="grid h-8 w-8 place-items-center rounded-xl border border-white/8 bg-surface/45 text-fg-muted transition-colors hover:border-white/18 hover:bg-surface-2/55 hover:text-white"
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      ) : null}
      <button
        type="button"
        onClick={onLeaveGame}
        aria-label="Leave game"
        className="grid h-8 w-8 place-items-center rounded-xl border border-white/8 bg-surface/45 text-fg-muted transition-colors hover:border-p1/50 hover:bg-p1/12 hover:text-p1"
      >
        <LogOut size={14} />
      </button>
    </div>
  );
}
