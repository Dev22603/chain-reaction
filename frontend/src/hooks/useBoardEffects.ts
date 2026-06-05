import { useEffect, useRef, useState } from "react";
import { diffBoards, type BoardCellEffect } from "@/lib/board";
import { BOARD_EFFECT_DURATION_MS, CHAIN_THRESHOLD } from "@/lib/constants";
import type { Board } from "@/lib/types";

interface UseBoardEffectsCallbacks {
  onPlace?: (intensity: number) => void;
  onExplode?: (intensity: number) => void;
  onChain?: (intensity: number) => void;
}

export function useBoardEffects(
  board: Board,
  callbacks: UseBoardEffectsCallbacks
) {
  const { onPlace, onExplode, onChain } = callbacks;
  const [effects, setEffects] = useState<Map<string, BoardCellEffect>>(new Map());
  const previousBoard = useRef<Board | null>(null);
  const effectIdRef = useRef(0);

  useEffect(() => {
    const diff = diffBoards(previousBoard.current, board, () => {
      effectIdRef.current += 1;
      return effectIdRef.current;
    });

    const hadPrior = previousBoard.current !== null;
    previousBoard.current = board;

    if (hadPrior) {
      if (diff.explodedCount === 0 && diff.totalDelta === 1) {
        onPlace?.(0);
      } else if (diff.explodedCount > 0) {
        onExplode?.(Math.min(1, diff.explodedCount / 6));
        if (diff.explodedCount + diff.takeoverCount >= CHAIN_THRESHOLD) {
          onChain?.(Math.min(1, (diff.explodedCount + diff.takeoverCount) / 8));
        }
      }
    }

    if (diff.effects.size === 0) return;

    setEffects((prev) => {
      const merged = new Map(prev);
      diff.effects.forEach((effect, key) => merged.set(key, effect));
      return merged;
    });

    const timeout = window.setTimeout(() => {
      setEffects((prev) => {
        if (prev.size === 0) return prev;
        const next = new Map(prev);
        diff.effects.forEach((_, key) => next.delete(key));
        return next;
      });
    }, BOARD_EFFECT_DURATION_MS);

    return () => window.clearTimeout(timeout);
  }, [board, onPlace, onExplode, onChain]);

  return effects;
}
