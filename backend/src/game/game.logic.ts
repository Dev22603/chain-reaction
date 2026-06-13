import { LIMITS } from "../constants/app.constants";

// Pure chain-reaction board logic. No I/O, no logging, no state maps —
// everything operates on the board passed in.

export type PlayerIndex = number;

export interface Cell {
	owner: PlayerIndex | null;
	count: number;
}

export type Board = Cell[][];

export function createBoard(rows: number, cols: number): Board {
	return Array.from({ length: rows }, () => Array.from({ length: cols }, (): Cell => ({ owner: null, count: 0 })));
}

// ⚡ Bolt: Using direct `.push()` based on mathematical bounds avoids the
// memory allocation overhead of creating the 4-element `candidates` array
// and the higher-order `.filter()` function in hot simulation paths.
export function getNeighbors(row: number, col: number, rows: number, cols: number): Array<[number, number]> {
	const neighbors: Array<[number, number]> = [];
	if (row > 0) neighbors.push([row - 1, col]);
	if (row < rows - 1) neighbors.push([row + 1, col]);
	if (col > 0) neighbors.push([row, col - 1]);
	if (col < cols - 1) neighbors.push([row, col + 1]);
	return neighbors;
}

// ⚡ Bolt: Calculating mass additively (from 0) via boundary checks
// correctly models multi-boundary touching (e.g. 1xN boards) and avoids
// the heavy overhead of creating a neighbor array just to count its length.
export function getCriticalMass(row: number, col: number, rows: number, cols: number): number {
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

		// ⚡ Bolt: Using classic `for` loops rather than `for...of` in this hot loop
		// eliminates iterator allocation overhead during complex chain reactions.
		for (let i = 0; i < unstableCells.length; i++) {
			const unstableRow = unstableCells[i][0];
			const unstableCol = unstableCells[i][1];
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

			const neighbors = getNeighbors(unstableRow, unstableCol, rows, cols);
			for (let j = 0; j < neighbors.length; j++) {
				const neighborRow = neighbors[j][0];
				const neighborCol = neighbors[j][1];
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
