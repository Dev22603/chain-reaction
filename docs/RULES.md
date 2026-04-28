# RULES.md: Non-negotiables

Enforced across backend and frontend. Every rule has a reason. If you're about to break one, stop and ask.

## Server authority

- **Server is the source of truth for all game state.** The client renders what the server broadcasts. It never computes board transitions locally.
  *Why: clients can be tampered with. A cheater shouldn't be one devtools line away from a winning move.*

- **Never trust a `make_move` payload beyond `{row, col}`.** The server reads `currentTurn`, `board[row][col].owner`, and its own state to validate.
  *Why: the client can send anything. Payload fields beyond coordinates are hints at best.*

- **Chain reactions run on the server, not in the browser.** `applyMove` lives in `backend/src/game/gameLogic.ts`; the frontend only renders the resulting `board`.
  *Why: determinism and anti-cheat. One authoritative simulation, not N racing clients.*

## Game logic purity

- **`backend/src/game/gameLogic.ts` must not import `ws`, `http`, `fs`, the logger, the DB client, or anything from `state/`, `handlers/`, or `lib/`.** Pure functions only. Inputs in, new or mutated state out.
  *Why: makes the whole ruleset testable with `npm run smoke:logic` and reusable for server-side replay or AI later.*

- **No business logic inside the WS message router.** `router.ts` parses and dispatches. Each message type maps to a `handleX` function in `handlers/`. Routers do not read state, mutate rooms, or build broadcasts.
  *Why: keeps the router readable and makes handlers individually testable.*

## Message validation

- **Every client-to-server message goes through a Zod schema in `schemas/messages.schemas.ts` before reaching a handler.** Shape, type, and range checks at the boundary.
  *Why: malformed JSON shouldn't be able to crash the process or corrupt a room.*

- **All routing happens inside `try { JSON.parse(...) } catch { return }`.** A bad frame is dropped, not fatal.
  *Why: one buggy or malicious client cannot take down the server for everyone.*

- **When adding a message type, update `docs/context/PROTOCOL.md` AND `backend/src/types/protocol.ts` AND `frontend/src/lib/types.ts` in the same commit.** No silent protocol changes.
  *Why: the frontend and backend both rely on the protocol; drift between them is the most common source of real-time bugs.*

## State boundary

- **Active game state lives in memory (the `rooms` Map in `state/memory.ts`). Only finished matches hit the DB.** No writes per move.
  *Why: move-rate writes destroy both latency and your Postgres bill. Match results are the durable artifact.*

- **No Prisma or provider-specific client calls outside `backend/src/db/repos/` and `backend/src/lib/prisma.ts`.** Handlers, controllers, and services call repository methods, never Prisma directly.
  *Why: persistence must stay swappable and reviewable without leaking database details into gameplay or HTTP code.*

## Game logic testing

- **Game logic must stay runnable via `npm run smoke:logic`** (which runs `tsx src/game/gameLogic.ts`). The file-bottom guard `if (process.argv[1] === new URL(import.meta.url).pathname)` is required.
  *Why: no framework yet, but the logic must always have a zero-setup smoke path.*

- **Any bug fix in `gameLogic.ts` adds a reproducing case to the bottom guard.** Append, don't replace.
  *Why: the guard is our regression suite until a framework lands.*

- **No formal test framework is in scope until post-M7.** Don't add Jest or Vitest config silently.
  *Why: scope creep. Tests come when the surface is stable.*

## Code quality baseline

- **TypeScript `strict` is on and stays on.** Don't disable individual flags to make errors go away.
  *Why: most of the bugs strict catches are real bugs.*

- **No `any` in TypeScript code.** Use the types in `backend/src/types/` and `frontend/src/lib/types.ts`, or extend them.
  *Why: the message protocol is the main source of bugs; types are the cheapest guard.*

- **No unused imports, no unused variables, no commented-out code.** If it's dead, delete it.
  *Why: the repo is small; entropy compounds fast.*

- **ESLint must pass before commit on both `backend/` and `frontend/`.** `npm run lint` in each.
  *Why: cheap, automatic, catches the top 10% of regressions.*

- **Magic numbers (grid bounds, player counts, safety break, timeouts) live in `backend/src/constants/app.constants.ts` or `frontend/src/lib/` constants.** Not inline.
  *Why: tuning is easier and the values get documented by being named.*

- **File size soft cap: 300 lines.** If a file crosses it, split by concern.
  *Why: bigger files mean Claude Code loads the whole thing to edit one line.*

## Commits

- **Use Conventional Commits.** `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`.
  *Why: changelogs, bisecting, and release tooling all get easier.*

- **Scope commits to one concern.** `feat(backend): add make_move handler`, not `feat: everything from M5`.
  *Why: bisect needs small commits. So does code review.*

- **Reference the milestone in the commit body when applicable.** First line is conventional; second paragraph can say `M5`.
  *Why: milestones drive the plan; linking commits to them keeps history legible.*

## When in doubt

Read the relevant `docs/context/*.md` file. Ask before breaking a rule. Rules can evolve, but only in a commit that updates this file.
