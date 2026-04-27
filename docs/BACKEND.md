# BACKEND.md

## When to read this

You're editing anything under `backend/`, adding a message handler, touching the `rooms`/`queues`/`players` Maps, or chasing a server bug. For idioms (naming, errors, logger, validation), read `CONVENTIONS.md` instead.

## File map

```
backend/
├── src/
│   ├── index.ts                   # entry; imports server, calls listen()
│   ├── server.ts                  # WS server creation, connection lifecycle
│   ├── router.ts                  # JSON parse + dispatch by message.type
│   ├── handlers/
│   │   ├── queue.handlers.ts      # handleJoinQueue, handleLeaveQueue
│   │   └── game.handlers.ts       # handleMove, handleLeaveGame, advanceTurn
│   ├── game/
│   │   └── gameLogic.ts           # pure (see GAME_LOGIC.md)
│   ├── state/
│   │   └── memory.ts              # players, queues, rooms, playerRooms Maps
│   ├── schemas/
│   │   └── messages.schemas.ts    # zod for join_queue, make_move, etc.
│   ├── constants/
│   │   ├── app.constants.ts       # LIMITS, MESSAGE_TYPES, ERROR_CODES
│   │   ├── app.messages.ts        # error/feedback strings
│   │   └── config.ts              # env via dotenv
│   ├── lib/
│   │   └── logger.ts              # winston, getLogger(name)
│   ├── utils/
│   │   ├── api_error.ts           # ApiError class
│   │   └── broadcast.ts           # broadcast(room, message), send(socket, data)
│   ├── types/
│   │   ├── protocol.ts            # ClientMessage, ServerMessage unions
│   │   └── game.ts                # Cell, Board, Player, Room
│   └── db/                        # post-M7 only
├── package.json
├── tsconfig.json
├── .env
└── .gitignore
```

## Reading order (top down)

1. `index.ts`: imports, calls `server.listen(config.PORT)`.
2. `server.ts`: creates `WebSocketServer`, on `connection` assigns UUID, registers `players`, calls into `router` on `message`, runs cleanup on `close`.
3. `router.ts`: `JSON.parse` in try/catch, validates with Zod, switches on `message.type`, calls a handler.
4. `handlers/`: business logic. Read state, mutate it, broadcast.
5. `game/gameLogic.ts`: pure helpers (no imports from sibling backend files).

## State flow: connection to game

```
WS connection (server.ts)
    │
    ├─ players.set(id, socket)
    ├─ send connected
    │
    ▼
join_queue (queue.handlers.ts)
    │
    ├─ key = "RxCxN"
    ├─ queues.get(key).push({id, name})
    ├─ send queued
    │
    ▼ (bucket full)
room creation (queue.handlers.ts)
    │
    ├─ rooms.set(roomId, { board, currentTurn: 0, turnCount: 0, players })
    ├─ playerRooms.set(each.id, roomId)
    ├─ broadcast game_start
    │
    ▼
make_move loop (game.handlers.ts)
    │
    ├─ validate (turn, bounds, ownership)
    ├─ applyMove (pure, from game/gameLogic.ts)
    ├─ turnCount++
    ├─ if turnCount >= players.length: run isEliminated per player
    ├─ advanceTurn (skip eliminated)
    ├─ if alive.length === 1: broadcast game_over; cleanup
    ├─ else:                  broadcast game_state
    │
    ▼
cleanup
    ├─ rooms.delete(roomId)
    └─ playerRooms.delete for each player
```

## Where to add things

### New message type

1. Add a Zod schema in `schemas/messages.schemas.ts`.
2. Add the type to the unions in `types/protocol.ts`.
3. Add a `case` in `router.ts` dispatching to a new handler.
4. Implement the handler in `handlers/` (new file if it's a new domain, otherwise extend an existing handler module).
5. Document in `PROTOCOL.md`.
6. Mirror the type on the frontend in `frontend/src/lib/types.ts`.

Example handler skeleton (in `handlers/game.handlers.ts`):

```ts
import { rooms, players, playerRooms } from "../state/memory";
import { applyMove } from "../game/gameLogic";
import { broadcast } from "../utils/broadcast";
import { ApiError } from "../utils/api_error";
import { getLogger } from "../lib/logger";

const logger = getLogger("game.handlers");

export function handleMove(playerId: string, payload: { row: number; col: number }) {
  const roomId = playerRooms.get(playerId);
  if (!roomId) return;
  const room = rooms.get(roomId);
  if (!room) return;
  if (room.players[room.currentTurn].id !== playerId) return;
  // ... validation, applyMove, broadcast
}
```

### New room property

Set it at room creation time in `queue.handlers.ts`, alongside `board`, `currentTurn`, `turnCount`. If the client needs it, add it to `Room` in `types/game.ts`, include it in the `game_state` broadcast payload, update `PROTOCOL.md`, and mirror in `frontend/src/lib/types.ts`.

### New background cleanup

Run it from `server.ts`'s `close` handler, after `handleLeaveQueue` and `handleLeaveGame` and before `players.delete(id)`. The close handler is the one place that always fires regardless of game state.

## Critical invariants

- **`playerRooms` and `rooms` must stay in sync.** Every player mentioned in a room must map back to that `roomId`, and deleting a room must delete every related `playerRooms` entry. Drift here causes phantom games.
- **Elimination check only runs after `turnCount >= players.length`.** Grace period so opening moves on an empty board don't instantly eliminate anyone. (See `GLOSSARY.md`.)
- **`advanceTurn` skips eliminated players.** Off-by-one here is the most common source of "stuck on a dead player's turn" bugs.
- **`broadcast` must handle missing sockets.** A player may have disconnected mid-loop; `players.get(p.id)` can return `undefined`. Guard the `.send`.

## Run

```bash
cd backend
npm install
npm run dev          # tsx watch src/index.ts
# "Server is running on http://localhost:8080"
```

For game-logic-only smoke testing:

```bash
npm run smoke:logic  # runs tsx src/game/gameLogic.ts
```

## Testing

No framework yet. Manual WS testing via the browser console snippets in `TODO.md` (M1 to M5 "TEST" sections). See `RULES.md` on testing expectations.
