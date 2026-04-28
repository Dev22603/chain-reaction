# PLAN.md

## Product

Build a browser-based multiplayer Chain Reaction game with a Next.js frontend and a Node.js + TypeScript WebSocket backend. The backend is authoritative for all game state. The frontend owns presentation, phase state, and player intent only.

## Graphify Context Used

This plan is based on the existing `graphify-out` graph and the documentation corpus. The graph report identifies the following core abstractions as the most connected and highest-risk parts of the system:

- `useGameWebSocket Hook (state ownership)`
- `applyMove() function`
- `In-Memory State Maps (players/queues/rooms/playerRooms)`
- `Backend Layering Convention`
- `Connection-to-Cleanup Lifecycle`
- `Rule: Server Authority`
- `Message Validation Pipeline`

The build order below follows those graph hubs. Pure rules come first, then authoritative backend state, then protocol, then frontend rendering, then full manual multiplayer verification.

## Architecture

### Runtime Pieces

- `backend/`: Node.js, TypeScript, `ws`, Zod, Winston, dotenv, UUID generation.
- `frontend/`: Next.js, React, TypeScript, client-side WebSocket hook, presentational components.
- `docs/`: living implementation guide and verification notes.
- `graphify-out/`: knowledge graph output used as planning and navigation context.

### Backend Boundary

The backend owns:

- Connection identity.
- Queue membership.
- Room creation.
- Turn validation.
- Chain reaction simulation.
- Elimination and win detection.
- Broadcasts to players.
- Cleanup on leave, disconnect, and game over.

The backend does not use a database before post-M7. Live state is stored in module-level Maps:

- `players`: `playerId -> WebSocket`
- `queues`: queue bucket key -> queued players
- `rooms`: `roomId -> Room`
- `playerRooms`: `playerId -> roomId`

### Frontend Boundary

The frontend owns:

- Phase machine: `lobby`, `queued`, `playing`, `gameover`.
- WebSocket connection lifecycle from the user perspective.
- Lobby form inputs.
- Board rendering.
- Legal-click affordances.
- Error display.
- Local reset after game over.

The frontend never computes the next board.

## Milestones

### M0: Repository Scaffolding

Goal: Create a runnable monorepo shape without product behavior.

Deliverables:

- Root workspace scripts.
- `backend/package.json`, `tsconfig.json`, `.env.example`, `.gitignore`.
- `frontend/package.json`, `tsconfig.json`, Next config, app shell.
- Shared documentation references in `docs/TODO.md` and this plan.

Exit criteria:

- Backend can typecheck once dependencies are installed.
- Frontend can typecheck once dependencies are installed.
- Directory structure matches `docs/ARCHITECTURE.md`.

### M1: Pure Game Logic

Goal: Implement the Chain Reaction rules in a pure backend module.

Deliverables:

- `backend/src/types/game.ts`
- `backend/src/game/gameLogic.ts`
- Standalone smoke guard runnable by `npm run smoke:logic`.

Exit criteria:

- `createBoard` creates a rectangular empty board.
- `getCriticalMass` returns 2, 3, or 4 by position.
- `getNeighbors` returns in-bounds orthogonal cells only.
- `applyMove` handles simple moves, ownership transfer, and cascades.
- `isEliminated` is deterministic.

### M2: Backend Infrastructure

Goal: Bring up the WebSocket backend with validation, logging, constants, and dispatch.

Deliverables:

- `backend/src/index.ts`
- `backend/src/app.ts`
- `backend/src/router.ts`
- `backend/src/constants/app.constants.ts`
- `backend/src/constants/app.messages.ts`
- `backend/src/constants/config.ts`
- `backend/src/lib/logger.ts`
- `backend/src/utils/api_error.ts`
- `backend/src/utils/broadcast.ts`
- `backend/src/schemas/messages.schemas.ts`
- `backend/src/types/protocol.ts`

Exit criteria:

- Server listens on configured port.
- Each connection receives `connected`.
- Malformed JSON is dropped.
- Unknown messages are ignored.
- Invalid known messages return `error`.

### M3: Queue and Room Creation

Goal: Allow players with compatible settings to join a queue and start a room.

Deliverables:

