"use client";

import type { CSSProperties } from "react";
import { Orb } from "@/components/ui/orb";
import type { BoardCellEffect } from "@/lib/board";
import { cn } from "@/lib/cn";
import type { Cell as CellModel } from "@/lib/types";

interface CellProps {
  cell: CellModel;
  capacity: number;
  color: string;
  legal: boolean;
  highlight: boolean;
  effect: BoardCellEffect | null;
  onPlay: () => void;
  ariaLabel: string;
}

export function Cell({ cell, capacity, color, legal, highlight, effect, onPlay, ariaLabel }: CellProps) {
  const filled = cell.count > 0;
  const critical = filled && cell.count >= capacity - 1;

  return (
    <button
      type="button"
      disabled={!legal}
      onClick={onPlay}
      aria-label={ariaLabel}
      className={cn(
        "group relative grid aspect-square place-items-center overflow-hidden border bg-bg-soft/40 transition-[border-color,background] duration-200",
        "border-line/70",
        legal && "cursor-pointer hover:border-cherenkov hover:bg-cherenkov/5",
        !legal && "cursor-not-allowed",
        highlight && "border-cherenkov/60",
        filled && "border-line-2"
      )}
      style={
        {
          "--cell-color": color
        } as CSSProperties & Record<"--cell-color", string>
      }
    >
      {filled ? <CellOrbs count={cell.count} color={color} critical={critical} /> : null}

      {effect?.exploded ? (
        <span
          key={`shock-${effect.id}`}
          className="pointer-events-none absolute inset-0 grid place-items-center"
          aria-hidden="true"
        >
          <span
            className="absolute h-full w-full rounded-full border-2 [animation:shockwave_0.55s_cubic-bezier(0.2,0.8,0.4,1)_forwards]"
            style={{ borderColor: color, boxShadow: `0 0 24px ${color}` }}
          />
          {Array.from({ length: 6 }, (_, i) => {
            const angle = (i * Math.PI * 2) / 6;
            const dx = Math.cos(angle) * 36;
            const dy = Math.sin(angle) * 36;
            return (
              <span
                key={i}
                className="absolute h-1.5 w-1.5 rounded-full [animation:burst-particle_0.6s_ease-out_forwards]"
                style={{
                  background: color,
                  boxShadow: `0 0 8px ${color}`,
                  ["--dx" as string]: `${dx}px`,
                  ["--dy" as string]: `${dy}px`
                }}
              />
            );
          })}
        </span>
      ) : null}

      {effect?.takeover ? (
        <span
          key={`flash-${effect.id}`}
          className="pointer-events-none absolute inset-0 [animation:flash-cell_0.5s_ease-out_forwards]"
          style={{ color }}
          aria-hidden="true"
        />
      ) : null}

      {legal && !filled ? (
        <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cherenkov/60 shadow-[0_0_12px_rgba(37,211,255,0.7)]" />
        </span>
      ) : null}
    </button>
  );
}

function CellOrbs({ count, color, critical }: { count: number; color: string; critical: boolean }) {
  const positions = orbPositions(Math.min(count, 4));
  const size = count >= 3 ? 12 : 16;

  return (
    <span className="relative grid h-full w-full place-items-center" aria-hidden="true">
      {positions.map((pos, i) => (
        <span
          key={i}
          className="absolute"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            transform: "translate(-50%, -50%)"
          }}
        >
          <Orb color={color} size={size} delay={i * 0.08} critical={critical} />
        </span>
      ))}
      {count > 4 ? (
        <span
          className="absolute right-1.5 top-1.5 font-display text-[10px] uppercase tracking-wider"
          style={{ color }}
        >
          {count}
        </span>
      ) : null}
    </span>
  );
}

function orbPositions(count: number): Array<{ x: number; y: number }> {
  switch (count) {
    case 1:
      return [{ x: 50, y: 50 }];
    case 2:
      return [
        { x: 35, y: 50 },
        { x: 65, y: 50 }
      ];
    case 3:
      return [
        { x: 50, y: 32 },
        { x: 32, y: 65 },
        { x: 68, y: 65 }
      ];
    case 4:
    default:
      return [
        { x: 32, y: 32 },
        { x: 68, y: 32 },
        { x: 32, y: 68 },
        { x: 68, y: 68 }
      ];
  }
}
