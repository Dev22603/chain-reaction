"use client";

import { AnimatePresence, motion } from "framer-motion";
import { neighborDirections, type BoardCellEffect } from "@/lib/board";
import { playerColorOr } from "@/lib/colors";

interface BoardTravelLayerProps {
  effects: Map<string, BoardCellEffect>;
  rows: number;
  cols: number;
  width: number;
  height: number;
}

// Animated overlay for explosions: for every exploding cell, an orb flies to
// each neighbor along a fading trail line.
export function BoardTravelLayer({ effects, rows, cols, width, height }: BoardTravelLayerProps) {
  if (effects.size === 0 || width === 0 || height === 0 || rows === 0 || cols === 0) {
    return null;
  }

  const cellWidth = width / cols;
  const cellHeight = height / rows;
  const atomSize = Math.max(7, Math.min(cellWidth, cellHeight) * 0.24);
  const travelEffects = Array.from(effects.entries()).filter(([, effect]) => effect.exploded);

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden="true">
      <AnimatePresence>
        {travelEffects.flatMap(([key, effect]) => {
          const [row, col] = key.split("-").map(Number);
          const color = playerColorOr(
            effect.previousOwner,
            playerColorOr(effect.nextOwner, "#ffffff")
          );
          const left = ((col + 0.5) / cols) * 100;
          const top = ((row + 0.5) / rows) * 100;

          return neighborDirections(row, col, rows, cols).map((direction) => {
            const x = direction.colDelta * cellWidth;
            const y = direction.rowDelta * cellHeight;
            const angle = Math.atan2(y, x) * (180 / Math.PI);
            const length = Math.hypot(x, y);
            const travelKey = `${effect.id}-${direction.rowDelta}-${direction.colDelta}`;

            return (
              <span
                key={travelKey}
                className="absolute"
                style={{
                  left: `${left}%`,
                  top: `${top}%`
                }}
              >
                <motion.span
                  className="absolute left-0 top-0 h-[3px] origin-left rounded-full"
                  style={{
                    width: length,
                    rotate: angle,
                    background: `linear-gradient(90deg, ${color}, transparent)`,
                    boxShadow: `0 0 12px ${color}`
                  }}
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: [0, 1, 0.15], opacity: [0, 0.75, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.82, ease: [0.16, 0.84, 0.32, 1] }}
                />
                <motion.span
                  className="absolute rounded-full"
                  style={{
                    width: atomSize,
                    height: atomSize,
                    marginLeft: -atomSize / 2,
                    marginTop: -atomSize / 2,
                    color,
                    background: color,
                    boxShadow: `0 0 14px ${color}, 0 0 34px ${color}99, inset 0 0 8px rgba(255,255,255,.78)`
                  }}
                  initial={{ x: 0, y: 0, scale: 0.7, opacity: 0 }}
                  animate={{ x, y, scale: [0.7, 1.08, 0.58], opacity: [0, 1, 1, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.88, ease: [0.12, 0.82, 0.24, 1] }}
                />
              </span>
            );
          });
        })}
      </AnimatePresence>
    </div>
  );
}
