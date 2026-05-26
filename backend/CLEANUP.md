# Port finance-dashboard middleware/controller conventions into chain-reaction backend (HTTP only)

## Context

The user maintains two backends — `finance-dashboard` (their reference style) and `chain-reaction` (this repo). They want the **HTTP layer** of chain-reaction to adopt finance-dashboard's coding conventions for consistency across their personal projects.

Chain-reaction's middleware stack is currently more mature than finance-dashboard's (it has `asyncHandler`, a global error middleware, rate limiting, helmet, structured security logging). The user has explicitly chosen to align the HTTP path with finance-dashboard's simpler style — per-controller `try/catch`, no global error middleware, no `asyncHandler`, finance-dashboard's `{code, message, data}` envelope shape, and Zod `validateX` helpers called inline rather than as middleware.

Intended outcome: HTTP controllers, the HTTP auth middleware, Zod usage, and the response envelope shape mirror finance-dashboard. The **WebSocket path is left untouched** — its router, handlers, error frames, `PROTOCOL.md` contract, and `ApiError`/`apiResponse` utilities remain as they are. Security infrastructure (helmet, rate limiters, security logger, trust proxy) is preserved.

## Decisions locked in with the user

1. Two ApiError classes coexist: a new **`HttpApiError`** (finance-dashboard's exact shape: numeric `code`, `message`, `errors[]`) for HTTP, and the existing **`ApiError`** (string `code` + numeric `statusCode`) stays for the WS path.
2. New **`HttpApiResponse<T>`** (`{ code, message, data }`) for HTTP success responses. Existing `apiResponse()` helper (`{ success: true, data }`) stays for WS.
3. The global Express error middleware is **removed**. Each HTTP controller wraps its body in `try { ... } catch (error) { if (error instanceof HttpApiError) return res.status(error.code).json(error); logger.error(...); return res.status(500).json(new HttpApiError(500, SERVER_MESSAGES.INTERNAL_ERROR)); }`.
4. The `asyncHandler` wrapper is **removed** from HTTP routes (controllers self-handle).
5. Auth middleware renamed `requireAuth` → `authenticate`, file `auth.middleware.ts` → `auth.ts`, responds directly on failure (no `next(err)`, no throw), and writes to `req.user` instead of `response.locals.auth` (requires `types/express.d.ts` augmentation).
6. Zod usage moves to **helper functions** (`validateSignup`, `validateLogin`) in `schemas/auth.schemas.ts` that `safeParse` and throw `HttpApiError(400, ..., issues.map(i => i.message))`. Controllers call them instead of `Schema.parse(...)`.
7. Security-event hook for `INVALID_CREDENTIALS` (previously in the global error middleware) moves into `auth.controller.ts`'s `login` catch block.
8. File renames for stylistic alignment: drop the `*.middleware.ts` suffix on the surviving middleware files.

## Files to add

- `backend/src/utils/http_api_error.ts` — `class HttpApiError extends Error { code: number; message: string; errors: string[]; constructor(code, message="Something went wrong", errors=[]) }`. Mirror `finance-dashboard/src/utils/api_error.ts` exactly.
- `backend/src/utils/http_api_response.ts` — `class HttpApiResponse<T> { code: number; message: string; data: T }`. Mirror `finance-dashboard/src/utils/api_response.ts`.
- `backend/src/types/express.d.ts` — module augmentation: `declare global { namespace Express { interface Request { user?: AuthTokenPayload } } }`. Add `backend/src/types` to `tsconfig.json` `include` if not already covered (currently `include: ["src", ...]` so it's already covered).

## Files to modify

- `backend/src/middlewares/auth.middleware.ts` → **rename to** `backend/src/middlewares/auth.ts`.
    - Rename export `requireAuth` → `authenticate`.
    - On missing/invalid token: respond directly `res.status(401).json(new HttpApiError(401, "Access denied. No token provided."))` (and 401 for invalid token — fix the finance-dashboard 400 quirk; we control both projects).
    - Assign `req.user = verifyAccessToken(token)` instead of `response.locals.auth`.
    - Update route imports: `auth.routes.ts`, `players.routes.ts`.
- `backend/src/middlewares/rateLimit.middleware.ts` → **rename to** `backend/src/middlewares/rateLimit.ts`. Update imports in `auth.routes.ts`, `leaderboard.routes.ts`, `players.routes.ts`. No logic change.
- `backend/src/app.ts` — remove `import { errorMiddleware }` and remove `app.use(errorMiddleware)`. Leave helmet, cors, json, trust proxy as-is.
- `backend/src/controllers/auth.controller.ts` — rewrite each handler:
    - Replace `SignupSchema.parse(request.body)` with `validateSignup(request.body)`.
    - Wrap body in `try/catch`; success path returns `new HttpApiResponse(201, SERVER_MESSAGES.SIGNUP_OK, result)`.
    - In `login`'s catch, when `error instanceof HttpApiError && error.code === 401` (invalid credentials) emit `logSecurityEvent("auth_failure", { ip: getClientIp(request), details: "HTTP login invalid credentials" })` before responding. (Service throws `HttpApiError(401, INVALID_CREDENTIALS)` — see service-layer note below.)
    - `me`: read `req.user` (typed as `AuthTokenPayload | undefined`; controller asserts non-null since `authenticate` ran first, or throws `HttpApiError(401, ...)` defensively).
- `backend/src/controllers/health.controller.ts` — rewrite with try/catch + `HttpApiResponse`.
- `backend/src/controllers/leaderboard.controller.ts` — rewrite with try/catch + `HttpApiResponse`.
- `backend/src/controllers/players.controller.ts` — rewrite three handlers; switch `response.locals.auth` → `req.user`; use `HttpApiResponse` + `HttpApiError`.
- `backend/src/routes/auth.routes.ts` — drop `asyncHandler(...)` wrappers; import `authenticate` (renamed); update import path for `auth.ts`.
- `backend/src/routes/health.routes.ts` — drop `asyncHandler`.
- `backend/src/routes/leaderboard.routes.ts` — drop `asyncHandler`; update `rateLimit.ts` import path.
- `backend/src/routes/players.routes.ts` — drop `asyncHandler`; import `authenticate`; update import paths.
- `backend/src/schemas/auth.schemas.ts` — add two exported helpers:
    ```ts
    export function validateSignup(data: unknown): SignupInput {
	const result = SignupSchema.safeParse(data);
	if (!result.success)
		throw new HttpApiError(
			400,
			"Signup validation failed",
			result.error.issues.map((i) => i.message),
		);
	return result.data;
    }
    // same shape for validateLogin
    ```
    Leave the existing `SignupSchema`/`LoginSchema` exports in place — the WS path may still use the raw schemas.
- `backend/src/services/auth.service.ts` — where it currently throws `ApiError(ERROR_CODES.INVALID_CREDENTIALS, ..., 401)` on the HTTP login path, switch to `HttpApiError(401, SERVER_MESSAGES.INVALID_CREDENTIALS)`. Inspect the file first; if a single throw is shared between HTTP and a WS caller, branch the call sites instead of changing both. (The service currently has both `signup` and `login` consumed from HTTP only per `auth.routes.ts` — verify during implementation.)

## Files to delete

- `backend/src/middlewares/error.middleware.ts` — no longer wired.
- `backend/src/middlewares/async_handler.ts` — no longer referenced after route edits.

## Files explicitly NOT touched

- `backend/src/utils/api_error.ts`, `backend/src/utils/api_response.ts` — still used by the WS router.
- `backend/src/router.ts`, `backend/src/realtime/websocket.ts`, `backend/src/handlers/*` — WS path is out of scope.
- `backend/src/schemas/messages.schemas.ts` — WS validators.
- `docs/PROTOCOL.md`, `RULES.md` — WS error frame contract unchanged. **Note:** `RULES.md` will diverge from the HTTP path's new conventions; mention this to the user post-implementation so they can update §4–§5 if desired.
- `backend/src/index.ts` — process-level shutdown and crash handlers stay.

## Reused finance-dashboard patterns (reference paths)

- `finance-dashboard/src/utils/api_error.ts` — template for `HttpApiError`.
- `finance-dashboard/src/utils/api_response.ts` — template for `HttpApiResponse`.
- `finance-dashboard/src/middlewares/auth.ts` (`authenticate`) — template for new chain-reaction `auth.ts`.
- `finance-dashboard/src/schemas/record.schemas.ts` (`validateCreateRecord`) — template for `validateSignup`/`validateLogin`.
- `finance-dashboard/src/controllers/record.controllers.ts` — template for the per-controller try/catch shape.

## Risks & caveats flagged for the user

- **Unhandled rejections become silent 500s with no stack in the response.** Removing the global error middleware means any uncaught throw in a controller (forgot a `try/catch`, forgot `await`) won't be normalized into an `HttpApiError` envelope. `index.ts`'s `unhandledRejection` handler only logs.
- **`RULES.md` §4 (error handling) and §5 (validation) will be out of sync** with the new HTTP conventions. RULES.md says "handlers throw `ApiError`"; the new HTTP controllers will catch and respond instead. Will need a documentation pass after implementation (out of scope here).
- **Frontend HTTP consumers must accept the new envelope.** Anything currently reading `body.success` from auth/leaderboard/players responses will break. The chain-reaction frontend (D:\College\Github_Projects\chain-reaction\frontend) is not in this plan's scope but will need a follow-up sweep.

## Verification

1. `cd backend && npm run build` — TypeScript compile passes (no `any`, strict mode is on per `RULES.md` §9).
2. `cd backend && npm run lint` — ESLint clean.
3. `cd backend && npm run dev` — server boots on `:8080`, no startup errors.
4. Manual HTTP smoke:
    - `POST /api/auth/signup` valid payload → 201 with `{ code: 201, message, data }`.
    - `POST /api/auth/signup` invalid payload → 400 with `{ code: 400, message: "Signup validation failed", errors: [...] }`.
    - `POST /api/auth/login` bad creds → 401 with new envelope; check logs for `auth_failure` security event.
    - `GET /api/auth/me` no token → 401, `{ code: 401, message: "Access denied. No token provided." }`.
    - `GET /api/auth/me` valid token → 200 with player payload.
    - `GET /api/leaderboard` → 200 with `{ code, message, data }`.
    - Hit `/api/auth/login` 11 times in 15 minutes → 429 (rate limiter still active).
5. WS regression check: connect a client, run `npm run smoke:logic`, play a join/move/leave sequence — error frames still carry string `code` per `PROTOCOL.md`. Nothing in the WS path should have changed.
6. Confirm `backend/src/middlewares/` contains exactly `auth.ts` and `rateLimit.ts` (no `*.middleware.ts`, no `async_handler.ts`, no `error.middleware.ts`).
