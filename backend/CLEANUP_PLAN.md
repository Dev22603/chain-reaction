# Plan: Apply finance-dashboard blueprint patterns to clean the chain-reaction backend

## Context

`backend/` is a real-time multiplayer Chain Reaction game (Express + ws + Prisma 7 + Postgres). It already follows a layered architecture (routes → controllers → services → repos for HTTP, and router → handlers → state/repos for WebSocket), but inventory uncovered several inconsistencies vs. the blueprint patterns and a handful of latent bugs:

- HTTP controllers call `Schema.parse(req.body)` directly instead of delegating validation to the service layer.
- The HTTP success envelope is a `apiResponse(data)` function returning `{success, data}`; the blueprint uses an `ApiResponse` class with `{code, message, data}`.
- The repository folder is `src/db/repos/` (mandated by `RULES.md`) but the blueprint prescribes `src/repositories/<entity>.repositories.ts`. File naming is singular (`*.controller.ts`, `*.service.ts`) where the blueprint uses plural (`*.controllers.ts`, `*.services.ts`).
- WebSocket `handlers/game.handlers.ts` mixes state manipulation, scoring policy, ranked-velocity caps, and direct repository calls into a single ~370 line file with no service layer between handler and persistence.
- `src/lib/prisma.ts` reads `process.env.DATABASE_URL` directly while importing `config`; `config.DATABASE_URL` is the typed source of truth.
- `playersRepo.upsert` is exported but never called outside the matches-repo internal flow.
- `prisma/seed.ts` is a no-op stub.
- `src/app.ts` has no catch-all 404 before `errorMiddleware` — unknown routes hang or return Express defaults.
- `healthController.show` returns `{status:"ok"}` directly, breaking the controller→service discipline that holds for every other domain.

The user picked: **apply structural patterns only, keep the game domain**. RBAC is out of scope (game has guest/auth binary, no role hierarchy).

Intended outcome: the codebase reads consistently end-to-end, matches the blueprint where it can without breaking the game protocol or the WS/HTTP error-frame contract, and the listed oddities are gone. No domain changes; no protocol changes.

## Scope decisions and constraints (read first)

1. **Keep `ApiError`'s existing signature.** Blueprint uses numeric `code` (= HTTP status). Existing code uses `code: string` (e.g. `"validation_failed"`) plus a separate `statusCode: number`. The WS error frame and HTTP error envelope both rely on the string code as a protocol-level identifier (see `src/middlewares/error.middleware.ts:14-22` and `src/router.ts:54-64`). Changing it is a protocol break. **Do not migrate.**

2. **`ApiResponse` class adoption is a wire-format change.** Switching from `{success: true, data}` to `{code, message, data}` will break every frontend HTTP read. Frontend in `frontend/` must be updated in the same commit. Verify there is no other consumer of `{success, data}` before merging.

3. **`db/repos/` → `repositories/` rename requires updating `RULES.md`** (section 2 "File map" and section 10 "Database boundary" reference `backend/src/db/`). RULES.md mandates "if you're about to break a rule, ask, and if it changes, update this file in the same commit."

4. **`router.ts` stays a pure dispatcher.** The new WS service layer slots between handlers and persistence (handlers still manage state Maps + game flow); services own scoring policy, velocity caps, and persistence orchestration. Do NOT push business logic into `router.ts`.

5. **No new tests.** RULES.md §11 forbids adding Jest/Vitest until post-M7; the smoke-logic guard in `gameLogic.ts` remains the only test surface.

## Work areas (concrete, file-level)

### Area 1 — File/folder rename (mechanical)

Rename plural-form for consistency with blueprint:

| From | To |
|---|---|
| `src/controllers/auth.controller.ts` | `src/controllers/auth.controllers.ts` |
| `src/controllers/health.controller.ts` | `src/controllers/health.controllers.ts` |
| `src/controllers/leaderboard.controller.ts` | `src/controllers/leaderboard.controllers.ts` |
| `src/controllers/players.controller.ts` | `src/controllers/players.controllers.ts` |
| `src/services/auth.service.ts` | `src/services/auth.services.ts` |
| `src/services/leaderboard.service.ts` | `src/services/leaderboard.services.ts` |
| `src/services/players.service.ts` | `src/services/players.services.ts` |
| `src/db/repos/players.ts` | `src/repositories/players.repositories.ts` |
| `src/db/repos/matches.ts` | `src/repositories/matches.repositories.ts` |
| `src/db/repos/scores.ts` | `src/repositories/scores.repositories.ts` |
| `src/db/index.ts` | `src/repositories/index.ts` |

