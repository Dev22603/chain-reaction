"use client";

import { Check, Copy, LogOut, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Cell } from "@/components/game/Cell";
import { capacityFor, cellKey, diffBoards, tallyOrbs, type BoardCellEffect } from "@/lib/board";
import { PLAYER_COLORS } from "@/lib/colors";
import type { Board, GameState } from "@/lib/types";

const EXTENDED_COLORS = [
  "#ff3b6b", "#25d3ff", "#ffd23f", "#5cff9b",
  "#ff3da7", "#ff6b1f", "#b6ff3c", "#c77dff",
];

function playerColor(index: number): string {
  return EXTENDED_COLORS[index] ?? PLAYER_COLORS[index % PLAYER_COLORS.length] ?? "#ffffff";
}

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
  roomCode?: string | null;
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
  onToggleMute,
  roomCode,
}: GameBoardProps) {
  const myIndex = gameState.players.findIndex((p) => p.id === playerId);
  const isMyTurn = myIndex === gameState.currentTurn;
  const currentPlayer = gameState.players[gameState.currentTurn];
  const turnColor = playerColor(gameState.currentTurn);
  const rows = gameState.board.length;
  const cols = gameState.board[0]?.length ?? 0;

  const effects = useBoardEffects(gameState.board, { onPlace, onExplode, onChain });
  const orbCounts = useMemo(
    () => tallyOrbs(gameState.board, gameState.players.length),
    [gameState.board, gameState.players.length]
  );

  // Board size: fills the container using container queries via inline calc
  const boardWidth = `min(100cqw, calc(100cqh * ${cols} / ${rows}))`;

  return (
    <div
      className="game-shell"
      style={{ "--turn": turnColor } as React.CSSProperties}
    >
      {/* ── Compact topbar ── */}
      <header
        className="grid items-center gap-2"
        style={{ gridTemplateColumns: "1fr auto 1fr" }}
      >
        {/* Brand */}
        <div className="flex min-w-0 items-center gap-2">
          <span className="relative grid h-6 w-6 flex-shrink-0 place-items-center">
            <span className="absolute inset-0 animate-[orb-pulse_2.4s_ease-in-out_infinite] rounded-full bg-gradient-to-br from-reactor-glow to-reactor opacity-90 shadow-[0_0_16px_rgba(255,107,31,0.55)]" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-white" />
          </span>
          <span className="hidden truncate font-display text-xs tracking-wide text-white/80 sm:block">
            Chain Reaction
          </span>
        </div>

        {/* Turn chip */}
        <div
          className="inline-flex max-w-[55vw] items-center gap-2 rounded-full border px-3 py-1.5 font-display text-xs uppercase tracking-widest text-white transition-[border-color,box-shadow] duration-300 sm:text-sm"
          style={{
            borderColor: `color-mix(in srgb, ${turnColor} 55%, transparent)`,
            boxShadow: `0 0 16px color-mix(in srgb, ${turnColor} 28%, transparent)`,
            background: "rgba(20,8,50,.72)",
          }}
        >
          <span
            className="h-2.5 w-2.5 flex-shrink-0 animate-[orb-pulse_1.2s_ease-in-out_infinite] rounded-full"
            style={{
              background: `radial-gradient(circle at 30% 30%, #fff, ${turnColor} 60%, color-mix(in srgb, ${turnColor} 50%, black))`,
              boxShadow: `0 0 10px ${turnColor}`,
            }}
          />
          <span
            className="overflow-hidden text-ellipsis whitespace-nowrap"
            style={{ color: isMyTurn ? turnColor : undefined, textShadow: isMyTurn ? `0 0 12px ${turnColor}` : undefined }}
          >
            {isMyTurn ? "YOUR TURN" : (currentPlayer?.name ?? "…")}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-1.5">
          {onToggleMute ? (
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
              className="grid h-8 w-8 place-items-center rounded-xl border border-white/8 bg-surface/45 text-fg-muted transition-colors hover:border-white/18 hover:bg-surface-2/55 hover:text-white"
            >
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onLeaveGame}
            aria-label="Leave game"
            className="grid h-8 w-8 place-items-center rounded-xl border border-white/8 bg-surface/45 text-fg-muted transition-colors hover:border-p1/50 hover:bg-p1/12 hover:text-p1"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* ── Board area (fills remaining height) ── */}
      <div className="game-board-container">
        {/* Show code popover (only for private rooms) */}
        {roomCode ? <BoardCodePopover code={roomCode} /> : null}

        {/* Board grid */}
        <div
          className="relative overflow-hidden"
          style={{
            width: boardWidth,
            aspectRatio: `${cols} / ${rows}`,
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
            borderRadius: "clamp(8px,1.2vw,16px)",
            background: "rgba(0,0,0,.68)",
            border: `1.5px solid color-mix(in srgb, ${turnColor} 42%, transparent)`,
            boxShadow: `0 0 0 1px rgba(255,255,255,.03) inset, 0 24px 60px rgba(0,0,0,.6), 0 0 24px color-mix(in srgb, ${turnColor} 14%, transparent)`,
            transition: "border-color .35s, box-shadow .35s",
          }}
        >
          {/* Subtle grid lines */}
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-45"
            style={{
              backgroundImage: `linear-gradient(to right, color-mix(in srgb, ${turnColor} 25%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, ${turnColor} 25%, transparent) 1px, transparent 1px)`,
              backgroundSize: `calc(100% / ${cols}) calc(100% / ${rows})`,
            }}
          />

          {gameState.board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const ownerColor = cell.owner === null ? turnColor : playerColor(cell.owner);
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

        {/* Hint strip below board */}
        <div
          className="absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-4 font-mono text-[9px] uppercase tracking-[0.2em] text-fg-muted"
          style={{ width: boardWidth, paddingTop: 4 }}
        >
          <span>{rows} × {cols} lattice</span>
          <span className="ml-auto" style={{ color: isMyTurn ? "var(--color-radium)" : undefined }}>
            {isMyTurn ? "● tap a legal cell" : "○ watching reactor"}
          </span>
        </div>
      </div>

      {/* ── Player rail ── */}
      <div className="grid gap-1.5">
        <div className="flex flex-wrap gap-1.5 sm:flex-nowrap">
          {gameState.players.map((player, i) => {
            const color = playerColor(i);
            const isActive = gameState.currentTurn === i && !player.eliminated;
            const isSelf = player.id === playerId;
            return (
              <div
                key={player.id}
                className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border px-2 py-1.5 transition-[border-color,box-shadow,background] duration-200"
                style={{
                  borderColor: isActive
                    ? color
                    : `color-mix(in srgb, ${color} 22%, rgba(46,26,111,0.6))`,
                  background: isActive
                    ? `color-mix(in srgb, ${color} 12%, rgba(20,8,50,.65))`
                    : "rgba(20,8,50,.55)",
                  boxShadow: isActive
                    ? `0 0 14px color-mix(in srgb, ${color} 28%, transparent)`
                    : undefined,
                  opacity: player.eliminated ? 0.35 : 1,
                }}
              >
                <span
                  className="grid h-4 w-4 flex-shrink-0 place-items-center rounded-full font-display text-[8px]"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, #fff, ${color} 55%, color-mix(in srgb, ${color} 50%, #000))`,
                    boxShadow: `0 0 8px ${color}`,
                    color: "rgba(0,0,0,.5)",
                  }}
                >
                  {player.eliminated ? "✕" : i + 1}
                </span>
                <span
                  className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[10px] uppercase tracking-wide"
                  style={{ color: isSelf ? "var(--color-fg)" : "var(--color-fg-muted)" }}
                >
                  {player.name}
                </span>
                <span className="font-mono text-[10px] tabular-nums text-fg-muted">
                  {player.eliminated ? "out" : (orbCounts[i] ?? 0)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── BoardCodePopover ─────────────────────────────────────────────────

function BoardCodePopover({ code }: { code: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleCopy = useCallback(async () => {
    try { await navigator.clipboard.writeText(code); } catch { /* noop */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [code]);

  return (
    <div
      ref={rootRef}
      className="absolute left-2 top-2 z-20"
      style={{ position: "absolute" }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={
          "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest backdrop-blur-sm transition-colors " +
          (open
            ? "border-cherenkov/50 bg-cherenkov/12 text-cherenkov"
            : "border-white/10 bg-surface/50 text-fg-muted hover:border-cherenkov/40 hover:text-cherenkov")
        }
      >
        <Copy size={11} aria-hidden="true" />
        <span>{open ? "Hide code" : "Show code"}</span>
      </button>

      {open ? (
        <div className="board-code-popover-content">
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.3em] text-fg-muted">
            Invite code
          </p>
          <div className="board-code-popover-tiles mb-3">
            {code.split("").map((ch, i) => (
              <span key={i} className="board-code-popover-tile">
                {ch}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className={
              "flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors " +
              (copied
                ? "border-radium/40 bg-radium/8 text-radium"
                : "border-cherenkov/35 bg-cherenkov/8 text-cherenkov hover:bg-cherenkov/16")
            }
          >
            {copied ? <Check size={11} strokeWidth={3} /> : <Copy size={11} />}
            <span>{copied ? "Copied" : "Copy code"}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

// ─── Board effects hook ───────────────────────────────────────────────

function useBoardEffects(
  board: Board,
  callbacks: {
    onPlace?: (intensity: number) => void;
    onExplode?: (intensity: number) => void;
    onChain?: (intensity: number) => void;
  }
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
    }, EFFECT_DURATION_MS);

    return () => window.clearTimeout(timeout);
  }, [board, onPlace, onExplode, onChain]);

  return effects;
}
