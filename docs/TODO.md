# TODO.md

## Status Key

- `[ ]` Not started
- `[~]` In progress
- `[x]` Done
- `[!]` Blocked or needs review

## M0: Repository Scaffolding

### M0.1 Root Shape

- [x] Read graphify graph report and identify core build hubs.
- [x] Read existing docs for backend, frontend, game logic, protocol, rules, errors, and conventions.
- [x] Create `docs/PLAN.md`.
- [x] Create `docs/TODO.md`.
- [x] Create root `package.json` with workspace scripts.
- [x] Create or update root `.gitignore`.
- [x] Confirm generated folders such as `node_modules`, `.next`, `dist`, `.env`, and logs are ignored.
- [ ] Add root `README.md` or update existing entry docs if needed.

### M0.2 Backend Scaffold

- [x] Create `backend/`.
- [x] Create `backend/package.json`.
- [x] Add backend scripts: `dev`, `build`, `start`, `smoke:logic`, `lint`.
- [x] Add backend runtime dependencies: `ws`, `uuid`, `zod`, `dotenv`, `winston`.
- [x] Add backend dev dependencies: `typescript`, `tsx`, `eslint`, TypeScript ESLint packages, `@types/node`, `@types/ws`, `@types/uuid`.
- [x] Create `backend/tsconfig.json`.
- [x] Create `backend/.env.example`.
- [x] Create `backend/.gitignore`.
- [x] Create `backend/src/` directory.
- [x] Create backend source folders: `constants`, `game`, `handlers`, `lib`, `schemas`, `state`, `types`, `utils`.

### M0.3 Frontend Scaffold

- [x] Create `frontend/`.
- [x] Create `frontend/package.json`.
- [x] Add frontend scripts: `dev`, `build`, `start`, `lint`.
- [x] Add frontend dependencies: `next`, `react`, `react-dom`, `lucide-react`.
- [x] Add frontend dev dependencies: `typescript`, `eslint`, Next ESLint config, `@types/node`, `@types/react`, `@types/react-dom`.
- [x] Create `frontend/tsconfig.json`.
- [x] Create `frontend/next.config.ts`.
- [x] Create `frontend/src/app/`.
- [x] Create `frontend/src/components/`.
- [x] Create `frontend/src/hooks/`.
- [x] Create `frontend/src/lib/`.

## M1: Pure Game Logic

### M1.1 Domain Types

- [x] Create `backend/src/types/game.ts`.
- [x] Define `PlayerId` as `string`.
- [x] Define `PlayerIndex` as `number`.
- [x] Define `Cell` with `owner: number | null` and `count: number`.
- [x] Define `Board` as `Cell[][]`.
- [x] Define `Player` with `id`, `name`, and `eliminated`.
- [x] Define `Room` with `id`, `players`, `gridRows`, `gridCols`, `board`, `currentTurn`, and `turnCount`.
- [x] Ensure the `Room` shape matches `docs/ARCHITECTURE.md`.

### M1.2 Constants Needed by Logic

- [x] Create `backend/src/constants/app.constants.ts`.
- [x] Add `LIMITS.GRID_MIN = 3`.
- [x] Add `LIMITS.GRID_MAX = 20`.
- [x] Add `LIMITS.PLAYERS_MIN = 2`.
- [x] Add `LIMITS.PLAYERS_MAX = 4`.
- [x] Add `LIMITS.SAFETY_BREAK = 2000`.
- [x] Add `MESSAGE_TYPES` for every protocol frame.
- [x] Add `ERROR_CODES` from `docs/ERRORS.md`.

### M1.3 Board Creation

- [x] Create `backend/src/game/gameLogic.ts`.
- [x] Implement `createBoard(rows, cols)`.
- [x] Ensure every row is a separate array.
- [x] Ensure every cell is a separate object.
- [x] Ensure every new cell has `owner: null`.
- [x] Ensure every new cell has `count: 0`.
- [x] Smoke-check a `3x3` board.

### M1.4 Critical Mass