Also rename schemas for plural form: `src/schemas/auth.schemas.ts` already plural ✓, `src/schemas/messages.schemas.ts` already plural ✓.

For each rename:
- Update all importers (NodeNext-style `.js` extensions — every relative import will need the new path).
- Use `Grep` for `from "../db/` and `from "./repos/` to find all import sites.
- Keep the barrel export shape intact (`playersRepo`, `matchesRepo`, `scoresRepo` names unchanged).

### Area 2 — Move Zod validation from controllers into services

Pattern (blueprint `references/code-patterns.md` lines 385-426):

In `src/schemas/auth.schemas.ts`, **add** wrapper validators alongside the existing schemas:

```ts
import { ApiError } from "../utils/api_error.js";
import { ERROR_CODES } from "../constants/app.constants.js";
import { SERVER_MESSAGES } from "../constants/app.messages.js";

export function validateSignup(data: unknown): SignupInput {
    const result = SignupSchema.safeParse(data);
    if (!result.success) {
        throw new ApiError(
            ERROR_CODES.VALIDATION_FAILED,
            SERVER_MESSAGES.VALIDATION_FAILED,
            result.error.issues.map(i => i.message),
            400
        );
    }
    return result.data;
}

export function validateLogin(data: unknown): LoginInput {
    const result = LoginSchema.safeParse(data);
    if (!result.success) {
        throw new ApiError(
            ERROR_CODES.VALIDATION_FAILED,
            SERVER_MESSAGES.VALIDATION_FAILED,
            result.error.issues.map(i => i.message),
            400
        );
    }
    return result.data;
}
```

In `src/services/auth.services.ts` (post-rename), change signatures:
- `signup(input: SignupInput)` → `signup(input: unknown)` and call `validateSignup(input)` as first line.
- Same for `login`.

In `src/controllers/auth.controllers.ts` (post-rename):
- Drop `SignupSchema.parse(request.body)` / `LoginSchema.parse(request.body)`.
- Pass `request.body` directly: `await authService.signup(request.body)`.

**Wire format unchanged.** Today: `Schema.parse()` throws `ZodError` → `errorMiddleware` emits `{code:"validation_failed", errors:[...]}`. After: `validateSignup()` throws `ApiError(VALIDATION_FAILED)` → `errorMiddleware` emits the same `{code:"validation_failed", errors:[...]}`. No frontend impact.

### Area 3 — Adopt `ApiResponse` class

Rewrite `src/utils/api_response.ts`:

```ts
class ApiResponse<T> {
    code: number;
    message: string;
    data: T;
    constructor(code: number, message: string = "Success", data: T) {
        this.code = code;
        this.message = message;
        this.data = data;
    }
}

export { ApiResponse };
```

Update every controller call site (4 files):
- `src/controllers/auth.controllers.ts` — 3 calls (signup, login, me)
- `src/controllers/health.controllers.ts` — 1 call
- `src/controllers/leaderboard.controllers.ts` — N calls (check file)
- `src/controllers/players.controllers.ts` — N calls (check file)

Pattern change:
```ts
// before
response.status(201).json(apiResponse(result));
// after
response.status(201).json(new ApiResponse(201, "Account created", result));
```

**Frontend impact — single chokepoint identified**: `frontend/src/lib/api.ts` is the only HTTP consumer. Specifically:
- Line 78-79: `ApiSuccess<T> = { success: true; data: T }` — type definition
- Line 123: `return (payload as ApiSuccess<T>).data;` — the only read site

Change required: drop the `success: true` discriminator (replace with `code: number` discriminator or simply read `data` unconditionally since errors are caught upstream by HTTP status). Total frontend change is ~5 lines in one file. Verify nothing else consumes the shape:
```bash
Grep "\.success" frontend/src
Grep "ApiSuccess" frontend/src
```
Document the envelope change in `docs/PROTOCOL.md` if it references the HTTP shape.

### Area 4 — WS service layer (extract from `handlers/game.handlers.ts`)

