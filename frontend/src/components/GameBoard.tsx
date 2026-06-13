"use client";

import { useRef, useMemo } from "react";
import { BoardCodePopover } from "@/components/game/BoardCodePopover";
import { BoardTravelLayer } from "@/components/game/BoardTravelLayer";
import { Cell } from "@/components/game/Cell";
import { GameHeader } from "@/components/game/GameHeader";
import { PlayerRail } from "@/components/game/PlayerRail";
import { useBoardEffects } from "@/hooks/useBoardEffects";
import { useBoardMetrics } from "@/hooks/useBoardMetrics";
import { capacityFor, cellKey, tallyOrbs } from "@/lib/board";
import { playerColor, playerColorOr } from "@/lib/colors";
import type { GameState } from "@/lib/types";

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
  const boardRef = useRef<HTMLDivElement>(null);
  const boardMetrics = useBoardMetrics(boardRef);
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
      <GameHeader
        turnColor={turnColor}
        isMyTurn={isMyTurn}
        currentPlayerName={currentPlayer?.name}
        muted={muted}
        onToggleMute={onToggleMute}
        onLeaveGame={onLeaveGame}
      />

      {/* ── Content: player rail on the left, board filling the rest ── */}
      <div className="flex min-h-0 items-stretch gap-2 sm:gap-3">
        <PlayerRail
          players={gameState.players}
          currentTurn={gameState.currentTurn}
          playerId={playerId}
          orbCounts={orbCounts}
        />

        {/* ── Board area (fills remaining width/height) ── */}
        <div className="game-board-container min-w-0 flex-1">
          {/* Show code popover (only for private rooms) */}
          {roomCode ? <BoardCodePopover code={roomCode} /> : null}

          {/* Board grid */}
          <div
            ref={boardRef}
            className="relative overflow-hidden"
            style={{
              width: boardWidth,
              aspectRatio: `${cols} / ${rows}`,
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,
              borderRadius: "clamp(8px,1.2vw,16px)",
              background: "rgba(255,255,255,.94)",
              border: `3px solid color-mix(in srgb, ${turnColor} 65%, white)`,
              boxShadow: "0 10px 0 rgba(24,73,128,0.18), 0 24px 48px rgba(20,60,110,0.28)",
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
                const effect = effects.get(key) ?? null;
                const effectColor = playerColorOr(effect?.previousOwner, ownerColor);
                return (
                  <Cell
                    key={key}
                    cell={cell}
                    capacity={capacityFor(rowIndex, colIndex, rows, cols)}
                    color={ownerColor}
                    frameColor={turnColor}
                    legal={legal}
                    highlight={legal && cell.count > 0}
                    effect={effect}
                    effectColor={effectColor}
                    onPlay={() => onMove(rowIndex, colIndex)}
                    ariaLabel={`Row ${rowIndex + 1}, column ${colIndex + 1}, ${cell.count} orbs`}
                  />
                );
              })
            )}

            <BoardTravelLayer
              effects={effects}
              rows={rows}
              cols={cols}
              width={boardMetrics.width}
              height={boardMetrics.height}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
