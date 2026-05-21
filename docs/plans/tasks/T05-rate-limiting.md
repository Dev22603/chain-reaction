# T05 — Rate limiting that works behind Fly (per-IP HTTP + per-IP WS + public-read limit)

**Priority:** P0 · **Effort:** M · **Findings:** F-05 (High), F-06 (Medium) · **Depends on:** T02

**Files:** `backend/src/middlewares/rateLimit.middleware.ts`, `backend/src/routes/index.ts` (or per-router), `backend/src/realtime/websocket.ts`

> Read `backend/RULES.md`, `docs/plans/tasks/README.md`, findings F-05/F-06. T02 must be merged (provides `trust proxy` + `getClientIp`).

## Context
HTTP uses `express-rate-limit` (`authLimiter`: 10/15min) applied only to `/auth/signup` and `/auth/login`. The WS layer counts messages **per socket** in a `WeakMap` (`WS_RATE_LIMIT_MAX = 60`/min).

## Problem (F-05, F-06)
- HTTP limiter keys on `req.ip`; pre-T02 that was Fly's proxy IP, so all users shared one bucket. With T02's `trust proxy` it's now the real IP — verify the limiter actually keys on it.
- WS limiting is **per socket**, so opening N sockets gives N× the budget, and there's no per-IP aggregation. A flood from one source isn't stopped.
- Public read endpoints (`/leaderboard`, `/players/:id`, `/players/:id/matches`) have **no** limit → DB-load DoS.

## Do this
1. **HTTP keying:** ensure `express-rate-limit` keys on the real client IP. With `trust proxy` set (T02) the default `req.ip` is correct; for robustness set `keyGenerator: (req) => getClientIp(req)`. Keep `authLimiter` strict.
2. **Public-read limiter (F-06):** add a separate, looser limiter (e.g., 100/min per IP) and apply it to the leaderboard/players routers (not auth — that stays strict). Mount in `routes/index.ts` or per-router.
3. **WS per-IP limiting (F-05):** aggregate the message-rate budget **by client IP**, not by socket. Replace/augment the per-socket `WeakMap` with an IP-keyed sliding window (in-memory `Map<string, …>`, resolved via `getClientIp(request)` captured at connection). Add a **global** message budget too. On sustained abuse, `socket.close(1008, "rate limited")` rather than only dropping messages. Reuse the existing `WS_RATE_LIMIT_*` constants; add `WS_RATE_LIMIT_MAX_PER_IP` / `WS_GLOBAL_MSG_BUDGET` as needed in `app.constants.ts`.
4. Clean up per-IP entries on disconnect to avoid a new leak.

## Out of scope
No protocol changes. The connection caps live in T03. No frontend. **Scale note (leave a code comment):** in-memory limiting is per-machine; multi-machine would need shared state — explicitly deferred.

## Acceptance criteria
- HTTP limiters key on the real client IP (two different IPs get independent buckets; one IP hitting the cap doesn't throttle another).
- Opening multiple WS connections from one IP shares one message budget; a single host flooding messages gets disconnected.
- Public read endpoints reject excessive requests with HTTP 429.
- Normal play and normal leaderboard browsing are unaffected.

## Verify
`cd backend && npm run build && npm run lint`. Manual: hammer `/api/leaderboard` past the limit → 429; open 2 sockets from one host and exceed the per-IP message budget → both get rate-limited/closed; confirm a normal game is unaffected.

## Commit message
```
fix(rate-limit): key limits on real client IP and aggregate WS limits per IP
```
