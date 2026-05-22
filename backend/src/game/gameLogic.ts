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
  const neighbors: Array<[number, number]> = [];
  if (row > 0) neighbors.push([row - 1, col]);
  if (row < rows - 1) neighbors.push([row + 1, col]);
  if (col > 0) neighbors.push([row, col - 1]);
  if (col < cols - 1) neighbors.push([row, col + 1]);
  return neighbors;
}

export function getCriticalMass(
  row: number,
  col: number,
  rows: number,
  cols: number
): number {
  let mass = 4;
  if (row === 0 || row === rows - 1) mass -= 1;
  if (col === 0 || col === cols - 1) mass -= 1;
  return mass;
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

    for (let i = 0; i < unstableCells.length; i += 1) {
      const unstableRow = unstableCells[i]?.[0];
      const unstableCol = unstableCells[i]?.[1];
      if (unstableRow === undefined || unstableCol === undefined) {
        continue;
      }

      const cell = board[unstableRow]?.[unstableCol];
      const criticalMass = getCriticalMass(unstableRow, unstableCol, rows, cols);
      if (!cell || cell.count < criticalMass) {
        continue;
      }

      const explodingOwner = cell.owner;
      if (explodingOwner === null) {
        continue;
      }

      cell.count -= criticalMass;
      if (cell.count === 0) {
        cell.owner = null;
      }

      if (unstableRow > 0) {
        const neighbor = board[unstableRow - 1]?.[unstableCol];
        if (neighbor) {
          neighbor.count += 1;
          neighbor.owner = explodingOwner;
        }
      }
      if (unstableRow < rows - 1) {
        const neighbor = board[unstableRow + 1]?.[unstableCol];
        if (neighbor) {
          neighbor.count += 1;
          neighbor.owner = explodingOwner;
        }
      }
      if (unstableCol > 0) {
        const neighbor = board[unstableRow]?.[unstableCol - 1];
        if (neighbor) {
          neighbor.count += 1;
          neighbor.owner = explodingOwner;
        }
      }
      if (unstableCol < cols - 1) {
        const neighbor = board[unstableRow]?.[unstableCol + 1];
        if (neighbor) {
          neighbor.count += 1;
          neighbor.owner = explodingOwner;
        }
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