- [x] Implement `getCriticalMass(r, c, rows, cols)`.
- [x] Use neighbor count as the source of truth.
- [x] Confirm corners return `2`.
- [x] Confirm non-corner edges return `3`.
- [x] Confirm interiors return `4`.
- [x] Confirm tiny valid boards such as `3x3` work.

### M1.5 Neighbor Lookup

- [x] Implement `getNeighbors(r, c, rows, cols)`.
- [x] Use four cardinal directions only.
- [x] Filter negative row indexes.
- [x] Filter negative column indexes.
- [x] Filter row indexes greater than or equal to `rows`.
- [x] Filter column indexes greater than or equal to `cols`.
- [x] Confirm corner returns two neighbors.
- [x] Confirm edge returns three neighbors.
- [x] Confirm interior returns four neighbors.

### M1.6 Move Application

- [x] Implement `applyMove(board, r, c, playerIndex, rows, cols)`.
- [x] Increment the selected cell count by one.
- [x] Set selected cell owner to `playerIndex`.
- [x] Loop until no cell is unstable.
- [x] Collect unstable cells with `count >= criticalMass`.
- [x] Capture exploding cell owner before mutating neighbors.
- [x] Subtract critical mass from exploding cell.
- [x] Clear exploding cell owner when count becomes zero.
- [x] Keep exploding cell owner when count remains above zero.
- [x] Add one orb to each neighbor.
- [x] Transfer neighbor ownership to the exploding owner.
- [x] Continue cascading until settled.
- [x] Decrement safety counter each cascade pass.
- [x] Stop if safety counter reaches zero.
- [x] Avoid importing logger into `gameLogic.ts`.

### M1.7 Elimination

- [x] Implement `isEliminated(board, playerIndex)`.
- [x] Return `true` only when no cell belongs to the player.
- [x] Return `false` as soon as a matching owner is found.
- [x] Keep the function deterministic and side-effect free.

### M1.8 Smoke Guard

- [x] Add `process.argv[1]` guard at the bottom of `gameLogic.ts`.
- [x] Create a `3x3` board.
- [x] Apply two moves at `(0, 0)` for player `0`.
- [x] Print the resulting board as JSON.
- [x] Include expected comments for corner explosion.
- [ ] Add at least one cascade demonstration if concise.
- [ ] Ensure `npm run smoke:logic` points at this file.

## M2: Backend Infrastructure

### M2.1 Config

- [x] Create `backend/src/constants/config.ts`.
- [x] Load `.env` with dotenv.
- [x] Read `PORT`.
- [x] Default `PORT` to `8080`.
- [x] Export a typed `config` object.
- [x] Avoid reading `process.env` outside config.

### M2.2 Logger

- [x] Create `backend/src/lib/logger.ts`.
- [x] Configure Winston console transport.
- [x] Include timestamp.
- [x] Include level.
- [x] Include message.
- [x] Support structured metadata.
- [x] Export `getLogger(name)`.

### M2.3 Error Utility

- [x] Create `backend/src/utils/api_error.ts`.
- [x] Implement `ApiError`.
- [x] Store `code`.
- [x] Store user-safe `message`.
- [x] Store `errors: string[]`.
- [x] Preserve stack trace.

### M2.4 Broadcast Utility

- [x] Create `backend/src/utils/broadcast.ts`.
- [x] Implement `send(socket, data)`.
- [x] Stringify one message object per frame.
- [x] Guard closed sockets.
- [x] Implement `broadcast(room, message)`.
- [x] Lookup sockets from `players`.
- [x] Skip missing sockets.
- [x] Avoid throwing for missing disconnected players.

### M2.5 Protocol Types

- [x] Create `backend/src/types/protocol.ts`.
- [x] Define `JoinQueueMessage`.
- [x] Define `LeaveQueueMessage`.
- [x] Define `MakeMoveMessage`.
- [x] Define `LeaveGameMessage`.
- [x] Define `ConnectedMessage`.
- [x] Define `QueuedMessage`.
- [x] Define `GameStartMessage`.
- [x] Define `GameStateMessage`.
- [x] Define `GameOverMessage`.
- [x] Define `ErrorMessage`.
- [x] Export `ClientMessage` union.
- [x] Export `ServerMessage` union.
- [x] Keep examples aligned with `docs/PROTOCOL.md`.

