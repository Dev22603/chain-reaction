"use client";

import { memo } from "react";
import type { CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
});

interface AtomSpec {
  phase: number;
  radius: number;
  size: number;
  direction: 1 | -1;
  speedOffset: number;
}

const ATOM_PHASES = [18, 151, 274, 329];
const ATOM_RADIUS_BY_COUNT = [0, 10, 18, 21, 22];
const ATOM_SIZE_BY_COUNT = [0, 44, 35, 30, 27];

const AtomCluster = memo(function AtomCluster({
  count,
  capacity,
  color,
  critical,
  overloaded,
  mergeId
}: {
  count: number;
  capacity: number;
  color: string;
  critical: boolean;
  overloaded: boolean;
  mergeId: number | null;
}) {
  const shouldReduceMotion = useReducedMotion();
  const visibleCount = Math.min(count, 4);
  const atoms = Array.from({ length: visibleCount }, (_, i): AtomSpec => {
    const radius = ATOM_RADIUS_BY_COUNT[visibleCount] ?? 20;
    return {
      phase: (ATOM_PHASES[i] + visibleCount * 23 + i * 11) % 360,
      radius,
      size: ATOM_SIZE_BY_COUNT[visibleCount] ?? 28,
      direction: (i + visibleCount) % 2 === 0 ? 1 : -1,
      speedOffset: i * 0.12 + (i % 2) * 0.08
    };
  });
  const load = Math.min(1.25, count / Math.max(1, capacity));
  const baseDuration = overloaded ? 0.28 : critical ? 0.48 : 3.2 - load * 1.45;
  const pulseDuration = critical ? 0.46 : 1.8;

  return (
    <span className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true">
      <motion.span
        className={cn("atom-cluster", critical && "atom-cluster-critical")}
        initial={{ opacity: 0, scale: 0.78 }}
        animate={{
          opacity: 1,
          scale: critical && !shouldReduceMotion ? [1, 1.035, 0.99, 1.055, 1] : 1
        }}
        transition={{
          scale: {
            duration: overloaded ? 0.3 : pulseDuration,
            repeat: shouldReduceMotion ? 0 : Infinity,
            ease: "easeInOut"
          },
          opacity: { duration: 0.16 }
        }}
      >
        {atoms.map((atom, i) => {
          const duration = Math.max(0.24, baseDuration - atom.speedOffset);
          return (
            <motion.span
              key={i}
              className="atom-orbit"
              initial={{ rotate: atom.phase }}
              animate={{ rotate: shouldReduceMotion ? atom.phase : atom.phase + atom.direction * 360 }}
              transition={{
                duration,
                repeat: shouldReduceMotion ? 0 : Infinity,
                ease: "linear"
              }}
            >
              <motion.span
                className="atom-position"
                style={{
                  left: `${50 + atom.radius}%`,
                  top: "50%",
                  width: `${atom.size}%`,
                  height: `${atom.size}%`
                }}
                initial={{ x: "-50%", y: "-50%", scale: 0.18, opacity: 0 }}
                animate={{
                  x: "-50%",
                  y: "-50%",
                  scale: critical && !shouldReduceMotion ? [1, 1.12, 0.95, 1.07, 1] : 1,
                  opacity: 1,
                  filter:
                    critical && !shouldReduceMotion
                      ? [
                          "brightness(1) saturate(1)",
                          "brightness(1.7) saturate(1.35)",
                          "brightness(1.1) saturate(1.1)"
                        ]
                      : "brightness(1) saturate(1)"
                }}
                transition={{
                  type: "spring",
                  stiffness: mergeId ? 360 : 230,
                  damping: mergeId ? 18 : 24,
                  mass: 0.48,
                  scale: {
                    duration: overloaded ? 0.22 : critical ? 0.42 : 1.7 + i * 0.11,
                    repeat: critical && !shouldReduceMotion ? Infinity : 0,
                    ease: "easeInOut"
                  },
                  filter: {
                    duration: overloaded ? 0.22 : critical ? 0.42 : 1.7,
                    repeat: critical && !shouldReduceMotion ? Infinity : 0,
                    ease: "easeInOut"
                  }
                }}
              >
                <motion.span
                  className="atom"
                  style={{ color }}
                  animate={{
                    color,
                    boxShadow: [
                      `0 0 10px ${color}, 0 0 24px ${color}88, inset 0 0 8px rgba(255,255,255,0.35)`,
                      `0 0 16px ${color}, 0 0 38px ${color}aa, inset 0 0 10px rgba(255,255,255,0.48)`,
                      `0 0 10px ${color}, 0 0 24px ${color}88, inset 0 0 8px rgba(255,255,255,0.35)`
                    ]
                  }}
                  transition={{
                    color: { type: "spring", stiffness: 180, damping: 22 },
                    boxShadow: {
                      duration: critical ? 0.42 : 1.8,
                      repeat: critical && !shouldReduceMotion ? Infinity : 0,
                      ease: "easeInOut"
                    }
                  }}
                />
              </motion.span>
            </motion.span>
          );
        })}
        {count > 4 ? (
          <motion.span
            key="overflow-count"
            className="absolute bottom-[4%] right-[8%] font-display tracking-[0.04em]"
            style={{
              color,
              fontSize: "clamp(8px, 1.4vw, 12px)",
              textShadow: `0 0 8px ${color}`
            }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
          >
            {count}
          </motion.span>
        ) : null}
      </motion.span>
    </span>
  );
});

function ExplosionBloom({ color }: { color: string }) {
  const particles = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * Math.PI * 2) / 8;
    const distance = i % 2 === 0 ? 42 : 32;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance
    };
  });

  return (
    <span className="pointer-events-none absolute inset-0 z-10 grid place-items-center" aria-hidden="true">
      {[0, 1].map((ring) => (
        <motion.span
          key={ring}
          className="absolute h-full w-full rounded-full border-2"
          style={{ borderColor: color, boxShadow: `0 0 24px ${color}` }}
          initial={{ scale: 0.18, opacity: 0.7, borderWidth: 4 }}
          animate={{ scale: 2.25 + ring * 0.28, opacity: 0, borderWidth: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.72,
            delay: ring * 0.055,
            ease: [0.16, 0.84, 0.32, 1]
          }}
        />
      ))}
      {particles.map((particle, i) => (
        <motion.span
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{ x: particle.x, y: particle.y, scale: 0, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 170,
            damping: 24,
            mass: 0.42,
            delay: i * 0.008
          }}
        />
      ))}
    </span>
  );
}
