"use client";

import { LogOut, Volume2, VolumeX } from "lucide-react";

interface GameHeaderProps {
  turnColor: string;
  isMyTurn: boolean;
  currentPlayerName?: string;
  muted?: boolean;
  onToggleMute?: () => void;
  onLeaveGame: () => void;
}

// Compact in-game topbar: brand on the left, whose-turn chip in the middle,
// mute and leave actions on the right.
export function GameHeader({
  turnColor,
  isMyTurn,
  currentPlayerName,
  muted,
  onToggleMute,
  onLeaveGame
}: GameHeaderProps) {
  return (
    <header
      className="grid items-center gap-2"
      style={{ gridTemplateColumns: "1fr auto 1fr" }}
    >
      {/* Brand */}
      <div className="flex min-w-0 items-center gap-2">
        <span className="relative grid h-6 w-6 flex-shrink-0 place-items-center">
          <span className="absolute inset-0 animate-[orb-pulse_2.4s_ease-in-out_infinite] rounded-full bg-gradient-to-br from-primary-glow to-primary opacity-90 shadow-[0_2px_8px_rgba(20,60,110,0.4)]" />
          <span className="relative h-1.5 w-1.5 rounded-full bg-white" />
        </span>
        <span className="hidden truncate font-display text-xs tracking-wide text-white sm:block">
          Chain Reaction
        </span>
      </div>

      {/* Turn chip */}
      <div
        className="inline-flex max-w-[55vw] items-center gap-2 rounded-full border-2 px-3 py-1.5 font-display text-xs uppercase tracking-widest text-fg transition-[border-color,box-shadow] duration-300 sm:text-sm"
        style={{
          borderColor: turnColor,
          boxShadow: "0 4px 0 rgba(24,73,128,0.18)",
          background: "rgba(255,255,255,.94)",
        }}
      >
        <span
          className="h-2.5 w-2.5 flex-shrink-0 animate-[orb-pulse_1.2s_ease-in-out_infinite] rounded-full"
          style={{
            background: `radial-gradient(circle at 30% 30%, #fff, ${turnColor} 60%, color-mix(in srgb, ${turnColor} 50%, black))`,
            boxShadow: `0 1px 4px color-mix(in srgb, ${turnColor} 60%, transparent)`,
          }}
        />
        <span
          className="overflow-hidden text-ellipsis whitespace-nowrap"
          style={{ color: isMyTurn ? turnColor : undefined }}
        >
          {isMyTurn ? "YOUR TURN" : (currentPlayerName ?? "…")}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1.5">
        {onToggleMute ? (
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
            className="grid h-8 w-8 place-items-center rounded-xl border-2 border-white/80 bg-surface/90 text-fg-soft transition-colors hover:border-secondary hover:text-secondary-deep"
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onLeaveGame}
          aria-label="Leave game"
          className="grid h-8 w-8 place-items-center rounded-xl border-2 border-white/80 bg-surface/90 text-fg-soft transition-colors hover:border-danger/60 hover:text-danger"
        >
          <LogOut size={14} />
        </button>
      </div>
    </header>
  );
}
