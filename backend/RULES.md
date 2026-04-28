# RULES.md

Merged source of truth for coding standards across `backend/` and `frontend/`. Read this before writing or refactoring any code. Every rule has a reason — if you're about to break one, ask, and if it changes, update this file in the same commit.

## Contents

1. Non-negotiables
2. Layering & file maps
3. Naming & wire format
4. Error handling
5. Validation
6. Logging
7. Constants
8. Types
9. TypeScript & code style
10. Database boundary
11. Testing
12. Commits
13. Where to add things
14. Critical invariants
15. Game logic API quick reference

---

## 1. Non-negotiables

### Server authority

- Server is the source of truth for all game state. Clients render what the server broadcasts. They never compute board transitions locally.
- Never trust a `make_move` payload beyond `{row, col}`. The server reads `currentTurn`, `board[row][col].owner`, and its own state to validate.
- Chain reactions run on the server. `applyMove` lives in `backend/src/game/gameLogic.ts`; the frontend only renders the resulting `board`.

*Why: clients can be tampered with, and one authoritative simulation prevents N-client divergence.*

### Game logic purity

`backend/src/game/gameLogic.ts` must not import `ws`, `http`, `fs`, the logger, the DB client, or anything from `state/`, `handlers/`, `lib/`, or `db/`. Pure functions only — inputs in, new or mutated state out.

*Why: the same module runs in the smoke test, the live server, and any future replay/AI use case. Any I/O breaks that.*

### No business logic in the WS message router

`router.ts` parses and dispatches. Each message type maps to a `handleX` function in `handlers/`. Routers do not read state, mutate rooms, or build broadcasts.

*Why: keeps the router readable and individually testable.*

### State boundary

- Active game state lives in memory (the `rooms` Map in `state/memory.ts`). Only finished matches hit the DB.
- No writes per move.

*Why: move-rate writes destroy latency and Postgres bills. Match results are the durable artifact.*

### Repository boundary

- All database operations live in repositories under `backend/src/db/repos/`.
- Prisma is imported only by repository/client code. Handlers, services, controllers, and game logic call repository methods, never Prisma directly.
- DB failures must log and degrade gracefully; they must not prevent `game_over` from reaching players.

*Why: persistence stays swappable, reviewable, and decoupled from gameplay.*

### Protocol coupling

When adding or renaming a WebSocket message, update [../docs/PROTOCOL.md](../docs/PROTOCOL.md), `backend/src/types/protocol.ts`, and `frontend/src/lib/types.ts` in the same commit. No silent protocol changes.

*Why: drift between the contract and either side is the most common source of real-time bugs.*

---

## 2. Layering & file maps

### Backend WebSocket path

```
WS frame → router.ts → handlers/*.ts → game/gameLogic.ts (pure)
                          │             state/memory.ts
                          │             utils/broadcast.ts
                          ▼
                       broadcast back to clients
```

- `router.ts` only routes. Parse JSON, validate via Zod, dispatch. No state reads, no broadcasts.
- `handlers/` does business logic. Reads state, calls game logic, mutates state, broadcasts.
- `game/gameLogic.ts` is pure.
- `utils/` and `lib/` are leaves. They never import from `handlers/` or `state/`.

### Backend HTTP path

```
routes → controllers → services → db/repos → Prisma
```

Used for durable read/write resources such as the leaderboard.

### Frontend

- `useGameWebSocket` owns all WebSocket state and actions.
- Components are dumb and prop-driven. They don't open sockets, parse messages, or keep their own copies of server state.
- `page.tsx` is a switch over `phase`.

### File map: `backend/src/`

