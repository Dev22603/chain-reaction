# GAME_LOGIC.md

## When to read this

You're touching `backend/src/game/gameLogic.ts`, changing chain reaction rules, critical mass, elimination timing, or the cascading-explosion loop.

## Purity rule

`gameLogic.ts` is a pure module. It must not import from `ws`, `http`, `fs`, `state/`, `handlers/`, `lib/`, `db/`, or any DB client. Inputs in, mutated or returned state out. See `RULES.md`.

This is why: the same functions run during standalone smoke testing (`npm run smoke:logic`), inside the server, and eventually in server-side replay or AI opponents. Any I/O breaks that.

## Game rules

Chain Reaction is played on a rectangular grid. Each cell has a **count** of orbs and an **owner** (a player index, or `null` if empty).

### Moves

On your turn you click any cell that is either empty or already owned by you. That adds 1 orb and claims ownership.

You cannot click a cell owned by another player.

### Critical mass

Every cell has a critical mass equal to its number of orthogonal neighbors:

- Corner cells: **2**
- Edge cells: **3**
- Interior cells: **4**

When a cell's count reaches or exceeds its critical mass, it **explodes**: count decreases by the critical mass, and one orb goes to each orthogonal neighbor. Ownership of the orbs that spread into neighbors is the exploding player's.

Explosions cascade. A neighbor pushed over its own critical mass explodes too, which may push further neighbors over, and so on. The board settles when no cell is over critical.

### Ownership transfer

When an orb lands in a neighboring cell, that neighbor becomes owned by the exploding cell's owner, regardless of prior ownership. This is how players capture opponents' territory.

### Elimination

A player is eliminated when they own zero cells on the board.

**Important**: the elimination check runs only **after every player has had at least one turn**. Grace period. The board starts empty, so "own zero cells" is trivially true for everyone before round 1.

Implementation: `if (room.turnCount >= room.players.length)` before running `isEliminated(board, i)` for each player.

### Win condition

Exactly one player remains not eliminated. That player wins.

## API

All five functions live in `backend/src/game/gameLogic.ts`. Types are imported from `../types/game.ts`.

### `createBoard(rows, cols): Board`

Returns a `rows × cols` 2D array. Each cell is `{ owner: null, count: 0 }`.

### `getCriticalMass(r, c, rows, cols): number`

Returns `2` for corners, `3` for edges, `4` for interior cells. Equivalent to counting in-bounds orthogonal neighbors.

### `getNeighbors(r, c, rows, cols): Array<[number, number]>`

Returns an array of `[r, c]` pairs for the 4 cardinal directions, filtered to those actually on the board.

### `applyMove(board, r, c, playerIndex, rows, cols): Board`

1. `board[r][c].count += 1; board[r][c].owner = playerIndex`.
2. Loop with a safety counter initialized to `LIMITS.SAFETY_BREAK` (2000):
   - Collect every `(r, c)` where `count >= getCriticalMass(...)`.
   - If none, break.
   - For each unstable cell: subtract its critical mass from its count. If the count is now `0`, set `owner` back to `null`. For each neighbor, `count += 1` and `owner = playerIndex`.
3. Return the mutated `board`.

The safety counter exists so a logic bug doesn't turn into an infinite loop that hangs the server. On a correct implementation it should never fire. Log if it does.

### `isEliminated(board, playerIndex): boolean`

Returns `true` if no cell on the board has `owner === playerIndex`, else `false`.

## Standalone smoke test

The bottom of `gameLogic.ts` has a guarded block:

```ts
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const b = createBoard(3, 3);
  applyMove(b, 0, 0, 0, 3, 3);
  applyMove(b, 0, 0, 0, 3, 3); // corner explodes at count 2
  console.log(JSON.stringify(b, null, 2));
}
```

Run with `npm run smoke:logic` (which invokes `tsx src/game/gameLogic.ts`). Expected: `(0,0)` empty, `(0,1)` and `(1,0)` each hold 1 orb owned by player 0.

`RULES.md` requires that every bug fix here appends a new reproducing case to this block.

## Invariants

- **Neighbor iteration stays in bounds.** All out-of-bounds `(r, c)` are filtered in `getNeighbors`; nothing downstream should assume otherwise.
- **Ownership propagates strictly from the exploding cell's owner at explosion time.** Don't use the "player who made the move" as a shortcut. During a cascade, ownership can change hands mid-loop.
- **After a cell explodes to `count === 0`, its `owner` becomes `null`.** A count-zero cell with a non-null owner is an inconsistent state.
- **The elimination check is idempotent.** Running it twice in a row on the same board must produce the same result.

## Non-rules (things we deliberately don't do)

- No special rules for first move (beyond the elimination grace period).
- No per-cell cooldowns or undo.
- No rule variations by grid size. 3×3 plays the same as 20×20.

If you add a variant rule, it goes behind a flag and is documented here.
