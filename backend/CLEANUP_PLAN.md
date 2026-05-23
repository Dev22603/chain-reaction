# Plan: Independent REST-API cleanup tasks for `backend/`

## Context

`backend/` is a real-time Chain Reaction game (Express + ws + Prisma 7). The REST surface (auth, health, leaderboard, players) already follows a layered architecture, but a per-file audit against the finance-dashboard blueprint surfaced ~15 small, mostly-independent inconsistencies that each hurt readability or hide a latent bug. A prior pass produced `backend/CLEANUP_PLAN.md`, which proposes one big PR with sequenced renames-first work. The user wants the opposite: many **small, independent, executable tasks** so each can land on its own and each one yields a visible readability win.

Scope: **REST only.** Websockets, handlers, realtime, state, game logic are explicitly out of scope.

Hard constraints inherited from `CLEANUP_PLAN.md` (do not undo):
- `ApiError` signature stays `(code: string, message, errors[], statusCode)` — it's protocol-level for the WS error frame. Do not migrate to numeric `code`.
- RBAC is out of scope. The game has only guest/auth, no role hierarchy. Do not add `authorize(roles)` middleware.
- The HTTP/WS error envelope `{type, code, message, errors?}` is the protocol contract — do not change to `{success, error}`.
- No new test framework (RULES.md §11).

Two task tiers below. **Tier 1** tasks are fully independent — each can land alone, in any order, with no cross-task merge risk. **Tier 2** tasks are real blueprint-alignment work that touches many files or breaks a wire format; each is independent of other Tier 2 tasks but is itself a coordinated change. Tier 2 is listed last and flagged.

---

## Tier 1 — Independent atomic tasks

Each task: scope ≤ 3 files, no overlap with sibling tasks, ships on its own.

### T1. Add a 404 handler for unknown REST routes
- **Files:** `src/app.ts`, `src/constants/app.constants.ts`, `src/constants/app.messages.ts`.
- **What:** Add `ERROR_CODES.NOT_FOUND = "not_found"` and `SERVER_MESSAGES.NOT_FOUND = "Route not found"`. Insert a catch-all `app.use((req, res) => res.status(404).json({type: MESSAGE_TYPES.ERROR, code: ERROR_CODES.NOT_FOUND, message: ...}))` between `app.use("/api", apiRouter)` (line 36) and `app.use(errorMiddleware)` (line 37).
- **Impact:** Unknown URLs now return the standard error envelope instead of Express's default HTML 404. Closes a real protocol gap. Documentable, testable in one curl.
- **Verify:** `curl http://localhost:8080/api/nope` → `{"type":"error","code":"not_found",...}` with status 404.

### T2. Fix `lib/prisma.ts` double env read
- **Files:** `src/lib/prisma.ts`, `src/constants/config.ts`.
- **What:** Line 7 reads `process.env.DATABASE_URL` directly while line 3 already imports `config`. Switch to `config.DATABASE_URL`. Narrow `config.DATABASE_URL` from `string | undefined` to `string` by throwing at module load if missing in any environment (currently only thrown in production).
- **Impact:** Removes the only RULES.md §M2.1 violation in the codebase ("don't read `process.env` outside config"). All consumers stop needing to handle `undefined`.
- **Verify:** `npx tsc --noEmit` green; `npm run dev` boots; intentionally unset `DATABASE_URL` → fails fast at startup with clear message.

### T3. Delete dead `playersRepo.upsert`
- **Files:** `src/db/repos/players.ts`.
- **What:** Lines 57-70 export `upsert` that nothing calls (`matchesRepo.recordFinished` inlines its own upsert at `matches.ts:9-21`). Confirm with `Grep "playersRepo\.upsert"` first. Delete.
- **Impact:** -14 lines of dead code; one less misleading helper for future readers.
- **Verify:** `npx tsc --noEmit` + `npm run build` green.