Create `src/services/match.services.ts`. Move out of `handlers/game.handlers.ts`:
- `persistFinishedMatch()` (currently lines 282-373)
- `computeAuthDeltas()` (currently lines 176-184)
- The ranked-velocity-cap logic inside `persistFinishedMatch` (lines 335-371)

New service shape:
```ts
import { matchesRepo, scoresRepo } from "../repositories/index.js";
import { rankedCompletions } from "../state/memory.js";
import { RANKED_VELOCITY_LIMIT, RANKED_VELOCITY_WINDOW_MS } from "../constants/app.constants.js";
import type { Room } from "../types/game.js";
import type { ScoreDeltas } from "../types/scoring.js";

export const matchService = {
    computeAuthDeltas(room: Room, winnerId: string): ScoreDeltas { /* ... */ },
    async persistFinishedMatch(roomSnapshot, winnerId: string): Promise<void> { /* ... */ },
};
```

`game.handlers.ts` `endGame()` becomes orchestration only:
1. Set `room.status = "finished"`.
2. Build score deltas via `matchService.computeAuthDeltas`.
3. Broadcast `game_over`.
4. Snapshot room.
5. Call `destroyRoom(room)`.
6. `matchService.persistFinishedMatch(snapshot, winner.id).catch(...)` — error-path broadcast stays in handler.

This keeps state-Map writes (`destroyRoom`, `players.get`, etc.) in handlers (per RULES.md §2) and moves persistence + scoring policy into services (matches blueprint discipline). `game.handlers.ts` should drop from ~370 lines to ~240, below RULES.md's 300-line soft cap.

Update `src/services/leaderboard.services.ts` and `src/services/players.services.ts` imports from `../db/index.js` → `../repositories/index.js` (covered by Area 1).

### Area 5 — Oddity fixes

**5a. `src/lib/prisma.ts` double-env read** (line 7):
```ts
// before
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
// after
const pool = new pg.Pool({ connectionString: config.DATABASE_URL });
```
Also narrow `config.DATABASE_URL` type — currently `string | undefined`. In `src/constants/config.ts`, either throw at load time if missing (already done for production) or assert here:
```ts
if (!config.DATABASE_URL) throw new Error("DATABASE_URL is required");
```

**5b. Add 404 handler** in `src/app.ts` between `app.use("/api", apiRouter)` and `app.use(errorMiddleware)`:
```ts
app.use((req, res) => {
    res.status(404).json({
        type: MESSAGE_TYPES.ERROR,
        code: ERROR_CODES.NOT_FOUND,
        message: "Route not found"
    });
});
```
Add `NOT_FOUND: "not_found"` to `ERROR_CODES` in `src/constants/app.constants.ts` and a matching `NOT_FOUND` entry in `SERVER_MESSAGES`. Add a row to `docs/PROTOCOL.md` error codes table (per RULES.md §13 "New error code").

**5c. Add `health.services.ts`** at `src/services/health.services.ts`:
```ts
export const healthService = {
    getStatus() {
        return { status: "ok", uptime: process.uptime() };
    }
};
```
Update `health.controllers.ts` to call `healthService.getStatus()`.

**5d. Remove dead code**:
- Delete `playersRepo.upsert` (lines 57-70 in current `src/db/repos/players.ts`) — confirm with `Grep "playersRepo\.upsert"` first.
- Replace `prisma/seed.ts` stub with either (a) a no-op that just logs "no seed defined" and exits cleanly, or (b) delete it and remove the seed entry from `prisma.config.ts`. Recommend (a) since `package.json` ships a `db:seed` script.
- `scripts/recompute-scores.ts` — confirm unused with `Grep "recompute-scores"`; if confirmed dead, ask before deleting (it may be operationally important).

### Area 6 — RULES.md amendments (same commit as Area 1 rename)

Update `backend/RULES.md`:
- §2 "File map: `backend/src/`": change `db/` block to `repositories/`, update file names to plural form.
- §10 "Database boundary": change `Handlers/services import only from backend/src/db/index.js` → `backend/src/repositories/index.js`. Update the import example.
- §3 "File naming": update entries — controllers/services/repos plural form.

## Critical files to modify

