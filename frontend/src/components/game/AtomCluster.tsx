"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

interface AtomClusterProps {
  count: number;
  capacity: number;
  color: string;
  critical: boolean;
  overloaded: boolean;
  mergeId: number | null;
}

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

function buildAtoms(visibleCount: number): AtomSpec[] {
  return Array.from({ length: visibleCount }, (_, i) => ({
    phase: (ATOM_PHASES[i] + visibleCount * 23 + i * 11) % 360,
    radius: ATOM_RADIUS_BY_COUNT[visibleCount] ?? 20,
    size: ATOM_SIZE_BY_COUNT[visibleCount] ?? 28,
    direction: (i + visibleCount) % 2 === 0 ? 1 : -1,
    speedOffset: i * 0.12 + (i % 2) * 0.08
  }));
}

export const AtomCluster = memo(function AtomCluster({
  count,
  capacity,
  color,
  critical,
  overloaded,
  mergeId
}: AtomClusterProps) {
  const shouldReduceMotion = useReducedMotion();
  const visibleCount = Math.min(count, 4);
  const atoms = buildAtoms(visibleCount);
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
        {atoms.map((atom, i) => (
          <Atom
            key={i}
            atom={atom}
            index={i}
            color={color}
            critical={critical}
            overloaded={overloaded}
            mergeId={mergeId}
            baseDuration={baseDuration}
            shouldReduceMotion={shouldReduceMotion ?? false}
          />
        ))}
        {count > 4 ? <OverflowCount count={count} color={color} /> : null}
      </motion.span>
    </span>
  );
});

function Atom({
  atom,
  index,
  color,
  critical,
  overloaded,
  mergeId,
  baseDuration,
  shouldReduceMotion
}: {
  atom: AtomSpec;
  index: number;
  color: string;
  critical: boolean;
  overloaded: boolean;
  mergeId: number | null;
  baseDuration: number;
  shouldReduceMotion: boolean;
}) {
  const duration = Math.max(0.24, baseDuration - atom.speedOffset);
  return (
    <motion.span
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
            duration: overloaded ? 0.22 : critical ? 0.42 : 1.7 + index * 0.11,
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
}

function OverflowCount({ count, color }: { count: number; color: string }) {
  return (
    <motion.span
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
  );
}