### T4. Remove dead defensive code in `players.controller.ts` `getPlayerId`
- **Files:** `src/controllers/players.controller.ts`.
- **What:** Lines 26-29 — `Array.isArray(value) ? value[0] ?? "" : value ?? ""`. Express `req.params` values are always `string`, never arrays. Replace with `request.params.playerId`.
- **Impact:** Removes 3 lines of confused defensive coding. Future readers don't need to wonder why we're array-checking a path param.
- **Verify:** existing player endpoints still work; `npm run build` green.

### T5. Extract shared `normalizeLimit` helper
- **Files:** new `src/utils/pagination.ts`; edit `src/services/leaderboard.service.ts`, `src/services/players.service.ts`.
- **What:** The function exists verbatim in both services (only the default const differs). Extract `normalizeLimit(raw: unknown, fallback: number, max: number): number` into `utils/pagination.ts`. Import in both services. Also remove the duplicate `Number(request.query.limit)` coercion in `players.controller.ts:13,20` and `leaderboard.controller.ts:7` by passing the raw value through to the service (the helper handles `unknown`).
- **Impact:** One canonical pagination clamp; controllers stop doing partial coercion that services then redo. ~12 lines down to ~6.
- **Verify:** `GET /api/leaderboard?limit=10000` and `?limit=abc` and `?limit=-1` all return sensible defaults.

### T6. Move scoring policy out of `scores` repository
- **Files:** new `src/constants/scoring.constants.ts` (or extend `app.constants.ts`); `src/db/repos/scores.ts`.
- **What:** The literal `winner ? 3 : 1` appears 3× in `scores.ts:33,46,53-54` — business policy embedded in persistence. Extract `SCORING_POINTS = { WIN: 3, LOSS: 1 }`. Replace all 3 sites. Optional follow-up (separate task): make the repo accept pre-computed deltas instead of deriving them; that's T6.5, deferred.
- **Impact:** One place to change scoring policy. Repository regains its "just persistence" role.
- **Verify:** `npm run smoke:logic` and a fresh ranked match still produces the same `+3/+1` deltas.

### T7. Add `health.services.ts` and route the controller through it
- **Files:** new `src/services/health.service.ts`; edit `src/controllers/health.controller.ts`.
- **What:** Currently `healthController.show` returns `{status:"ok"}` inline. Every other domain has a service. Add `healthService = { getStatus() { return { status: "ok", uptime: process.uptime() }; } }`. Controller calls it.
- **Impact:** Restores controller→service discipline universally. Future readers don't see one inconsistent leaf. Adds free uptime telemetry.
- **Verify:** `GET /api/health` → `{...,"data":{"status":"ok","uptime":<number>}}`.

### T8. Prune the `recentEvents` map in `securityLogger.ts` (memory leak)
- **Files:** `src/utils/securityLogger.ts`.
- **What:** Line 5 declares `recentEvents: Map<string, number>` for throttling, but entries are never deleted. Long-running processes leak. Add either: (a) prune entries older than `2 × throttle window` whenever the map exceeds a threshold size, or (b) replace with a TTL-pruning helper on every write.
- **Impact:** Bounded memory under sustained auth-event load. Removes a real production-risk smell.
- **Verify:** Smoke test by hammering `POST /api/auth/login` with bad creds for 1 minute; map size stays bounded.

### T9. Add Express type augmentation for `response.locals.auth`
- **Files:** new `src/types/express.d.ts` (or extend existing); `src/controllers/auth.controller.ts`, `src/controllers/players.controller.ts`.
- **What:** Today controllers cast: `response.locals.auth as AuthTokenPayload`. Declare a module augmentation:
  ```ts
  declare global { namespace Express { interface Locals { auth?: AuthTokenPayload; } } }
  ```
  Drop the casts (controllers can still narrow with `if (!response.locals.auth) throw ...`).
- **Impact:** No more `as` casts in auth-touching controllers. Type system enforces the contract that `requireAuth` populated `locals.auth`.
- **Verify:** `npx tsc --noEmit` green; all auth-protected endpoints still work.

