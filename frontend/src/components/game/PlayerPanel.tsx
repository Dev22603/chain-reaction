"use client";

import { Crown, Skull, User } from "lucide-react";
import { Card, CardEyebrow } from "@/components/ui/card";
import { PLAYER_COLORS } from "@/lib/colors";
import { cn } from "@/lib/cn";
import type { Player } from "@/lib/types";

interface PlayerPanelProps {
  players: Player[];
  currentTurn: number;
  selfId: string | null;
  orbCounts: number[];
  className?: string;
}

export function PlayerPanel({ players, currentTurn, selfId, orbCounts, className }: PlayerPanelProps) {
  return (
    <Card className={cn("grid w-full gap-3 p-4 sm:p-5 lg:w-[260px]", className)}>
      <CardEyebrow>// reactors</CardEyebrow>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        {players.map((player, index) => {
          const color = PLAYER_COLORS[index];
          const isTurn = index === currentTurn && !player.eliminated;
          const isSelf = player.id === selfId;
          const orbs = orbCounts[index] ?? 0;
          return (
            <li
              key={player.id}
              className={cn(
                "relative grid min-w-0 grid-cols-[auto_1fr] items-center gap-3 border bg-bg-soft/60 px-3 py-2.5 transition-colors xl:grid-cols-[auto_1fr_auto]",
                isTurn ? "border-line-2" : "border-line/60",
                player.eliminated && "opacity-40"
              )}
              style={
                isTurn
                  ? {
                      borderColor: color,
                      boxShadow: `0 0 0 1px ${color}55, 0 0 18px ${color}33`
                    }
                  : undefined
              }
            >
              <span
                className="relative grid h-7 w-7 place-items-center rounded-full"
                style={{
                  background: `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${color} 70%, white) 0%, ${color} 60%, color-mix(in srgb, ${color} 60%, black) 100%)`,
                  boxShadow: `0 0 12px ${color}66`
                }}
              >
                {player.eliminated ? (
                  <Skull size={12} className="text-bg" strokeWidth={2.5} />
                ) : isTurn ? (
                  <Crown size={12} className="text-bg" strokeWidth={2.5} />
                ) : (
                  <User size={12} className="text-bg" strokeWidth={2.5} />
                )}
              </span>
              <span className="grid min-w-0 gap-0.5">
                <span className="truncate font-display text-xs uppercase tracking-[0.18em] text-fg">
                  {player.name}
                  {isSelf ? <span className="ml-1.5 text-[9px] text-cherenkov">// you</span> : null}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-fg-muted">
                  {player.eliminated ? "eliminated" : `${orbs} orbs`}
                </span>
              </span>
              {isTurn ? (
                <span
                  className="hidden font-display text-[10px] uppercase tracking-[0.32em] xl:block"
                  style={{ color }}
                >
                  active
                </span>
              ) : (
                <span className="hidden font-display text-[10px] uppercase tracking-[0.32em] text-fg-muted xl:block">
                  idle
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
