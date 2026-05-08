# ARCHITECTURE.md

## When to read this

You're adding a new subsystem, changing how frontend and backend talk at a structural level, touching the phase machine, or setting up deployment. For message shapes specifically, read `PROTOCOL.md`. For coding patterns inside files, read `CONVENTIONS.md`.

## System overview

Three pieces. One backend process. Postgres is used for account identity, match history, and ranked scoring.

```
┌──────────────┐    WebSocket (JSON)    ┌────────────────────────────────┐
│  Next.js     │ ◀──────────────────▶   │  Node.js + ws (TypeScript)     │
│  frontend    │                         │  ┌──────────────────────────┐  │
│  (port 3000) │                         │  │ router.ts                │  │
│              │                         │  │  • parses, dispatches    │  │
│  phase       │                         │  └────────────┬─────────────┘  │
│  machine     │                         │               ▼                │
│  (client)    │                         │  ┌──────────────────────────┐  │
│              │                         │  │ handlers/                │  │
│              │                         │  │  • queue.handlers.ts     │  │
│              │                         │  │  • game.handlers.ts      │  │
│              │                         │  └────────────┬─────────────┘  │
│              │                         │               ▼                │
│              │                         │  ┌──────────────────────────┐  │
│              │                         │  │ game/gameLogic.ts (pure) │  │
│              │                         │  │ state/memory.ts (maps)   │  │
│              │                         │  └──────────────────────────┘  │
└──────────────┘                         └────────────────────────────────┘
                                                          │
                                                          │ persistent data
                                                          ▼
                                                    ┌───────────┐
                                                    │ Postgres  │
                                                    │ via repo  │
                                                    │ pattern   │
                                                    └───────────┘
```

## Responsibilities

### Frontend (`frontend/`)
- Renders UI based on a phase machine.
- Sends player intent as JSON WebSocket messages.
- Renders whatever `game_state` broadcasts arrive. Never computes the next board itself.

### Backend (`backend/`)
- `app.ts`: creates the Express app, registers middleware, mounts HTTP routes, and installs error middleware.
- `index.ts`: creates the HTTP server, attaches WebSocket lifecycle, and starts listening.
- `realtime/websocket.ts`: accepts WS connections, resolves optional JWT identity, falls back to guest identity, and tracks the socket in the `players` Map.
- `router.ts`: parses incoming WS frames, dispatches by `type` to the correct handler in `handlers/`.
- `handlers/`: per-message-type validation (via Zod schemas in `schemas/`), live state mutation, broadcast emission.
- `routes/`, `controllers/`, `services/`: HTTP route stack for auth, leaderboard, and other persistent resources.
- `state/memory.ts`: the four module-level Maps that hold all live state.
- `game/gameLogic.ts`: pure rules, no I/O.
- `db/`: Prisma-backed repository pattern. Handlers/services import repos from `db/index.ts`, never Prisma directly.

### Game logic (`backend/src/game/gameLogic.ts`)
- Pure module, no imports from `ws`, `http`, `fs`, logger, DB, or any sibling backend module.
- Five exports: `createBoard`, `getCriticalMass`, `getNeighbors`, `applyMove`, `isEliminated`.
- Runs as a standalone script via the file-bottom `process.argv[1]` guard, executed by `tsx`.

### Database boundary
- Prisma + Postgres.
- Live match state stays in memory.
- Finished-match persistence and score updates happen after `game_over`.
- Repository pattern under `backend/src/db/`; handlers/services import repos from `db/index.ts`, never Prisma directly. See `DATABASE.md`.

## Phase machine (frontend)

```
              joinQueue                  game_start
   ┌─────────┐ ───────▶ ┌────────┐ ────────────▶ ┌─────────┐
   │  lobby  │          │ queued │               │ playing │
   └─────────┘ ◀─────── └────────┘               └─────────┘
        ▲     leaveQueue                               │
        │                                              │ game_over
        │ reset / "Play Again"                         ▼
        │                                        ┌──────────┐
        └────────────────────────────────────────│ gameover │
                                                 └──────────┘
```

State lives in the `useGameWebSocket` hook:
- `phase: 'lobby' | 'queued' | 'playing' | 'gameover'`
- `playerId: string | null`
- `gameState: GameState | null` (see `frontend/src/lib/types.ts`)
- `queuedInfo: { mode, position, maxPlayers } | null`
- `winner: Player | null`

## In-memory state (backend)

Module-level Maps in `backend/src/state/memory.ts`:

```ts
export const players     = new Map<string, WebSocket>();          // playerId -> socket
export const connections = new Map<string, ConnectionIdentity>(); // playerId -> auth/guest identity
export const queues      = new Map<string, Player[]>();           // "mode:RxCxN" -> bucket
export const rooms       = new Map<string, Room>();               // roomId -> room
export const playerRooms = new Map<string, string>();             // playerId -> roomId
```

A `Room` (defined in `types/game.ts`) holds `{ id, mode, players: Player[], gridRows, gridCols, maxPlayers, board, currentTurn, turnCount, startedAt, forfeitedPlayerIds }`. Rooms are deleted when a game ends. Players carry `isGuest`, `eliminated`, and `eliminatedTurn` for the duration.

## Lifecycle: connection to cleanup

1. Client opens WS. `realtime/websocket.ts` verifies an optional JWT, otherwise creates a guest identity, then sends `{ type: 'connected', playerId, displayName, isGuest }`.
2. Client sends `join_queue` with `mode`. `queue.handlers.ts` rejects guest ranked joins, buckets by mode/grid/player count, sends `queued`, and creates a room when the bucket fills.
3. Clients alternate `make_move`. `game.handlers.ts` validates, runs `applyMove`, broadcasts `game_state`.
4. When only one player remains alive, server sends `game_over`, attempts persistence asynchronously, and deletes the room.
5. On disconnect: `realtime/websocket.ts` runs leave-queue + leave-game cleanup, then `players.delete`.

## Deployment (Fly.io)

Currently not automated. When enabled:

- One Fly app per service. `backend` as a long-running Node process with a public TCP/WebSocket port. `frontend` as a standard Next.js deploy.
- WebSocket URL moves from `ws://localhost:8080` to `wss://<app>.fly.dev`. Read it from `NEXT_PUBLIC_WS_URL` on the frontend.
- Postgres via Fly Managed Postgres or any provider reachable over the public internet. See `DATABASE.md` for the provider-swap rule.
- Backend must handle `SIGTERM` gracefully (broadcast `game_over` with a forfeit reason to active rooms) before Fly's shutdown timeout.

## Deferred product work

Reconnection, spectators, private rooms, per-mode Elo, 5+ player games, and mobile-specific polish are deferred until the auth, persistence, and simple scoring foundation is stable.