- `backend/src/state/memory.ts`
- `backend/src/handlers/queue.handlers.ts`
- Queue bucket key: `gridRows x gridCols x maxPlayers`.
- `join_queue` and `leave_queue`.
- `game_start` broadcast when a bucket fills.

Exit criteria:

- Single player receives `queued`.
- Cancel removes the player from the correct bucket.
- Full bucket creates one room and clears queued players.
- `playerRooms` maps every player in the room.

### M4: Move Handling and Turn Flow

Goal: Play a server-authoritative game from first move through winner.

Deliverables:

- `backend/src/handlers/game.handlers.ts`
- `make_move`
- `leave_game`
- `advanceTurn`
- elimination grace period.
- room cleanup after `game_over`.

Exit criteria:

- Wrong turn is ignored.
- Out-of-bounds moves are ignored.
- Opponent-owned cells are ignored.
- Accepted moves broadcast `game_state`.
- Eliminated players are skipped.
- Winner receives `game_over`.

### M5: Frontend Foundation

Goal: Build the client-side protocol and phase machine.

Deliverables:

- `frontend/src/lib/types.ts`
- `frontend/src/lib/colors.ts`
- `frontend/src/hooks/useGameWebSocket.ts`
- `frontend/src/app/page.tsx`

Exit criteria:

- Client connects and stores `playerId`.
- `joinQueue` sends the documented frame.
- `queued`, `game_start`, `game_state`, `game_over`, and `error` are handled.
- `reset` returns to `lobby` locally.

### M6: Frontend Screens

Goal: Make the game usable end to end in the browser.

Deliverables:

- `Lobby.tsx`
- `QueueScreen.tsx`
- `GameBoard.tsx`
- `GameOver.tsx`
- Basic responsive styling.
- Legal-click disabled states.

Exit criteria:

- Two browser windows can join the same queue.
- The board renders accurately from server state.
- Only the current player can click legal cells.
- Game over screen shows winner and play-again path.

### M7: Manual Verification and Polish

Goal: Prove the real-time flow works under normal and edge-case conditions.

Deliverables:

- Manual test checklist run and recorded in `docs/TODO.md`.
- Lint and typecheck scripts pass.
- Smoke logic command passes.
- Developer run instructions are accurate.

Exit criteria:

- Fresh clone can install, run backend, run frontend, and play a two-player game.
- Disconnect cleanup does not leave phantom queue entries or rooms.
- No protocol drift between docs, backend types, and frontend types.

### Post-M7

Deferred:

- Auth.
- Persistence.
- Reconnection.
- Spectators.
- Private rooms.
- Ranking.
- Formal test framework.
- Mobile-specific polish.
- Deployment automation.

## Build Strategy

1. Implement high-risk pure logic first because every later feature depends on it.
2. Keep protocol types mirrored exactly between backend and frontend.
3. Validate all client messages at the backend boundary with Zod.
4. Keep handlers responsible for business state, not routers.
5. Keep frontend components dumb and prop-driven.
6. Verify each milestone with the lightest possible command or manual flow before moving on.

## Risk Register

| Risk | Where It Shows Up | Mitigation |
|---|---|---|
| Protocol drift | `PROTOCOL.md`, backend types, frontend types | Update all three together |
| Infinite cascade loop | `applyMove` | Safety counter plus smoke case |
| Wrong ownership during cascade | `applyMove` | Use exploding cell owner at explosion time |
| Stuck turn after elimination | `advanceTurn` | Skip eliminated players and test leave flow |
| Phantom room or queue entries | cleanup handlers | Centralize cleanup through handlers |
| Stale board rendering | React state updates | Replace `gameState` object from messages |
| Hidden invalid client payloads | router | Zod at boundary, `ApiError` response |

## Verification Commands

Backend:

```bash
cd backend
npm install
npm run smoke:logic
npm run build
npm run lint
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run build
npm run lint
npm run dev
```

Manual:

```text
1. Open two browser windows.
2. Enter different player names.
3. Choose the same board size and player count.
4. Join queue from both windows.
5. Confirm both enter the same game.
6. Make legal moves in turn order.
7. Attempt illegal moves and confirm no board change.
8. Trigger a corner explosion.
9. Continue until one player wins.
10. Confirm game over and room cleanup.
```
