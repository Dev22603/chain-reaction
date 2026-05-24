// game.jsx — pure game state + reducer-ish helpers.
// Exposed as window.GameEngine for app.jsx to consume.

const PLAYER_COLORS = ["#ff3b6b", "#2ad8ff", "#ffd23f", "#5cff9b", "#ff3da7", "#ff6b1f", "#b6ff3c", "#ffa039"];
const PLAYER_NAMES = ["Reactor I", "Reactor II", "Reactor III", "Reactor IV", "Reactor V", "Reactor VI", "Reactor VII", "Reactor VIII"];
window.PLAYER_COLORS = PLAYER_COLORS;
window.PLAYER_NAMES = PLAYER_NAMES;

function makeBoard(rows, cols) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ count: 0, owner: null }))
  );
}

function neighbors(r, c, rows, cols) {
  const out = [];
  if (r > 0) out.push({ row: r - 1, col: c, dx: 0, dy: -1 });
  if (r < rows - 1) out.push({ row: r + 1, col: c, dx: 0, dy: 1 });
  if (c > 0) out.push({ row: r, col: c - 1, dx: -1, dy: 0 });
  if (c < cols - 1) out.push({ row: r, col: c + 1, dx: 1, dy: 0 });
  return out;
}

function capacity(r, c, rows, cols) {
  return neighbors(r, c, rows, cols).length;
}

function tallyOrbs(board, nPlayers) {
  const counts = new Array(nPlayers).fill(0);
  for (const row of board) {
    for (const cell of row) {
      if (cell.owner !== null) counts[cell.owner] += cell.count;
    }
  }
  return counts;
}

// Apply a single click: place an orb, then resolve cascades in steps.
// Returns { steps: [{events, board}], finalBoard, eliminated: Set<int> }
function planMove(board, rows, cols, player) {
  // We assume the click is legal — caller checked.
  // First, mutate a deep copy.
  const cloned = board.map((row) => row.map((c) => ({ ...c })));
  return cloned;
}

function deepCloneBoard(b) {
  return b.map((row) => row.map((c) => ({ ...c })));
}

// Resolve the cascade starting from initial board (after placing 1 orb).
// Yields one "step" at a time so the caller can animate.
async function* resolveCascade(board, rows, cols, player) {
  const out = deepCloneBoard(board);
  let step = 0;
  let totalExploded = 0;
  let totalTaken = 0;

  while (true) {
    // Identify all cells currently >= capacity
    const exploding = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cap = capacity(r, c, rows, cols);
        if (out[r][c].count >= cap) {
          exploding.push({ row: r, col: c, cap });
        }
      }
    }

    if (exploding.length === 0) {
      yield { kind: "done", board: out, totalExploded, totalTaken };
      return;
    }

    // Build effects: explode events + catch events
    const effects = [];
    const captureRecord = new Map(); // key -> color for catch flashes

    // Snapshot dirs first (since multiple exploding cells happen simultaneously)
    for (const { row, col, cap } of exploding) {
      const nbs = neighbors(row, col, rows, cols);
      effects.push({
        id: `ex-${step}-${row}-${col}`,
        type: "explode",
        row, col,
        color: PLAYER_COLORS[player],
        dirs: nbs.map((n) => ({ dx: n.dx, dy: n.dy })),
      });
      out[row][col].count -= cap;
      if (out[row][col].count === 0) out[row][col].owner = null;
      for (const n of nbs) {
        const prevOwner = out[n.row][n.col].owner;
        if (prevOwner !== null && prevOwner !== player) {
          totalTaken += 1;
        }
        out[n.row][n.col].count += 1;
        out[n.row][n.col].owner = player;
        captureRecord.set(`${n.row}-${n.col}`, PLAYER_COLORS[player]);
      }
      totalExploded += 1;
    }

    // Catch effects (slightly delayed visually so they read as arrival)
    for (const [key, color] of captureRecord) {
      const [r, c] = key.split("-").map(Number);
      effects.push({
        id: `catch-${step}-${r}-${c}`,
        type: "catch",
        row: r, col: c,
        color,
      });
    }

    yield { kind: "step", board: deepCloneBoard(out), effects, exploded: exploding.length };
    step += 1;
    // Safety cap
    if (step > 200) {
      yield { kind: "done", board: out, totalExploded, totalTaken };
      return;
    }
  }
}

// Check player elimination: a player is "in" if they have at least one orb,
// OR they have not yet had their first turn.
function computeEliminated(board, players, moveCounts) {
  const counts = tallyOrbs(board, players.length);
  const elim = new Set();
  players.forEach((p, i) => {
    if (p.eliminated) { elim.add(i); return; }
    if (moveCounts[i] > 0 && counts[i] === 0) {
      elim.add(i);
    }
  });
  return elim;
}

function nextTurn(currentTurn, players) {
  const n = players.length;
  for (let i = 1; i <= n; i++) {
    const idx = (currentTurn + i) % n;
    if (!players[idx].eliminated) return idx;
  }
  return currentTurn;
}

function checkWinner(players) {
  const live = players.filter((p) => !p.eliminated);
  if (live.length === 1) {
    return players.indexOf(live[0]);
  }
  return null;
}

// ─── AI: simple greedy ────────────────────────────────────────────────
function aiPickMove(board, rows, cols, player) {
  const legal = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c];
      if (cell.owner === null || cell.owner === player) {
        legal.push({ r, c, cell });
      }
    }
  }
  if (legal.length === 0) return null;

  // Score: prefer cells about to explode that are ours, then attacks adjacent to enemy critical,
  // then high-count own cells, then random.
  const scored = legal.map(({ r, c, cell }) => {
    const cap = capacity(r, c, rows, cols);
    let score = 0;
    // Own cells about to chain
    if (cell.owner === player && cell.count >= cap - 1) score += 40 + cell.count * 2;
    // Avoid placing next to enemy that's one orb from popping (we'd give them a chain target)
    const nbs = neighbors(r, c, rows, cols);
    for (const n of nbs) {
      const nb = board[n.row][n.col];
      if (nb.owner !== null && nb.owner !== player) {
        const ncap = capacity(n.row, n.col, rows, cols);
        if (nb.count >= ncap - 1) score -= 25; // dangerous neighbor
        else score -= 5;
      }
    }
    // Slight preference for corners and edges
    if (cap === 2) score += 4;
    else if (cap === 3) score += 1;
    // Mild build-up
    if (cell.owner === player) score += cell.count * 1.5;
    // Empty cells get small base
    if (cell.owner === null) score += 2;
    // jitter
    score += Math.random() * 3;
    return { r, c, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return { row: scored[0].r, col: scored[0].c };
}

window.GameEngine = {
  makeBoard,
  neighbors,
  capacity,
  tallyOrbs,
  deepCloneBoard,
  resolveCascade,
  computeEliminated,
  nextTurn,
  checkWinner,
  aiPickMove,
};
