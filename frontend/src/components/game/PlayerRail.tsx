"use client";

import { playerColor } from "@/lib/colors";
import type { Player } from "@/lib/types";

interface PlayerRailProps {
  players: Player[];
  currentTurn: number;
  playerId: string | null;
  orbCounts: number[];
}

// Left rail listing every seat: the active player is highlighted, orb totals
// sit on the right, eliminated players are dimmed.
export function PlayerRail({ players, currentTurn, playerId, orbCounts }: PlayerRailProps) {
  return (
    <aside className="flex w-[clamp(108px,16vw,200px)] shrink-0 flex-col gap-1.5 overflow-y-auto py-1">
      {players.map((player, i) => {
        const color = playerColor(i);
        const isActive = currentTurn === i && !player.eliminated;
        const isSelf = player.id === playerId;
        return (
          <div
            key={player.id}
            className="flex w-full items-center gap-1.5 rounded-lg border-2 px-2 py-1.5 transition-[border-color,box-shadow,background] duration-200"
            style={{
              borderColor: isActive ? color : "rgba(255,255,255,0.55)",
              background: isActive
                ? `color-mix(in srgb, ${color} 10%, rgba(255,255,255,.95))`
                : "rgba(255,255,255,.82)",
              boxShadow: isActive ? "0 4px 0 rgba(24,73,128,0.16)" : undefined,
              opacity: player.eliminated ? 0.45 : 1,
            }}
          >
            <span
              className="grid h-4 w-4 flex-shrink-0 place-items-center rounded-full font-display text-[8px]"
              style={{
                background: `radial-gradient(circle at 30% 30%, #fff, ${color} 55%, color-mix(in srgb, ${color} 50%, #000))`,
                boxShadow: `0 1px 4px color-mix(in srgb, ${color} 60%, transparent)`,
                color: "rgba(255,255,255,.9)",
              }}
            >
              {player.eliminated ? "✕" : i + 1}
            </span>
            <span
              className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-bold"
              style={{ color: isSelf ? "var(--color-fg)" : "var(--color-fg-soft)" }}
            >
              {player.name}
            </span>
            <span className="text-[10px] font-bold tabular-nums text-fg-muted">
              {player.eliminated ? "out" : (orbCounts[i] ?? 0)}
            </span>
          </div>
        );
      })}
    </aside>
  );
}
