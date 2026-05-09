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

function CellOrbs({ count, color, critical }: { count: number; color: string; critical: boolean }) {
  const displayCount = Math.min(count, 4);
  const size =
    displayCount === 1
      ? "clamp(0.55rem, 52%, 1.5rem)"
      : displayCount === 2
        ? "clamp(0.45rem, 40%, 1.125rem)"
        : displayCount === 3
          ? "clamp(0.4rem, 34%, 0.95rem)"
          : "clamp(0.35rem, 30%, 0.82rem)";
  const orbits = orbitConfig(displayCount, critical);

  return (
    <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
      {orbits.map((orbit, index) => (
        <span
          key={index}
          className="absolute left-1/2 top-1/2"
          style={{
            animation: orbit.spins ? `orbit-spin ${orbit.duration}s linear infinite` : undefined,
            animationDelay: orbit.spins ? `-${orbit.duration * orbit.startFraction}s` : undefined
          }}
        >
          <span
            className="absolute left-0 top-0"
            style={{
              transform: `translate(-50%, -50%) translateX(${orbit.radius})`,
              animation:
                orbit.spins ? `orbit-spin-reverse ${orbit.duration}s linear infinite` : undefined,
              animationDelay: orbit.spins ? `-${orbit.duration * orbit.startFraction}s` : undefined
            }}
          >
            <Orb color={color} size={size} delay={index * 0.08} critical={critical} />
          </span>
        </span>
      ))}
      {count > 4 ? (
        <span
          className="absolute bottom-1 right-1 font-display text-[10px] uppercase tracking-[0.08em]"
          style={{ color }}
        >
          {count}
        </span>
      ) : null}
    </span>
  );
}

function orbitConfig(
  count: number,
  critical: boolean
): Array<{ radius: string; duration: number; startFraction: number; spins: boolean }> {
  switch (count) {
    case 1:
      return [{ radius: "0px", duration: 0, startFraction: 0, spins: false }];
    case 2:
      return [
        { radius: "clamp(0.28rem, 22%, 0.75rem)", duration: critical ? 1.9 : 3.9, startFraction: 0, spins: true },
        { radius: "clamp(0.28rem, 22%, 0.75rem)", duration: critical ? 1.9 : 3.9, startFraction: 0.5, spins: true }
      ];
    case 3:
      return [
        { radius: "clamp(0.24rem, 20%, 0.7rem)", duration: critical ? 1.8 : 3.5, startFraction: 0, spins: true },
        { radius: "clamp(0.24rem, 20%, 0.7rem)", duration: critical ? 1.8 : 3.5, startFraction: 1 / 3, spins: true },
        { radius: "clamp(0.24rem, 20%, 0.7rem)", duration: critical ? 1.8 : 3.5, startFraction: 2 / 3, spins: true }
      ];
    case 4:
    default:
      return [
        { radius: "clamp(0.22rem, 18%, 0.68rem)", duration: critical ? 1.6 : 4.4, startFraction: 0, spins: true },
        { radius: "clamp(0.22rem, 18%, 0.68rem)", duration: critical ? 1.6 : 4.4, startFraction: 0.25, spins: true },
        { radius: "clamp(0.22rem, 18%, 0.68rem)", duration: critical ? 1.6 : 4.4, startFraction: 0.5, spins: true },
        { radius: "clamp(0.22rem, 18%, 0.68rem)", duration: critical ? 1.6 : 4.4, startFraction: 0.75, spins: true }
      ];
  }
}