### T10. Add per-file `getLogger()` to controllers
- **Files:** `src/controllers/auth.controller.ts`, `health.controller.ts`, `leaderboard.controller.ts`, `players.controller.ts`.
- **What:** Each file declares `const logger = getLogger("<name>.controller")` at the top and adds one `logger.info(...)` or `logger.warn(...)` line per non-trivial code path (e.g. login success/failure). RULES.md §6 mandates one named logger per file; today controllers have none.
- **Impact:** Uniform observability across the REST layer. Failed logins, leaderboard fetches, etc. become traceable in logs.
- **Verify:** Run server, hit each endpoint, confirm log lines appear with the expected child-logger name.

### T11. Add per-file `getLogger()` to services
- **Files:** `src/services/auth.service.ts`, `leaderboard.service.ts`, `players.service.ts`.
- **What:** Same as T10 but for services. Add at minimum: signup-created log in `auth.service`, leaderboard-fetch debug in `leaderboard.service`, profile-fetch debug in `players.service`.
- **Impact:** Mirrors blueprint convention; services become diagnosable without sprinkling temporary logs.
- **Verify:** same as T10.

### T12. Add per-file `getLogger()` to repositories
- **Files:** `src/db/repos/players.ts`, `matches.ts`, `scores.ts`.
- **What:** Same pattern. At minimum wrap DB writes with try/catch that logs `logger.error("DB error — <op>", { error: ... })` then rethrows. Per RULES.md §10 DB failures must log.
- **Impact:** Postgres failures now produce structured logs at the persistence boundary instead of bubbling silently. Aligns with the same `try { ... } catch (err) { logger.error(...); throw err; }` pattern already used in `matchesRepo.recordFinished`.
- **Verify:** Stop Postgres mid-request; observe `logger.error` line; client still receives an `internal_error`.

### T13. Normalize rate-limit response envelope
- **Files:** `src/middlewares/rateLimit.middleware.ts`.
- **What:** Lines 23, 33 emit `{ error: "rate_limited", ... }`. The standard project envelope (from `error.middleware.ts`) is `{ type: "error", code: "rate_limited", message: ... }`. Replace the two `message:` payloads to match. Add `RATE_LIMITED` constant if not present.
- **Impact:** Frontends see one error shape across all REST failures (validation, auth, rate-limit, 404, 500) — currently they need a branch for rate limits.
- **Verify:** Hammer `/api/auth/login` past the limit; response body matches the standard envelope; status 429.

