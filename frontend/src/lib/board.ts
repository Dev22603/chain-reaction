import type { Board } from "@/lib/types";

export function capacityFor(row: number, col: number, rows: number, cols: number) {
  const cornerRow = row === 0 || row === rows - 1;
  const cornerCol = col === 0 || col === cols - 1;
  if (cornerRow && cornerCol) return 2;
  if (cornerRow || cornerCol) return 3;
  return 4;
}

export interface BoardCellEffect {
  id: number;
  exploded: boolean;
  merged: boolean;
  takeover: boolean;
  previousCount: number;
  nextCount: number;
  previousOwner: number | null;
  nextOwner: number | null;
}

export interface BoardDiff {
  effects: Map<string, BoardCellEffect>;
  totalDelta: number;
  explodedCount: number;
  takeoverCount: number;
}

export function cellKey(row: number, col: number) {
  return `${row}-${col}`;
}

export interface NeighborDirection {
  rowDelta: number;
  colDelta: number;
}

export function neighborDirections(row: number, col: number, rows: number, cols: number): NeighborDirection[] {
  return [
    { rowDelta: -1, colDelta: 0 },
    { rowDelta: 1, colDelta: 0 },
    { rowDelta: 0, colDelta: -1 },
    { rowDelta: 0, colDelta: 1 }
  ].filter(({ rowDelta, colDelta }) => {
    const nextRow = row + rowDelta;
    const nextCol = col + colDelta;
    return nextRow >= 0 && nextRow < rows && nextCol >= 0 && nextCol < cols;
  });
}

export function diffBoards(
  prev: Board | null,
  next: Board,
  nextEffectId: () => number
): BoardDiff {
  const effects = new Map<string, BoardCellEffect>();
  let totalDelta = 0;
  let explodedCount = 0;
  let takeoverCount = 0;

  if (!prev) {
    return { effects, totalDelta, explodedCount, takeoverCount };
  }

  for (let r = 0; r < next.length; r += 1) {
    const row = next[r];
    const prevRow = prev[r];
    if (!prevRow) continue;
    for (let c = 0; c < row.length; c += 1) {
      const cur = row[c];
      const before = prevRow[c];
      if (!before) continue;

      const ownerChanged =
        before.owner !== null && cur.owner !== null && before.owner !== cur.owner;
      const cleared = before.count > 0 && cur.count === 0;
      const dropped = cur.count < before.count;
      const merged = cur.owner !== null && cur.count > before.count;
      const exploded = cleared || (dropped && before.count >= 2);
      const takeover = ownerChanged && !exploded;

      if (exploded || merged || takeover) {
        effects.set(cellKey(r, c), {
          id: nextEffectId(),
          exploded,
          merged,
          takeover,
          previousCount: before.count,
          nextCount: cur.count,
          previousOwner: before.owner,
          nextOwner: cur.owner
        });
        if (exploded) explodedCount += 1;
        if (takeover) takeoverCount += 1;
      }

      totalDelta += Math.abs(cur.count - before.count);
    }
  }

  return { effects, totalDelta, explodedCount, takeoverCount };
}

export function tallyOrbs(board: Board, playerCount: number): number[] {
  const counts = new Array<number>(playerCount).fill(0);
  for (const row of board) {
    for (const cell of row) {
      if (cell.owner !== null && counts[cell.owner] !== undefined) {
        counts[cell.owner] += cell.count;
      }
    }
  }
  return counts;
}