### M2.6 Zod Schemas

- [x] Create `backend/src/schemas/messages.schemas.ts`.
- [x] Add `JoinQueueSchema`.
- [x] Enforce integer grid rows.
- [x] Enforce grid rows between 3 and 20.
- [x] Enforce integer grid columns.
- [x] Enforce grid columns between 3 and 20.
- [x] Enforce `maxPlayers` between 2 and 4.
- [x] Trim `playerName`.
- [x] Enforce non-empty `playerName`.
- [x] Enforce max player name length.
- [x] Add `LeaveQueueSchema`.
- [x] Add `MakeMoveSchema`.
- [x] Enforce integer row and column.
- [x] Add `LeaveGameSchema`.
- [x] Add `validateMessage(parsed)`.
- [x] Throw `ApiError("validation_failed", ...)` on schema mismatch.
- [x] Return typed client message on success.

### M2.7 Router

- [x] Create `backend/src/router.ts`.
- [x] Parse raw WebSocket frames in `try/catch`.
- [x] Drop malformed JSON silently.
- [x] Validate known message shapes.
- [x] Dispatch `join_queue` to queue handler.
- [x] Dispatch `leave_queue` to queue handler.
- [x] Dispatch `make_move` to game handler.
- [x] Dispatch `leave_game` to game handler.
- [x] Drop unknown types silently.
- [x] Catch `ApiError`.
- [x] Send per-socket `error` frame for `ApiError`.
- [x] Log and send generic `internal_error` for unknown exceptions.
- [x] Keep router free of game state mutation.

### M2.8 Server Entry

- [x] Create `backend/src/app.ts`.
- [x] Create an HTTP server.
- [x] Create a `WebSocketServer`.
- [x] Generate UUID for each connection.
- [x] Store socket in `players`.
- [x] Send `connected`.
- [x] Wire `message` event to router.
- [x] Wire `close` event to cleanup.
- [ ] Handle `SIGTERM` later in deployment milestone.
- [x] Create `backend/src/index.ts`.
- [x] Start listening on `config.PORT`.

## M3: Queue and Room Creation

### M3.1 Memory State

- [x] Create `backend/src/state/memory.ts`.
- [x] Export `players`.
- [x] Export `queues`.
- [x] Export `rooms`.
- [x] Export `playerRooms`.
- [x] Type every Map explicitly.
- [x] Avoid storing duplicate room state elsewhere.

### M3.2 Queue Key

- [x] Implement a queue key helper.
- [x] Include `gridRows`.
- [x] Include `gridCols`.
- [x] Include `maxPlayers`.
- [x] Keep key stable and collision-free.
- [x] Keep key generation colocated with queue handler.

### M3.3 Join Queue

- [x] Implement `handleJoinQueue(playerId, payload)`.
- [x] Remove player from existing queue before joining a new one.
- [x] Create queue bucket when missing.
- [x] Push `{ id, name, eliminated: false }`.
- [x] Send `queued` with 1-indexed position.
- [x] Start game when bucket length reaches `maxPlayers`.
- [x] Slice exactly `maxPlayers` players into the room.
- [x] Leave overflow players in the bucket if ever present.
- [x] Create room id.
- [x] Create board with requested dimensions.
- [x] Set `currentTurn = 0`.
- [x] Set `turnCount = 0`.
- [x] Map each player id to room id.
- [x] Broadcast `game_start`.
- [x] Broadcast initial `game_state` if needed by frontend.

### M3.4 Leave Queue

- [x] Implement `handleLeaveQueue(playerId)`.
- [x] Search all buckets.
- [x] Remove matching player.
- [x] Re-send updated positions to remaining queued players if needed.
- [x] Delete empty buckets.
- [x] Treat missing player as no-op.

## M4: Game Handlers

### M4.1 Move Validation

