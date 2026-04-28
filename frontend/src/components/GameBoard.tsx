"use client";

import { LogOut } from "lucide-react";
import type { CSSProperties } from "react";
import { PLAYER_COLORS } from "@/lib/colors";
import type { GameState } from "@/lib/types";

interface GameBoardProps {
  gameState: GameState;
  playerId: string | null;
  onMove: (row: number, col: number) => void;
  onLeaveGame: () => void;
}

export function GameBoard({ gameState, playerId, onMove, onLeaveGame }: GameBoardProps) {
  const myIndex = gameState.players.findIndex((player) => player.id === playerId);
  const isMyTurn = myIndex === gameState.currentTurn;
  const currentPlayer = gameState.players[gameState.currentTurn];

  return (
    <section className="game-layout">
      <div className="game-header">
        <div>
          <p className="eyebrow">Current turn</p>
          <h1>{currentPlayer?.name ?? "Waiting"}</h1>
        </div>
        <button className="secondary-button" type="button" onClick={onLeaveGame}>
          <LogOut size={18} aria-hidden="true" />
          Leave
        </button>
      </div>

      <div className="board-wrap">
        <div
          className="board"
          style={{
            gridTemplateColumns: `repeat(${gameState.board[0]?.length ?? 1}, minmax(0, 1fr))`
          }}
        >
          {gameState.board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isLegal =
                isMyTurn && (cell.owner === null || cell.owner === myIndex) && !currentPlayer?.eliminated;
              const color = cell.owner === null ? "transparent" : PLAYER_COLORS[cell.owner];

              return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  className="cell"
                  type="button"
                  disabled={!isLegal}
                  onClick={() => onMove(rowIndex, colIndex)}
                  style={{ "--cell-color": color } as CSSProperties & Record<"--cell-color", string>}
                  aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}, ${cell.count} orbs`}
                >
                  {cell.count > 0 ? <span>{cell.count}</span> : null}
                </button>
              );
            })
          )}
        </div>
      </div>

      <aside className="player-list" aria-label="Players">
        {gameState.players.map((player, index) => (
          <div className="player-row" key={player.id}>
            <span className="player-swatch" style={{ background: PLAYER_COLORS[index] }} />
            <span>{player.name}</span>
            <strong>{player.eliminated ? "Out" : index === gameState.currentTurn ? "Turn" : ""}</strong>
          </div>
        ))}
      </aside>
    </section>
  );
}