```
backend/src/
├── index.ts                   # entry; creates HTTP server, attaches WS, listens
├── app.ts                     # Express app: middleware + HTTP routes + error middleware
├── realtime/websocket.ts      # WS server + connection lifecycle
├── router.ts                  # JSON parse + Zod validate + dispatch by message.type
├── routes/                    # HTTP route registration
├── controllers/               # HTTP I/O
├── services/                  # HTTP business use cases
├── handlers/
│   ├── queue.handlers.ts      # join_queue, leave_queue
│   └── game.handlers.ts       # make_move, leave_game, advanceTurn
├── game/gameLogic.ts          # pure rules
├── state/memory.ts            # players, queues, rooms, playerRooms Maps
├── schemas/messages.schemas.ts
├── constants/
│   ├── app.constants.ts       # LIMITS, MESSAGE_TYPES, ERROR_CODES
│   ├── app.messages.ts        # user-visible strings
│   └── config.ts              # env via dotenv
├── lib/
│   ├── logger.ts              # winston getLogger(name)
│   └── prisma.ts              # Prisma singleton
├── utils/
│   ├── api_error.ts
│   ├── broadcast.ts
│   └── mappers.ts             # snake_case <-> camelCase translators
├── types/
│   ├── protocol.ts
│   └── game.ts
├── db/
│   ├── index.ts               # repo barrel
│   └── repos/                 # players.ts, matches.ts, scores.ts
└── generated/prisma/          # generated Prisma client (git-ignored)
```

### File map: `frontend/src/`

```
frontend/src/
├── app/page.tsx               # phase router (client component)
├── hooks/useGameWebSocket.ts  # single source of WS + phase state
├── components/                # Lobby, QueueScreen, GameBoard, GameOver
└── lib/
    ├── types.ts               # mirrored protocol types
    └── colors.ts              # PLAYER_COLORS[]
```

### In-memory state (backend)

```ts
export const players     = new Map<string, WebSocket>();   // playerId -> socket
export const queues      = new Map<string, Player[]>();    // "RxCxN"  -> bucket
export const rooms       = new Map<string, Room>();        // roomId   -> room
export const playerRooms = new Map<string, string>();      // playerId -> roomId
```

---

## 3. Naming & wire format

### File naming

- Handlers: `<domain>.handlers.ts` (e.g. `queue.handlers.ts`).
- Schemas: `<domain>.schemas.ts` or one combined `messages.schemas.ts`.
- Repos: `<entity>.ts` under `db/repos/` (e.g. `matches.ts`).
- Constants: `app.constants.ts`, `app.messages.ts`, `config.ts`.
- Types: `<domain>.ts` under `types/` (e.g. `protocol.ts`, `game.ts`).
- Components: `PascalCase.tsx`. Hooks: `useThing.ts`.

### Wire vs internal vs DB

- **Wire (JSON over WS):** `snake_case` for new fields. (Existing camelCase fields like `gridRows` may stay; new fields are snake_case to align with the DB.)
- **Internal (TS):** `camelCase` for variables and properties. PascalCase for types and classes.
- **DB columns:** `snake_case` via Prisma `@map`.

Mappers in `utils/mappers.ts` translate between DB rows and internal objects.

---

## 4. Error handling

```ts
// utils/api_error.ts
export class ApiError extends Error {
  constructor(public code: string, message: string, public errors: string[] = []) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}
```

- Handlers and validators **throw `ApiError`** for predictable failures.
- The router **catches** and emits an `error` frame.
- Unknown errors are logged and surface as a generic `internal_error` frame.
- The error frame contract (codes, fields, when to send vs silently drop) lives in [../docs/PROTOCOL.md](../docs/PROTOCOL.md).

Don't:

- Throw raw `Error` from handlers — always wrap as `ApiError`.
- Echo internal stack traces in `message`.
- Broadcast errors. They are per-socket. If a whole room is affected, end the game with `game_over` instead.

---

## 5. Validation

```ts
// schemas/messages.schemas.ts
import { z } from "zod";

export const JoinQueueSchema = z.object({
  type: z.literal("join_queue"),
  gridRows: z.number().int().min(3).max(20),
  gridCols: z.number().int().min(3).max(20),
  maxPlayers: z.number().int().min(2).max(4),
  playerName: z.string().min(1).max(100).transform(s => s.trim()),
});
```

- Every client-to-server message goes through a Zod schema before reaching a handler.
- The router runs `safeParse`; on failure it throws `new ApiError("validation_failed", ...)`.
- Handlers receive already-typed data, never raw input.
- All routing is wrapped in `try { JSON.parse(...) } catch { return }`. A bad frame is dropped, not fatal.

---

## 6. Logging