| Path | Reason |
|---|---|
| `backend/src/utils/api_response.ts` | Replace function with class (Area 3) |
| `backend/src/controllers/*.controllers.ts` (renamed) | Use `new ApiResponse(...)`, drop schema parse (Areas 2, 3) |
| `backend/src/services/auth.services.ts` (renamed) | Validate inside service (Area 2) |
| `backend/src/services/match.services.ts` (new) | Extracted persistence + scoring (Area 4) |
| `backend/src/services/health.services.ts` (new) | Symmetric health layer (Area 5c) |
| `backend/src/handlers/game.handlers.ts` | Trim to orchestration; call match service (Area 4) |
| `backend/src/schemas/auth.schemas.ts` | Add `validateSignup`/`validateLogin` wrappers (Area 2) |
| `backend/src/repositories/*` (renamed from `db/repos/*`) | Folder + filename rename (Area 1) |
| `backend/src/lib/prisma.ts` | Use `config.DATABASE_URL` (Area 5a) |
| `backend/src/app.ts` | Add 404 handler (Area 5b) |
| `backend/src/constants/app.constants.ts` | Add `ERROR_CODES.NOT_FOUND` (Area 5b) |
| `backend/src/constants/app.messages.ts` | Add `SERVER_MESSAGES.NOT_FOUND` (Area 5b) |
| `backend/prisma/seed.ts` | Replace no-op stub (Area 5d) |
| `backend/RULES.md` | Folder/naming amendments (Area 6) |
| `backend/CLAUDE.md` | Update if it references `db/repos/` |
| `docs/PROTOCOL.md` | Add NOT_FOUND error code row; if envelope shape mentioned, update |
| `frontend/**` | Audit + update HTTP response readers if envelope key change breaks them (Area 3) |

## Reusable patterns to lean on

- `getLogger(name)` per file — already universal, keep.
- `ApiError(code, message, errors, statusCode)` — keep, do not change signature.
- Object-literal services (`export const xService = { ... }`) — already idiomatic; keep this for the new `matchService` and `healthService`.
- `safeParse` + `ApiError(VALIDATION_FAILED, ...)` — already used in `validateMessage` (`src/schemas/messages.schemas.ts`); reuse same shape for new HTTP validators.

## Execution order — single PR, renames first

This will ship as **one PR**, not staged commits. Within that PR, do the work in this order so each pass operates on a stable shape:

1. **Area 1 + Area 6 (renames + RULES.md/CLAUDE.md amendments)** — mechanical first pass. Rename `db/repos/` → `repositories/`, files to plural form, update every importer, update `RULES.md` §2/§3/§10 and `backend/CLAUDE.md` in the same step. After this pass: `npx tsc --noEmit` green, `npm run dev` boots.
2. **Area 5a, 5b, 5c, 5d** — small isolated bug/cleanup fixes on the new shape.
3. **Area 4** — WS service extraction (`match.services.ts`); imports written against the new `repositories/` paths from step 1.
4. **Area 2** — move Zod parse into services; no wire-format change.
5. **Area 3** — `ApiResponse` class swap + frontend `api.ts` update in lockstep.

Rationale: doing renames first means semantic edits in steps 2–5 land directly on the final file paths — no second pass to update freshly-edited imports. Doing renames last would double-touch every file changed by Areas 2–5.

## Verification

After each area:

```bash
cd backend
npm run db:generate       # if schema or repo paths moved
npx tsc --noEmit          # 0 errors
npm run build             # compiles to dist/
npm run lint              # passes
npm run smoke:logic       # pure game logic still passes
npm run dev               # server starts, logs port from config
```

Smoke tests (live server):
```bash
curl http://localhost:8080/api/health
# expect: {"code":200,"message":"...","data":{"status":"ok",...}}  (post-Area 3)

curl http://localhost:8080/api/does-not-exist
# expect: 404 {"type":"error","code":"not_found",...}  (post-Area 5b)

curl -X POST http://localhost:8080/api/auth/signup -H 'Content-Type: application/json' -d '{}'
# expect: 400 {"type":"error","code":"validation_failed","errors":[...]}
```

End-to-end:
1. Start backend + frontend, open two browser windows.
2. Run through `RULES.md` §11 manual flow: signup → join queue → play → game_over.
3. Confirm:
   - Login persists, `GET /api/auth/me` returns the user.
   - Two completed ranked games update leaderboard.
   - Killing the DB mid-game does NOT block `game_over` (per RULES.md §10).
   - WS `error` frames still carry `code: "validation_failed"` (not numeric) — protocol unchanged.

If any verification step fails, stop and re-plan rather than patch around it.
