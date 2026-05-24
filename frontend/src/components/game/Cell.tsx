"use client";

import type { CSSProperties } from "react";
import type { BoardCellEffect } from "@/lib/board";
import { cn } from "@/lib/cn";
import type { Cell as CellModel } from "@/lib/types";

interface CellProps {
  cell: CellModel;
  capacity: number;
  color: string;
  frameColor: string;
  legal: boolean;
  highlight: boolean;
  effect: BoardCellEffect | null;
  onPlay: () => void;
  ariaLabel: string;
}

export function Cell({
  cell,
  capacity,
  color,
  frameColor,
  legal,
  highlight,
  effect,
  onPlay,
  ariaLabel
}: CellProps) {
  const filled = cell.count > 0;
  const critical = filled && cell.count >= capacity - 1;

  return (
    <button
      type="button"
      disabled={!legal}
      onClick={onPlay}
      aria-label={ariaLabel}
      className={cn(
        "group relative grid aspect-square min-h-0 place-items-center overflow-hidden border bg-black/90 transition-[border-color,background,box-shadow] duration-200",
        legal ? "cursor-pointer" : "cursor-not-allowed",
        highlight && "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
      )}
      style={
        {
          "--cell-color": color,
          borderColor: frameColor,
          boxShadow: legal ? `inset 0 0 0 1px ${frameColor}14` : undefined
        } as CSSProperties & Record<"--cell-color", string>
      }
    >
      {filled ? <AtomCluster count={cell.count} color={color} critical={critical} /> : null}

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
          <span
            className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: frameColor,
              boxShadow: `0 0 14px ${frameColor}`
            }}
          />
        </span>
      ) : null}
    </button>
  );
}

const ATOM_POSITIONS: Record<number, ReadonlyArray<{ x: string; y: string; size: string }>> = {
  1: [{ x: "0%", y: "0%", size: "48%" }],
  2: [
    { x: "-22%", y: "0%", size: "38%" },
    { x: "22%", y: "0%", size: "38%" }
  ],
  3: [
    { x: "0%", y: "-22%", size: "34%" },
    { x: "-22%", y: "16%", size: "34%" },
    { x: "22%", y: "16%", size: "34%" }
  ],
  4: [
    { x: "-22%", y: "-22%", size: "32%" },
    { x: "22%", y: "-22%", size: "32%" },
    { x: "-22%", y: "22%", size: "32%" },
    { x: "22%", y: "22%", size: "32%" }
  ]
};

function AtomCluster({ count, color, critical }: { count: number; color: string; critical: boolean }) {
  const positions = ATOM_POSITIONS[Math.min(count, 4)] ?? [];

  return (
    <span className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true">
      <span className="atom-cluster">
        {positions.map((p, i) => (
          <span
            key={i}
            className={cn("atom", critical ? "atom-critical" : "atom-idle")}
            style={
              {
                "--cell-color": color,
                "--tx": p.x,
                "--ty": p.y,
                "--as": p.size,
                animationDelay: `${i * 0.04}s`
              } as CSSProperties & Record<"--cell-color" | "--tx" | "--ty" | "--as", string>
            }
          />
        ))}
        {count > 4 ? (
          <span
            className="absolute bottom-[4%] right-[8%] font-display tracking-[0.04em]"
            style={{
              color,
              fontSize: "clamp(8px, 1.4vw, 12px)",
              textShadow: `0 0 8px ${color}`
            }}
          >
            {count}
          </span>
        ) : null}
      </span>
    </span>
  );
}
