"use client";

import { useMemo, useRef } from "react";
import { BoardCodePopover } from "@/components/game/BoardCodePopover";
import { BoardTravelLayer } from "@/components/game/BoardTravelLayer";
import { Cell } from "@/components/game/Cell";
import { GameBoardHeader } from "@/components/game/GameBoardHeader";
import { PlayerRail } from "@/components/game/PlayerRail";
import { useBoardEffects } from "@/hooks/useBoardEffects";
import { useBoardMetrics } from "@/hooks/useBoardMetrics";
import { capacityFor, cellKey, tallyOrbs } from "@/lib/board";
import { playerColor } from "@/lib/colors";
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
  roomCode
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

  const boardWidth = `min(100cqw, calc(100cqh * ${cols} / ${rows}))`;

  return (
    <div className="game-shell" style={{ "--turn": turnColor } as React.CSSProperties}>
      <GameBoardHeader
        turnColor={turnColor}
        isMyTurn={isMyTurn}
        currentPlayerName={currentPlayer?.name}
        muted={muted}
        onToggleMute={onToggleMute}
        onLeaveGame={onLeaveGame}
      />

      <div className="game-board-container">
        {roomCode ? <BoardCodePopover code={roomCode} /> : null}

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
            background: "rgba(0,0,0,.68)",
            border: `1.5px solid color-mix(in srgb, ${turnColor} 42%, transparent)`,
            boxShadow: `0 0 0 1px rgba(255,255,255,.03) inset, 0 24px 60px rgba(0,0,0,.6), 0 0 24px color-mix(in srgb, ${turnColor} 14%, transparent)`,
            transition: "border-color .35s, box-shadow .35s"
          }}
        >
          <BoardGridLines turnColor={turnColor} rows={rows} cols={cols} />

          {gameState.board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const ownerColor = cell.owner === null ? turnColor : playerColor(cell.owner);
              const legal =
                isMyTurn && (cell.owner === null || cell.owner === myIndex) && !currentPlayer?.eliminated;
              const key = cellKey(rowIndex, colIndex);
              const effect = effects.get(key) ?? null;
              const effectColor =
                effect?.previousOwner !== null && effect?.previousOwner !== undefined
                  ? playerColor(effect.previousOwner)
                  : ownerColor;
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

        <BoardHintStrip boardWidth={boardWidth} rows={rows} cols={cols} isMyTurn={isMyTurn} />
      </div>

      <PlayerRail
        players={gameState.players}
        currentTurn={gameState.currentTurn}
        playerId={playerId}
        orbCounts={orbCounts}
      />
    </div>
  );
}

function BoardGridLines({ turnColor, rows, cols }: { turnColor: string; rows: number; cols: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 opacity-45"
      style={{
        backgroundImage: `linear-gradient(to right, color-mix(in srgb, ${turnColor} 25%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, ${turnColor} 25%, transparent) 1px, transparent 1px)`,
        backgroundSize: `calc(100% / ${cols}) calc(100% / ${rows})`
      }}
    />
  );
}

function BoardHintStrip({
  boardWidth,
  rows,
  cols,
  isMyTurn
}: {
  boardWidth: string;
  rows: number;
  cols: number;
  isMyTurn: boolean;
}) {
  return (
    <div
      className="absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-4 font-mono text-[9px] uppercase tracking-[0.2em] text-fg-muted"
      style={{ width: boardWidth, paddingTop: 4 }}
    >
      <span>
        {rows} × {cols} lattice
      </span>
      <span className="ml-auto" style={{ color: isMyTurn ? "var(--color-radium)" : undefined }}>
        {isMyTurn ? "● tap a legal cell" : "○ watching reactor"}
      </span>
    </div>
  );
}