```ts
import { getLogger } from "../lib/logger";
const logger = getLogger("game.handlers");

logger.info("game started", { roomId, players: room.players.map(p => p.name) });
logger.error("DB error - recordFinished", { error: (err as Error).message });
```

- One named logger per file.
- Pass structured fields as the second argument; do not concatenate into the message string.
- Levels: `error` for genuine failures, `warn` for rejected requests (bad token, wrong turn), `info` for lifecycle events, `debug` for development noise.

---

## 7. Constants

- Numeric/structural limits in `app.constants.ts`: `LIMITS.GRID_MIN`, `LIMITS.GRID_MAX`, `LIMITS.PLAYERS_MIN`, `LIMITS.PLAYERS_MAX`, `LIMITS.SAFETY_BREAK`.
- Message-type strings in `MESSAGE_TYPES.JOIN_QUEUE = "join_queue"` etc.
- Error codes in `ERROR_CODES`.
- User-visible strings in `app.messages.ts`, grouped by domain (`QUEUE_FEEDBACK`, `GAME_VALIDATION_ERRORS`).
- Frontend constants in `frontend/src/lib/` (`colors.ts`, future `presets.ts`).

If a value appears in two places, it goes in constants.

---

## 8. Types

- Game-domain types (`Cell`, `Board`, `Player`, `Room`) in `backend/src/types/game.ts`.
- Protocol types (`ClientMessage`, `ServerMessage`, individual frames) in `backend/src/types/protocol.ts` and **mirrored** in `frontend/src/lib/types.ts`.
- Prefer Zod-inferred types: `type JoinQueuePayload = z.infer<typeof JoinQueueSchema>`. Don't hand-roll parallel types.

---

## 9. TypeScript & code style

- `strict: true` on. Don't loosen individual flags.
- No `any` in committed code. Use `unknown` and narrow if you must.
- No `// @ts-ignore`. Use `// @ts-expect-error <reason>` if absolutely necessary.
- `async`/`await` throughout. No `.then` chains.
- Top-level handlers wrap their bodies so a thrown `ApiError` reaches the router.
- Comment **why**, not **what**. The code shows what.
- TODOs include a name or ticket: `// TODO(dev): handle reconnect post-M7`.
- No commented-out code. Git remembers.
- No unused imports or variables.
- ESLint must pass before commit on both `backend/` and `frontend/`: `npm run lint`.
- File size soft cap: **300 lines**. If a file crosses it, split by concern.

---

## 10. Database boundary

See [../docs/PERSISTENCE.md](../docs/PERSISTENCE.md) for models, scoring policy, and write order.

Code-side rules:

- Handlers/services import only from `backend/src/db/index.ts`:

  ```ts
  import { matchesRepo, playersRepo, scoresRepo } from "../db/index.js";
  ```

- The Prisma client singleton lives in `backend/src/lib/prisma.ts`.
- Schema source of truth is `backend/prisma/schema.prisma`.
- Score writes happen post-`game_over`, not per move. The current ordering broadcasts `game_over` first, then calls `matchesRepo.recordFinished` and `scoresRepo.applyMatchResult`.
- Never commit a real `DATABASE_URL`. Secrets stay in `backend/.env` locally and in production secret storage.

Prisma commands:

```bash
cd backend
npm run db:generate
npm run db:migrate
npm run db:studio
npm run db:migrate:prod   # production
```

---

## 11. Testing

- Game logic stays runnable via `npm run smoke:logic` (`tsx src/game/gameLogic.ts`). The bottom guard `if (process.argv[1] === new URL(import.meta.url).pathname)` is **required** in `gameLogic.ts`.
- Any bug fix in `gameLogic.ts` **appends** a reproducing case to the bottom guard. Append, don't replace — this guard is the regression suite until a framework lands.
- No formal test framework is in scope until post-M7. Don't add Jest/Vitest config silently.

---

## 12. Commits

- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`.
- Scope to one concern: `feat(backend): add make_move handler`, not `feat: everything from M5`.
- Reference the milestone in the body when applicable. First line is conventional; second paragraph can say `M5`.

---

## 13. Where to add things

### New WebSocket message type

1. Document in [../docs/PROTOCOL.md](../docs/PROTOCOL.md) with a JSON example and field constraints.
2. Add a Zod schema in `schemas/messages.schemas.ts`.
3. Add the type to the unions in `backend/src/types/protocol.ts` **and** `frontend/src/lib/types.ts`.
4. Add a `case` in `router.ts` dispatching to a handler.
5. Implement the handler in `handlers/` (new file if it's a new domain).
6. If server-to-client, add a `case` in `useGameWebSocket.onmessage`.
7. Commit everything together: `feat(protocol): add <message_type>`.

### New room property

Set it at room creation in `queue.handlers.ts`, alongside `board`, `currentTurn`, `turnCount`. If the client needs it, add it to `Room` in `types/game.ts`, include it in the `game_state` payload, update [../docs/PROTOCOL.md](../docs/PROTOCOL.md), and mirror in `frontend/src/lib/types.ts`.

### New frontend phase

1. Extend the `Phase` union in `frontend/src/lib/types.ts`.
2. Add a new component in `frontend/src/components/` following the existing props pattern (data down, callbacks up).
3. Add a `case` to the switch in `page.tsx`.
4. Decide what server message or local action transitions in/out, then update the `onmessage` switch and action functions in `useGameWebSocket`.

### New error code

1. Add it to `ERROR_CODES` in `backend/src/constants/app.constants.ts`.
2. Add a row to the table in [../docs/PROTOCOL.md](../docs/PROTOCOL.md).
3. If the frontend handles it specially (e.g. redirect on `not_authenticated`), document the handling there too.
4. Update `frontend/src/lib/types.ts` if you've narrowed the `code` union.

### New background cleanup

Run it from the WebSocket `close` handler, after `handleLeaveQueue` and `handleLeaveGame` and before `players.delete(id)`. The close handler is the one place that always fires regardless of game state.

---

## 14. Critical invariants

- **`playerRooms` and `rooms` must stay in sync.** Every player mentioned in a room must map back to that `roomId`; deleting a room must delete every related `playerRooms` entry. Drift causes phantom games.
- **Elimination check only runs after `turnCount >= players.length`.** Grace period so opening moves on an empty board don't instantly eliminate anyone.
- **`advanceTurn` skips eliminated players.** Off-by-one here causes "stuck on a dead player's turn" bugs.
- **`broadcast` handles missing sockets.** A player may have disconnected mid-loop; `players.get(p.id)` can return `undefined`. Guard the `.send`.
- **Neighbor iteration stays in bounds.** All out-of-bounds `(r, c)` are filtered in `getNeighbors`; nothing downstream should assume otherwise.
- **Ownership propagates from the exploding cell's owner at explosion time** — not the player who made the original move. During a cascade, ownership can change hands mid-loop.
- **A cell with `count === 0` has `owner === null`.** Inconsistent state otherwise.
- **`isEliminated` is idempotent.** Running it twice on the same board produces the same result.
- **Frontend `gameState` must be replaced, not mutated in place.** `setGameState(g => g && { ...g, board: msg.board, ... })`. Mutation breaks React rerendering.

---

## 15. Game logic API quick reference

All five functions live in `backend/src/game/gameLogic.ts`. Types from `../types/game.ts`. Game rules and definitions are in [../docs/GAMEPLAY.md](../docs/GAMEPLAY.md).

- `createBoard(rows, cols): Board` — `rows × cols` 2D array of `{ owner: null, count: 0 }`.
- `getCriticalMass(r, c, rows, cols): number` — `2` (corner), `3` (edge), `4` (interior). Equivalent to counting in-bounds orthogonal neighbors.
- `getNeighbors(r, c, rows, cols): Array<[number, number]>` — in-bounds 4-cardinal pairs.
- `applyMove(board, r, c, playerIndex, rows, cols): Board` — increments target, then loops with safety counter `LIMITS.SAFETY_BREAK` (2000) collecting unstable cells until none remain. On a correct implementation the safety counter never fires; log if it does.
- `isEliminated(board, playerIndex): boolean` — true iff no cell on the board has `owner === playerIndex`.

---

## When in doubt

Read the relevant `docs/*.md` file or open [CLAUDE.md](./CLAUDE.md) for navigation. Ask before breaking a rule. Rules can evolve, but only in a commit that updates this file.
