import { LIMITS } from "../constants/app.constants.js";
import type { Board, Cell, PlayerIndex } from "../types/game.js";
import { fileURLToPath } from "node:url";

export function createBoard(rows: number, cols: number): Board {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, (): Cell => ({ owner: null, count: 0 }))
  );
}

export function getNeighbors(
  row: number,
  col: number,
  rows: number,
  cols: number
): Array<[number, number]> {
  const candidates: Array<[number, number]> = [
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1]
  ];

  return candidates.filter(
    ([nextRow, nextCol]) =>
      nextRow >= 0 && nextRow < rows && nextCol >= 0 && nextCol < cols
  );
}

export function getCriticalMass(
  row: number,
  col: number,
  rows: number,
  cols: number
): number {
  return getNeighbors(row, col, rows, cols).length;
}

export function applyMove(
  board: Board,
  row: number,
  col: number,
  playerIndex: PlayerIndex,
  rows: number,
  cols: number
): Board {
  const selected = board[row]?.[col];
  if (!selected) {
    return board;
  }

  selected.count += 1;
  selected.owner = playerIndex;

  let remainingPasses = LIMITS.SAFETY_BREAK;

  while (remainingPasses > 0) {
    remainingPasses -= 1;

    const unstableCells: Array<[number, number]> = [];
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const cell = board[r]?.[c];
        if (cell && cell.count >= getCriticalMass(r, c, rows, cols)) {
          unstableCells.push([r, c]);
        }
      }
    }

    if (unstableCells.length === 0) {
      break;
    }

    for (const [unstableRow, unstableCol] of unstableCells) {
      const cell = board[unstableRow]?.[unstableCol];
      if (!cell || cell.count < getCriticalMass(unstableRow, unstableCol, rows, cols)) {
        continue;
      }

      const explodingOwner = cell.owner;
      if (explodingOwner === null) {
        continue;
      }

      const criticalMass = getCriticalMass(unstableRow, unstableCol, rows, cols);
      cell.count -= criticalMass;
      if (cell.count === 0) {
        cell.owner = null;
      }

      for (const [neighborRow, neighborCol] of getNeighbors(
        unstableRow,
        unstableCol,
        rows,
        cols
      )) {
        const neighbor = board[neighborRow]?.[neighborCol];
        if (!neighbor) {
          continue;
        }

        neighbor.count += 1;
        neighbor.owner = explodingOwner;
      }
    }
  }

  return board;
}

export function isEliminated(board: Board, playerIndex: PlayerIndex): boolean {
  return !board.some((row) => row.some((cell) => cell.owner === playerIndex));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const board = createBoard(3, 3);

  applyMove(board, 0, 0, 0, 3, 3);
  // Expected after the second move: (0,0) empties, (0,1) and (1,0) hold one orb.
  applyMove(board, 0, 0, 0, 3, 3);

  const cascadeBoard = createBoard(3, 3);
  applyMove(cascadeBoard, 0, 0, 0, 3, 3);
  applyMove(cascadeBoard, 0, 1, 0, 3, 3);
  applyMove(cascadeBoard, 1, 0, 0, 3, 3);
  applyMove(cascadeBoard, 0, 0, 0, 3, 3);

  console.log(JSON.stringify({ cornerExplosion: board, cascade: cascadeBoard }, null, 2));
}
