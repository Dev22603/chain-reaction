import { LIMITS } from "../constants/app.constants.js";
import type { Board, Cell, PlayerIndex } from "../types/game.js";

export function createBoard(rows: number, cols: number): Board {
	return Array.from({ length: rows }, () => Array.from({ length: cols }, (): Cell => ({ owner: null, count: 0 })));
}

export function getNeighbors(row: number, col: number, rows: number, cols: number): Array<[number, number]> {
	// Optimization: Avoid intermediate array allocations and .filter in hot loops
	// by directly pushing valid neighbors based on boundary checks.
	const neighbors: Array<[number, number]> = [];
	if (row > 0) neighbors.push([row - 1, col]);
	if (row < rows - 1) neighbors.push([row + 1, col]);
	if (col > 0) neighbors.push([row, col - 1]);
	if (col < cols - 1) neighbors.push([row, col + 1]);
	return neighbors;
}

export function getCriticalMass(row: number, col: number, rows: number, cols: number): number {
	// Optimization: Calculate critical mass additively from 0 based on boundary checks
	// to avoid allocating neighbor arrays in the applyMove hot loop.
	let mass = 0;
	if (row > 0) mass += 1;
	if (row < rows - 1) mass += 1;
	if (col > 0) mass += 1;
	if (col < cols - 1) mass += 1;
	return mass;
}

export function applyMove(board: Board, row: number, col: number, playerIndex: PlayerIndex, rows: number, cols: number): Board {
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

			for (const [neighborRow, neighborCol] of getNeighbors(unstableRow, unstableCol, rows, cols)) {
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