### T14. Wrap `health.routes.ts` handler with `asyncHandler`
- **Files:** `src/routes/health.routes.ts`.
- **What:** Every other route uses `asyncHandler(handler)`. Health uses bare `healthController.show`. Wrap for consistency, even though the handler is sync today (so future async additions don't introduce a quiet `next()` bug).
- **Impact:** One pattern across all routes; eliminates the "why is this route different?" question.
- **Verify:** `curl /api/health` still returns 200.

---

## Tier 2 — Larger but still independent passes

Each is one cohesive pass that touches many files. Each can ship on its own PR — but inside the PR, it's not splittable further without leaving the codebase in a broken state.

### T15. Move Zod validation from controllers into services
- **Files:** `src/schemas/auth.schemas.ts`, `src/services/auth.service.ts`, `src/controllers/auth.controller.ts`, `src/middlewares/error.middleware.ts`.
- **What:** Add `validateSignup(data: unknown)` and `validateLogin(data: unknown)` in `auth.schemas.ts` that `safeParse` and throw `ApiError(VALIDATION_FAILED, ...)` on failure — mirror the existing `validateMessage` pattern in `messages.schemas.ts`. Change services to accept `unknown` and call the validator. Remove `SignupSchema.parse(request.body)` from the controller. Remove the now-dead `ZodError` branch (`error.middleware.ts:13-21`).
- **Impact:** Validation owned by the layer that consumes it (service), per RULES.md §5. Controllers shrink to pure I/O. Error middleware shrinks by 8 lines.
- **Wire format:** unchanged (both paths emit `{code:"validation_failed", errors:[...]}`).
- **Verify:** `POST /api/auth/signup -d '{}'` → 400 with same error shape as before.

### T16. Replace `apiResponse()` function with `ApiResponse` class — **breaks frontend wire format**
- **Files:** `src/utils/api_response.ts` + all 4 controllers + `frontend/src/lib/api.ts`.
- **What:** Function → class: `class ApiResponse<T> { constructor(public code, public message, public data) }`. Update all 4 controllers to `new ApiResponse(200, "...", result)`. **Same-PR frontend update:** `frontend/src/lib/api.ts:78-79,123` reads `{success, data}`; drop the discriminator (read `data` directly since errors are caught by HTTP status).
- **Impact:** Wire shape becomes `{code, message, data}` matching blueprint; responses now carry a human message which helps debugging.
- **Not independent:** must ship with frontend change atomically.
- **Verify:** Frontend smoke flow (login → leaderboard → profile) all work; network tab shows new shape.

### T17. Rename `db/repos/` → `repositories/` + plural file naming — **requires RULES.md amendment**
- **Files:** all of `src/db/repos/*` (rename), `src/db/index.ts` (rename); all controllers/services (rename to plural); every importer; `backend/RULES.md` §2/§3/§10; `backend/CLAUDE.md` if it references the path.
- **What:** Mechanical rename only. Keep barrel export names (`playersRepo`, etc.).
- **Impact:** Aligns folder/file naming with blueprint and with every other repo on the team. Pure consistency.
- **Not independent:** the rename and the RULES.md edit MUST land in the same commit per RULES.md §1.
- **Verify:** `npx tsc --noEmit` green; `npm run dev` boots; grep confirms no `db/repos` import survives.

---

## Recommended ordering (not required — each Tier 1 is independent)

If the user wants a suggested order, sort by **value / effort**:

1. **Highest value, lowest risk:** T1 (404), T2 (prisma env), T7 (health service), T6 (scoring constants), T8 (memory leak).
2. **Hygiene wins:** T3 (dead code), T4 (defensive coercion), T5 (normalizeLimit), T13 (rate-limit envelope), T14 (asyncHandler).
3. **Observability batch:** T10 + T11 + T12 (loggers everywhere). Could combine into one PR if reviewer prefers.
4. **Typing:** T9 (Express augmentation).
5. **Architectural:** T15 (validation moves) → T16 (ApiResponse) → T17 (renames). T17 last so Tier 1 PRs don't get rebase pain.

## Critical files to modify (index)

| Path | Touched by |
|------|------------|
| `src/app.ts` | T1 |
| `src/lib/prisma.ts` | T2 |
| `src/constants/config.ts` | T2 |
| `src/constants/app.constants.ts` | T1, T6, T13 |
| `src/constants/app.messages.ts` | T1 |
| `src/utils/pagination.ts` (new) | T5 |
| `src/utils/api_response.ts` | T16 |
| `src/utils/securityLogger.ts` | T8 |
| `src/middlewares/rateLimit.middleware.ts` | T13 |
| `src/middlewares/error.middleware.ts` | T15 |
| `src/schemas/auth.schemas.ts` | T15 |
| `src/controllers/*.controller.ts` | T4, T9, T10, T15, T16 |
| `src/services/*.service.ts` | T5, T6, T7 (new), T11, T15 |
| `src/db/repos/*.ts` | T3, T6, T12, T17 |
| `src/routes/health.routes.ts` | T14 |
| `src/types/express.d.ts` (new) | T9 |
| `backend/RULES.md` | T17 |
| `frontend/src/lib/api.ts` | T16 |

## Verification (per task and combined)

Per task: `npx tsc --noEmit && npm run lint && npm run build && npm run smoke:logic`.

End-to-end after each PR: start backend + frontend; run the RULES.md §11 manual flow (signup → join queue → game → game_over); confirm WS error frames still carry string `code` (protocol unchanged).