- [x] Implement `handleMove(playerId, payload)`.
- [x] Resolve room id from `playerRooms`.
- [x] Drop if no room id.
- [x] Resolve room from `rooms`.
- [x] Drop if missing room.
- [x] Drop if current turn player id differs from `playerId`.
- [x] Drop if row is out of bounds.
- [x] Drop if column is out of bounds.
- [x] Drop if target cell is owned by another player.
- [x] Allow empty cell.
- [x] Allow own cell.

### M4.2 Applying Moves

- [x] Call `applyMove`.
- [x] Increment `turnCount`.
- [x] Apply elimination only after `turnCount >= players.length`.
- [x] Mark eliminated players.
- [x] Compute alive players.
- [x] End game if one alive player remains.
- [x] Otherwise advance turn.
- [x] Broadcast `game_state`.

### M4.3 Turn Advancement

- [x] Implement `advanceTurn(room)`.
- [x] Start from the next index.
- [x] Skip eliminated players.
- [x] Wrap around at player count.
- [x] Avoid infinite loop if all players are eliminated.
- [x] Return current player unchanged only when necessary.

### M4.4 Game Over

- [x] Implement game-over cleanup helper.
- [x] Broadcast `game_over` with winner id and name.
- [x] Delete room.
- [x] Delete `playerRooms` entry for every room player.
- [x] Keep player WebSocket connections alive.

### M4.5 Leave Game and Disconnect

- [x] Implement `handleLeaveGame(playerId)`.
- [x] Treat not-in-game as no-op.
- [x] Mark player eliminated.
- [x] If current player leaves, advance turn.
- [x] If one player remains, end game.
- [x] Otherwise broadcast `game_state`.
- [x] Reuse from server close handler.
- [x] Call `handleLeaveQueue` from server close handler.
- [x] Delete player from `players` after cleanup.

## M5: Frontend Protocol and State

### M5.1 Types

- [x] Create `frontend/src/lib/types.ts`.
- [x] Mirror backend `Cell`.
- [x] Mirror backend `Board`.
- [x] Mirror backend `Player`.
- [x] Define `Phase`.
- [x] Define `GameState`.
- [x] Mirror every client message.
- [x] Mirror every server message.
- [x] Include error frame type.

### M5.2 Constants

- [x] Create `frontend/src/lib/colors.ts`.
- [x] Define at least four distinct player colors.
- [x] Define neutral empty cell colors in CSS or constants.
- [ ] Create frontend board presets if useful.

### M5.3 WebSocket Hook

- [x] Create `frontend/src/hooks/useGameWebSocket.ts`.
- [x] Open socket from `NEXT_PUBLIC_WS_URL`.
- [x] Fallback to `ws://localhost:8080`.
- [x] Store `phase`.
- [x] Store `playerId`.
- [x] Store `gameState`.
- [x] Store `queuedInfo`.
- [x] Store `winner`.
- [x] Store `lastError`.
- [x] Implement `sendJSON`.
- [x] Guard sends while socket is not open.
- [x] Handle `connected`.
- [x] Handle `queued`.
- [x] Handle `game_start`.
- [x] Handle `game_state`.
- [x] Handle `game_over`.
- [x] Handle `error`.
- [x] Clear errors on successful transitions.
- [x] Cleanup socket on unmount.

### M5.4 Hook Actions

- [x] Implement `joinQueue`.
- [x] Implement `leaveQueue`.
- [x] Implement `makeMove`.
- [x] Implement `leaveGame`.
- [x] Implement `reset`.
- [x] Expose all state and actions from the hook.

## M6: Frontend Screens

### M6.1 App Shell

- [x] Implement `frontend/src/app/page.tsx`.
- [x] Mark as client component.
- [x] Call `useGameWebSocket`.
- [x] Switch on `phase`.
- [x] Render lobby.
- [x] Render queue screen.
- [x] Render game board.
- [x] Render game over.
- [x] Show `lastError` without changing phase.

### M6.2 Lobby

- [x] Create `Lobby.tsx`.
- [x] Add player name input.
- [x] Add grid rows control.
- [x] Add grid columns control.
- [x] Add max players segmented control.
- [x] Validate before submit.
- [x] Disable submit for invalid name.
- [x] Provide sensible defaults: `6x9`, `2` players.

### M6.3 Queue Screen

