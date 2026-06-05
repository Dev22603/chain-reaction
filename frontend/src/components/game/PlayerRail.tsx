"use client";

import { playerColor } from "@/lib/colors";
import type { Player } from "@/lib/types";

interface PlayerRailProps {
  players: Player[];
  currentTurn: number;
  playerId: string | null;
  orbCounts: number[];
}

export function PlayerRail({ players, currentTurn, playerId, orbCounts }: PlayerRailProps) {
  return (
    <div className="grid gap-1.5">
      <div className="flex flex-wrap gap-1.5 sm:flex-nowrap">
        {players.map((player, index) => (
          <PlayerChip
            key={player.id}
            player={player}
            index={index}
            isActive={currentTurn === index && !player.eliminated}
            isSelf={player.id === playerId}
            orbCount={orbCounts[index] ?? 0}
          />
        ))}
      </div>
    </div>
  );
}

function PlayerChip({
  player,
  index,
  isActive,
  isSelf,
  orbCount
}: {
  player: Player;
  index: number;
  isActive: boolean;
  isSelf: boolean;
  orbCount: number;
}) {
  const color = playerColor(index);
  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border px-2 py-1.5 transition-[border-color,box-shadow,background] duration-200"
      style={{
        borderColor: isActive ? color : `color-mix(in srgb, ${color} 22%, rgba(46,26,111,0.6))`,
        background: isActive
          ? `color-mix(in srgb, ${color} 12%, rgba(20,8,50,.65))`
          : "rgba(20,8,50,.55)",
        boxShadow: isActive ? `0 0 14px color-mix(in srgb, ${color} 28%, transparent)` : undefined,
        opacity: player.eliminated ? 0.35 : 1
      }}
    >
      <span
        className="grid h-4 w-4 flex-shrink-0 place-items-center rounded-full font-display text-[8px]"
        style={{
          background: `radial-gradient(circle at 30% 30%, #fff, ${color} 55%, color-mix(in srgb, ${color} 50%, #000))`,
          boxShadow: `0 0 8px ${color}`,
          color: "rgba(0,0,0,.5)"
        }}
      >
        {player.eliminated ? "✕" : index + 1}
      </span>
      <span
        className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[10px] uppercase tracking-wide"
        style={{ color: isSelf ? "var(--color-fg)" : "var(--color-fg-muted)" }}
      >
        {player.name}
      </span>
      <span className="font-mono text-[10px] tabular-nums text-fg-muted">
        {player.eliminated ? "out" : orbCount}
      </span>
    </div>
  );
}
