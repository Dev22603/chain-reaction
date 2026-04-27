# ARCHITECTURE.md

## When to read this

You're adding a new subsystem, changing how frontend and backend talk at a structural level, touching the phase machine, or setting up deployment. For message shapes specifically, read `PROTOCOL.md`. For coding patterns inside files, read `CONVENTIONS.md`.

## System overview

Three pieces. One backend process. No database until post-M7.

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
                                                          │ (post-M7)
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
- `server.ts`: accepts WS connections, assigns each a UUID, tracks the socket in the `players` Map.
- `router.ts`: parses incoming frames, dispatches by `type` to the correct handler in `handlers/`.
- `handlers/`: per-message-type validation (via Zod schemas in `schemas/`), state mutation, broadcast emission.
- `state/memory.ts`: the four module-level Maps that hold all live state.
- `game/gameLogic.ts`: pure rules, no I/O.
- `db/` (post-M7): repository pattern, the only place SQL lives.

### Game logic (`backend/src/game/gameLogic.ts`)
- Pure module, no imports from `ws`, `http`, `fs`, logger, DB, or any sibling backend module.
- Five exports: `createBoard`, `getCriticalMass`, `getNeighbors`, `applyMove`, `isEliminated`.
- Runs as a standalone script via the file-bottom `process.argv[1]` guard, executed by `tsx`.

### Database boundary (post-M7)
- Not active during M1 to M7.
- When introduced: repository pattern under `backend/src/db/`, called only from handlers, never raw queries elsewhere. See `DATABASE.md`.

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
- `queuedInfo: { position, maxPlayers } | null`
- `winner: Player | null`

## In-memory state (backend)

Module-level Maps in `backend/src/state/memory.ts`:

```ts
export const players     = new Map<string, WebSocket>();   // playerId  -> socket
export const queues      = new Map<string, Player[]>();    // "RxCxN"   -> bucket
export const rooms       = new Map<string, Room>();        // roomId    -> room
export const playerRooms = new Map<string, string>();      // playerId  -> roomId
```

A `Room` (defined in `types/game.ts`) holds `{ id, players: Player[], gridRows, gridCols, board, currentTurn, turnCount }`. Rooms are deleted when a game ends. Players are decorated with `eliminated: boolean` for the duration.

## Lifecycle: connection to cleanup

1. Client opens WS. `server.ts` generates `uuidv4`, sends `{ type: 'connected', playerId }`.
2. Client sends `join_queue`. `queue.handlers.ts` buckets, sends `queued`. If the bucket fills, `game_start` to all members and a room is created.
3. Clients alternate `make_move`. `game.handlers.ts` validates, runs `applyMove`, broadcasts `game_state`.
4. When only one player remains alive, server sends `game_over` and deletes the room.
5. On disconnect: `server.ts` runs leave-queue + leave-game cleanup, then `players.delete`.

## Deployment (Fly.io)

Currently not automated. When enabled:

- One Fly app per service. `backend` as a long-running Node process with a public TCP/WebSocket port. `frontend` as a standard Next.js deploy.
- WebSocket URL moves from `ws://localhost:8080` to `wss://<app>.fly.dev`. Read it from `NEXT_PUBLIC_WS_URL` on the frontend.
- Postgres via Fly Managed Postgres or any provider reachable over the public internet. See `DATABASE.md` for the provider-swap rule.
- Backend must handle `SIGTERM` gracefully (broadcast `game_over` with a forfeit reason to active rooms) before Fly's shutdown timeout.

## Non-goals for M1 to M7

Auth, reconnection, spectators, private rooms, per-mode ELO, 5+ player games, mobile-specific polish, persistence. Deferred to a follow-up plan.
