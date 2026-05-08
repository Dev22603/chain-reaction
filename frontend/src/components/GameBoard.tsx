"use client";

import { LogOut, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Cell } from "@/components/game/Cell";
import { PlayerPanel } from "@/components/game/PlayerPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { capacityFor, cellKey, diffBoards, tallyOrbs, type BoardCellEffect } from "@/lib/board";
import { PLAYER_COLORS } from "@/lib/colors";
import type { Board, GameState } from "@/lib/types";

interface GameBoardProps {
  gameState: GameState;
  playerId: string | null;
  onMove: (row: number, col: number) => void;
  onLeaveGame: () => void;
  onPlace?: (intensity: number) => void;
  onExplode?: (intensity: number) => void;
  onChain?: (intensity: number) => void;
  muted?: boolean;
  onToggleMute?: () => void;
}

const EFFECT_DURATION_MS = 650;
const CHAIN_THRESHOLD = 2;

export function GameBoard({
  gameState,
  playerId,
  onMove,
  onLeaveGame,
  onPlace,
  onExplode,
  onChain,
  muted,
  onToggleMute
}: GameBoardProps) {
  const myIndex = gameState.players.findIndex((player) => player.id === playerId);
  const isMyTurn = myIndex === gameState.currentTurn;
  const currentPlayer = gameState.players[gameState.currentTurn];
  const turnColor = PLAYER_COLORS[gameState.currentTurn] ?? "#ffffff";
  const rows = gameState.board.length;
  const cols = gameState.board[0]?.length ?? 0;

  const effects = useBoardEffects(gameState.board, {
    onPlace,
    onExplode,
    onChain
  });

  const orbCounts = useMemo(
    () => tallyOrbs(gameState.board, gameState.players.length),
    [gameState.board, gameState.players.length]
  );

  return (
    <section className="grid gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Badge className="border-current/35 bg-current/8" style={{ color: turnColor }}>
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: turnColor, boxShadow: `0 0 8px ${turnColor}` }}
            />
            {isMyTurn ? "your turn" : "current turn"}
          </Badge>
          <h1
            className="font-display text-2xl uppercase tracking-[0.05em] text-fg sm:text-3xl"
            style={{ textShadow: isMyTurn ? `0 0 20px ${turnColor}66` : undefined }}
          >
            {currentPlayer?.name ?? "Awaiting"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {onToggleMute ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              {muted ? "muted" : "audio"}
            </Button>
          ) : null}
          <Button variant="danger" size="sm" onClick={onLeaveGame}>
            <LogOut size={14} aria-hidden="true" />
            Abort
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="w-full lg:flex-1">
          <div
            className="mx-auto grid w-full max-w-[760px] overflow-hidden border-[1.5px] bg-black/65 shadow-[0_0_24px_rgba(0,0,0,0.35)]"
            style={{
              borderColor: turnColor,
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
            }}
          >
            {gameState.board.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const ownerColor = cell.owner === null ? turnColor : PLAYER_COLORS[cell.owner];
                const legal =
                  isMyTurn && (cell.owner === null || cell.owner === myIndex) && !currentPlayer?.eliminated;
                const key = cellKey(rowIndex, colIndex);

                return (
                  <Cell
                    key={key}
                    cell={cell}
                    capacity={capacityFor(rowIndex, colIndex, rows, cols)}
                    color={ownerColor}
                    frameColor={turnColor}
                    legal={legal}
                    highlight={legal && cell.count > 0}
                    effect={effects.get(key) ?? null}
                    onPlay={() => onMove(rowIndex, colIndex)}
                    ariaLabel={`Row ${rowIndex + 1}, column ${colIndex + 1}, ${cell.count} orbs`}
                  />
                );
              })
            )}
          </div>
          <div className="mx-auto mt-2 max-w-[760px] font-mono text-[10px] uppercase tracking-[0.2em] text-fg-muted">
            {rows} x {cols} lattice
          </div>
        </div>

        <PlayerPanel
          players={gameState.players}
          currentTurn={gameState.currentTurn}
          selfId={playerId}
          orbCounts={orbCounts}
        />
      </div>
    </section>
  );
}

interface BoardEffectCallbacks {
  onPlace?: (intensity: number) => void;
  onExplode?: (intensity: number) => void;
  onChain?: (intensity: number) => void;
}

function useBoardEffects(board: Board, callbacks: BoardEffectCallbacks) {
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
    }, EFFECT_DURATION_MS);

    return () => window.clearTimeout(timeout);
  }, [board, onPlace, onExplode, onChain]);

  return effects;
}
