# T06 — Game & leaderboard integrity (started-gate + mode-gated scoring + ranked auth gate)

**Priority:** P0 · **Effort:** M–L · **Findings:** F-13 (High), F-14 (Medium) · **Depends on:** T04

**Files:** `backend/src/handlers/game.handlers.ts`, `backend/src/handlers/queue.handlers.ts`, `backend/src/handlers/room.handlers.ts`, `backend/src/db/repos/scores.ts`, `backend/src/types/game.ts`, `backend/src/constants/app.constants.ts`

> Read `backend/RULES.md`, `docs/plans/tasks/README.md`, findings F-13/F-14. Reference: `.claude/skills/security-review/references/business-logic.md` (workflow-bypass / state machine). Server is authoritative — keep all validation server-side.

## Context
Rooms form either from a filled queue bucket (`queue.handlers.ts`) or as private rooms (`room.handlers.ts`, always `casual`). `handleMove` (game.handlers.ts) validates turn/bounds/ownership, applies the move, runs elimination once `turnCount >= players.length`, then `getWinner` returns the sole survivor and `endGame` → `persistFinishedMatch` writes match history **and** `scoresRepo.applyMatchResult` (leaderboard points).

## Problem (F-13, F-14)
- **Farming (F-13):** a private room can be created with a single player; `handleMove` has no "game started" gate, so one move makes `turnCount(1) >= players.length(1)`, the lone creator "wins", and `applyMatchResult` runs. **There is no game-mode gate**, so `casual` and solo games update the ranked leaderboard. A `create_room`→`make_move` loop farms points (and DB writes) indefinitely. Two colluding accounts do the same in a private room.
- **Ranked gate (F-14):** `handleJoinQueue` never checks auth, so guests join ranked queues (docs say ranked requires login; `RANKED_REQUIRES_AUTH` message exists but is unused). A guest winning a ranked match skips persistence entirely, losing the authenticated losers' records.

## Do this
1. **Room state machine:** add a `status: "lobby" | "active" | "finished"` field to `Room` (`types/game.ts`); set `active` only when the room reaches its required player count (queue room: at creation since it's full; private room: in `handleJoinRoomByCode` when `players.length === maxPlayers`). `handleMove` returns early unless `room.status === "active"`. Run elimination/`getWinner` only while `active`. (This also requires ≥2 players before any win is possible.)
2. **Mode-gate scoring:** in `persistFinishedMatch`/`endGame`, gate `scoresRepo.applyMatchResult` (leaderboard points) to **`mode === "ranked"` with ≥2 distinct authenticated participants**. Casual/solo may still write match *history* but must **not** update `PlayerScore`. (Confirm `applyMatchResult` is only ever reached for ranked; add a guard in the repo too as defense-in-depth.)
3. **Ranked auth gate (F-14):** in `handleJoinQueue`, if `mode === "ranked"` and the connection identity is a guest (`connections.get(playerId)?.isGuest`), throw `ApiError(NOT_AUTHENTICATED, RANKED_REQUIRES_AUTH)`.
4. **Anti-farming velocity cap (defense-in-depth):** cap ranked-match completions per account per window (in-memory `Map`, constant in `app.constants.ts`); over the cap, persist history but skip scoring and log a `warn`.

## Out of scope
No wire/payload shape changes for existing messages (adding the internal `status` field to the server-side `Room` is fine — it is **not** sent to clients unless you also update the protocol + frontend, which is out of scope, so **don't** add it to broadcast payloads). No frontend.

## Acceptance criteria
- A solo private room cannot produce a win or any score/history write (move is ignored until ≥2 players and `active`).
- Casual and private (casual) games never change `PlayerScore`; only ranked games with ≥2 authenticated players do.
- Guests are rejected from the ranked queue with `not_authenticated`.
- Normal 2-player ranked and casual games still play and complete correctly.

## Verify
`cd backend && npm run build && npm run lint`. Manual: (a) create a private room alone, send `make_move` repeatedly → no win, no DB write, leaderboard unchanged; (b) play a 2-player casual game → history may write, leaderboard unchanged; (c) two authenticated accounts play a ranked game → leaderboard updates once; (d) guest `join_queue` with `mode:"ranked"` → `error: not_authenticated`.

## Commit message
```
fix(game): gate moves on started state and restrict scoring to ranked games
```
