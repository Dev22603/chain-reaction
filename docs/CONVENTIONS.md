# CONVENTIONS.md

## When to read this

You're writing or refactoring code and want to know which idioms to follow. These are conventions, not rules; they're how the codebase reads, but a good reason to deviate is fine. Hard rules live in `RULES.md`.

## Layering

Each backend message follows this path:

```
WS frame  →  router.ts  →  handlers/*.ts  →  game/gameLogic.ts (pure)
                              │                state/memory.ts
                              │                utils/broadcast.ts
                              ▼
                            broadcast back to clients
```

- **`router.ts` only routes.** Parse JSON, validate via a Zod schema, dispatch to a handler. No state reads, no broadcasts.
- **`handlers/` does business logic.** Reads state, calls game logic, mutates state, broadcasts.
- **`game/gameLogic.ts` is pure.** No imports from sibling backend modules.
- **`utils/` and `lib/` are leaves.** They never import from `handlers/` or `state/`.

Frontend layering is shallower: `useGameWebSocket` owns all WS state and actions; components are dumb and prop-driven.

## File naming

- Handlers: `<domain>.handlers.ts` (e.g. `queue.handlers.ts`, `game.handlers.ts`).
- Schemas: `<domain>.schemas.ts` or one combined `messages.schemas.ts`.
- Repos: `<entity>.ts` under `db/repos/` (e.g. `matches.ts`).
- Constants: `app.constants.ts`, `app.messages.ts`, `config.ts`.
- Types: `<domain>.ts` under `types/` (e.g. `protocol.ts`, `game.ts`).
- Components: `PascalCase.tsx`.
- Hooks: `useThing.ts`.

## Wire format vs internal format

- **Wire (JSON over WS):** `snake_case` for any new field names. The existing protocol mixes camelCase (`gridRows`, `playerName`) and that's fine to leave as-is, but new fields should be snake_case for consistency with the future DB (`player_id`, `match_id`, `eliminated_turn`).
- **Internal (TS):** `camelCase` for variables and properties. PascalCase for types and classes.
- **DB columns:** `snake_case`. Prisma maps database names to internal camelCase fields where needed.

The reference repo treats the wire format and DB format as a single snake_case "external" world, with camelCase only inside TypeScript. Adopt that.

## Errors: throw `ApiError`, catch in router

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
- The router **catches** them and emits an `error` frame. See `ERRORS.md` for codes and frame shape.
- Unknown errors get logged and surface as a generic `internal_error` frame.

## Validation: Zod, always at the boundary

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

The router runs `safeParse` on incoming frames; on failure it throws `new ApiError("validation_failed", "Validation failed", issues)`. Handlers receive already-typed data, never raw input.

## Logging: named child loggers

```ts
// every file that logs:
import { getLogger } from "../lib/logger";
const logger = getLogger("game.handlers");

logger.info("game started", { roomId, players: room.players.map(p => p.name) });
logger.error("DB error - recordFinished", { error: (err as Error).message });
```

- One logger per file, named after the file's purpose.
- Pass structured fields as the second argument; do not concatenate into the message string.
- Levels: `error` for genuine failures, `warn` for rejected requests (bad token, wrong turn), `info` for lifecycle events, `debug` for development noise.

## Constants centralization

- **Numeric/structural limits** in `app.constants.ts`: `LIMITS.GRID_MIN`, `LIMITS.GRID_MAX`, `LIMITS.PLAYERS_MIN`, `LIMITS.PLAYERS_MAX`, `LIMITS.SAFETY_BREAK`, etc.
- **Message type strings** in `app.constants.ts` as `MESSAGE_TYPES.JOIN_QUEUE = "join_queue"` so handlers and tests don't drift.
- **Error codes** as `ERROR_CODES.VALIDATION_FAILED = "validation_failed"` (see `ERRORS.md`).
- **User-visible strings** in `app.messages.ts`, grouped by domain (`QUEUE_FEEDBACK`, `GAME_VALIDATION_ERRORS`).
- Frontend constants live in `frontend/src/lib/` (`colors.ts`, future `presets.ts`).

If a value appears in two places, it goes in constants.

## Type definitions

- **Game-domain types** (`Cell`, `Board`, `Player`, `Room`) in `backend/src/types/game.ts`.
- **Protocol types** (`ClientMessage`, `ServerMessage`, individual frame interfaces) in `backend/src/types/protocol.ts` and mirrored in `frontend/src/lib/types.ts`.
- **Inferred from Zod** is fine: `type JoinQueuePayload = z.infer<typeof JoinQueueSchema>`. Prefer this over hand-rolling parallel types.

## TypeScript strictness

- `strict: true` on. Don't loosen individual flags.
- Avoid `any` in committed code. If you genuinely need an escape hatch for a third-party shape, use `unknown` and narrow.
- Don't suppress errors with `// @ts-ignore`. If you must, use `// @ts-expect-error <reason>` so it screams when the underlying issue is fixed.

## Async style

- `async`/`await` throughout. No `.then` chains.
- Top-level handlers wrap their bodies so a thrown `ApiError` reaches the router; the router decides what to send back.

## Comments

- Comment **why**, not **what**. The code shows what.
- TODOs include a name or ticket: `// TODO(dev): handle reconnect in reconnection milestone`.
- Don't leave commented-out code. Git remembers.