- [x] Create `QueueScreen.tsx`.
- [x] Show current position.
- [x] Show max players.
- [x] Add cancel button.
- [x] Keep state display compact.

### M6.4 Game Board

- [x] Create `GameBoard.tsx`.
- [x] Compute `myIndex`.
- [x] Compute `isMyTurn`.
- [x] Render rows and columns from `board`.
- [x] Render orb count.
- [x] Render owner color.
- [x] Disable cells when not my turn.
- [x] Disable opponent-owned cells.
- [x] Enable empty cells on my turn.
- [x] Enable own cells on my turn.
- [x] Call `makeMove(row, col)` on legal click.
- [x] Show current player.
- [x] Show player list and eliminated state.
- [x] Add leave game button.

### M6.5 Game Over

- [x] Create `GameOver.tsx`.
- [x] Show winner name.
- [x] Add play again button.
- [x] Call `reset`.

### M6.6 Styling

- [x] Create `frontend/src/app/globals.css`.
- [x] Use responsive board sizing.
- [x] Prevent text overflow in buttons.
- [x] Keep UI dense and game-focused.
- [x] Use distinct player colors.
- [x] Add clear focus states.
- [x] Add disabled states.
- [x] Avoid decorative card nesting.

## M7: Verification

### M7.1 Backend Verification

- [ ] Run `npm install` in backend.
- [ ] Run `npm run smoke:logic`.
- [ ] Confirm corner explosion output.
- [ ] Run `npm run build`.
- [ ] Run `npm run lint`.
- [ ] Run backend dev server.
- [ ] Connect manually with WebSocket client.
- [ ] Confirm `connected` frame.
- [ ] Send invalid `join_queue`.
- [ ] Confirm `validation_failed`.
- [ ] Send valid `join_queue`.
- [ ] Confirm `queued`.

### M7.2 Full Multiplayer Verification

- [ ] Run backend server.
- [ ] Run frontend server.
- [ ] Open two browser windows.
- [ ] Join both players into same bucket.
- [ ] Confirm both enter playing phase.
- [ ] Player 1 makes legal move.
- [ ] Confirm both boards update.
- [ ] Player 2 makes legal move.
- [ ] Confirm both boards update.
- [ ] Attempt wrong-turn click.
- [ ] Confirm no board change.
- [ ] Attempt opponent-cell click.
- [ ] Confirm no board change.
- [ ] Trigger corner explosion.
- [ ] Confirm ownership and counts match rules.
- [ ] Trigger a cascade.
- [ ] Confirm board settles.
- [ ] Continue to elimination.
- [ ] Confirm game over winner.
- [ ] Confirm play again returns to lobby.

### M7.3 Cleanup Verification

- [ ] Join queue then cancel.
- [ ] Confirm queue state clears.
- [ ] Join queue then close tab.
- [ ] Confirm player removed from queue.
- [ ] Start game then leave game.
- [ ] Confirm remaining player wins if only one remains.
- [ ] Start game then close current-turn tab.
- [ ] Confirm turn advances or game ends.
- [ ] Confirm no room remains after game over.

### M7.4 Documentation Verification

- [ ] Confirm `docs/PROTOCOL.md` matches backend types.
- [ ] Confirm `docs/PROTOCOL.md` matches frontend types.
- [ ] Confirm `docs/BACKEND.md` file map matches implementation.
- [ ] Confirm `docs/FRONTEND.md` file map matches implementation.
- [ ] Update this TODO with completed checks.

## Post-M7: Persistence

- [ ] Re-read `docs/DATABASE.md`.
- [ ] Design finished-match persistence only.
- [ ] Create `backend/src/db/`.
- [ ] Add repository interfaces.
- [ ] Add migrations.
- [ ] Add provider-specific code only in repo layer.
- [ ] Add finished match write after `game_over`.

## Post-M7: Hardening

- [ ] Add formal test framework.
- [ ] Add reconnect support.
- [ ] Add spectator support.
- [ ] Add private rooms.
- [ ] Add deployment config.
- [ ] Add CI.
- [ ] Add rate limiting if HTTP endpoints are introduced.
