"use client";

import { memo } from "react";
import type { CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AtomCluster } from "@/components/game/AtomCluster";
import { ExplosionBloom } from "@/components/game/ExplosionBloom";
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
  effectColor: string;
  onPlay: () => void;
  ariaLabel: string;
}

export const Cell = memo(function Cell({
  cell,
  capacity,
  color,
  frameColor,
  legal,
  highlight,
  effect,
  effectColor,
  onPlay,
  ariaLabel
}: CellProps) {
  const filled = cell.count > 0;
  const critical = filled && cell.count >= capacity - 1;
  const overloaded = filled && cell.count >= capacity;

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
      {filled ? (
        <AtomCluster
          count={cell.count}
          capacity={capacity}
          color={color}
          critical={critical}
          overloaded={overloaded}
          mergeId={effect?.merged ? effect.id : null}
        />
      ) : null}

      <AnimatePresence>
        {effect?.exploded ? <ExplosionBloom key={`shock-${effect.id}`} color={effectColor} /> : null}
      </AnimatePresence>

      <AnimatePresence>
        {effect?.takeover || effect?.merged ? (
          <motion.span
            key={`flash-${effect.id}`}
            className="pointer-events-none absolute inset-0"
            style={{ backgroundColor: color }}
            initial={{ opacity: effect.takeover ? 0.36 : 0.22 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 170, damping: 24, mass: 0.6 }}
            aria-hidden="true"
          />
        ) : null}
      </AnimatePresence>

      {legal && !filled ? <LegalCellHint frameColor={frameColor} /> : null}
    </button>
  );
});

function LegalCellHint({ frameColor }: { frameColor: string }) {
  return (
    <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
      <span
        className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: frameColor,
          boxShadow: `0 0 14px ${frameColor}`
        }}
      />
    </span>
  );
}
