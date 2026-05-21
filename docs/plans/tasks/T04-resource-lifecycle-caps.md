# T04 — Resource lifecycle & caps (reap abandoned rooms; cap rooms/queues)

**Priority:** P0 · **Effort:** M · **Findings:** F-08 (High), F-09 (High) · **Depends on:** T03

**Files:** `backend/src/handlers/game.handlers.ts`, `backend/src/handlers/queue.handlers.ts`, `backend/src/handlers/room.handlers.ts`, `backend/src/state/memory.ts`, `backend/src/constants/app.constants.ts`

> Read `backend/RULES.md`, `docs/plans/tasks/README.md`, and findings F-08/F-09. Note RULES.md invariant: **`playerRooms` and `rooms` must stay in sync**, and cleanup must remove every related entry.

## Context
Game state lives in in-memory `Map`s in `state/memory.ts` (`rooms`, `roomCodes`, `playerRooms`, `queues`, …). Rooms are deleted only in `endGame` (game.handlers.ts), which runs when exactly one player remains alive.

## Problem
- **F-08 (leak):** if the lone member of a room disconnects, `eliminateAndBroadcast` marks them eliminated and `getWinner` returns `null` (needs exactly 1 alive), so `endGame` never runs and the room + `inviteCode` + `playerRooms` entry leak forever. Loop `create_room` → disconnect to exhaust memory.
- **F-09:** no ceiling on number of rooms, queue-bucket size, or (pre-T03) connections.

## Do this
1. **Extract a `destroyRoom(room)` helper** (in game.handlers.ts) that deletes the room from `rooms`, its `inviteCode` from `roomCodes`, and every player's `playerRooms` entry. Use it in `endGame` (replacing the inline cleanup) **and** in `eliminateAndBroadcast` when **no players remain alive** (`alive.length === 0`).
2. **Periodic reaper:** a `setInterval` (e.g., 60s) that destroys rooms with **no connected sockets** (none of `room.players` present in the `players` map) and private rooms that have sat unfilled past a TTL (`ROOM_IDLE_TTL_MS`). Keep it simple and O(rooms). Provide a `start`/`stop` export so T07's graceful shutdown can `clearInterval` it.
3. **Caps (F-09):** add `LIMITS.MAX_ROOMS`, `LIMITS.MAX_QUEUE_SIZE`, `LIMITS.MAX_ROOMS_PER_IP` (optional), `ROOM_IDLE_TTL_MS` to `app.constants.ts`. Before creating a room (`createRoom` in queue.handlers, `handleCreateRoom` in room.handlers) check `rooms.size < MAX_ROOMS`; before pushing to a queue bucket check bucket length `< MAX_QUEUE_SIZE`. On breach, send a typed `ApiError` (add an `ERROR_CODES` entry like `server_busy` if needed; document it in `docs/PROTOCOL.md`).

## Out of scope
Connection caps (done in T03). No protocol payload-shape changes. No frontend.

## Acceptance criteria
- Creating a private room and disconnecting **does not** leave entries in `rooms`/`roomCodes`/`playerRooms`.
- The reaper removes rooms whose players are all disconnected, and unfilled private rooms past the TTL.
- Room creation past `MAX_ROOMS` and queue joins past `MAX_QUEUE_SIZE` are rejected with a typed error; normal play is unaffected.
- `playerRooms`/`rooms` stay in sync (no phantom rooms).

## Verify
`cd backend && npm run build && npm run lint`. Manual: create a private room, disconnect, confirm memory maps are clean (add a temporary debug log of `rooms.size` or inspect via a test). Play a normal 2-player game to completion and confirm cleanup still happens exactly once.

## Commit message
```
fix(state): reap abandoned rooms and cap rooms/queue size
```
