# T07 — Process resilience & observability (graceful shutdown, crash handlers, prod log level, security events)

**Priority:** P1 · **Effort:** M · **Findings:** F-20 (Medium), F-18 (Medium), F-19 (Medium) · **Depends on:** T02

**Files:** `backend/src/index.ts`, `backend/src/lib/logger.ts`, `backend/src/lib/prisma.ts`, `backend/src/realtime/websocket.ts`, `backend/src/router.ts`, `backend/src/middlewares/rateLimit.middleware.ts`

> Read `backend/RULES.md`, `docs/plans/tasks/README.md`, findings F-18/F-19/F-20. T02 provides `getClientIp` for IP-aware logs. If T03/T05 added a ping interval / reaper, wire their `clearInterval`/`stop` into shutdown here.

## Context
`index.ts` only calls `server.listen`. Prisma is created with `log: ["query","info","warn","error"]`. Logging is lifecycle-only; nothing flags attacks, and no client IP is captured.

## Problem
- **F-20:** no `SIGTERM`/`SIGINT` handling (Fly sends `SIGTERM` on every deploy → games dropped abruptly, no DB drain), and no `unhandledRejection`/`uncaughtException` handler (one stray async error crashes the whole server, dropping all games, unlogged).
- **F-18:** `query` logging emits player emails (PII) and huge volume in production.
- **F-19:** attacks are invisible until the box falls over; no IP captured for correlation.

## Do this
1. **Graceful shutdown (F-20):** on `SIGTERM`/`SIGINT` — stop accepting new connections (`server.close`), close the `WebSocketServer` (1001 going-away), `clearInterval` any heartbeat/reaper timers (from T03/T04), `await prisma.$disconnect()`, then `process.exit(0)`; guard against double-invocation; add a timeout fallback that force-exits.
2. **Crash handlers (F-20):** register Winston `exceptionHandlers`/`rejectionHandlers` in `logger.ts` (or `process.on("uncaughtException"|"unhandledRejection")` in `index.ts`) that log structured detail then exit non-zero so Fly restarts a clean process.
3. **Prod log level (F-18):** in `prisma.ts`, `log: config.NODE_ENV === "production" ? ["warn","error"] : ["query","info","warn","error"]`.
4. **Security events (F-19):** emit rate-limited `warn` logs (with a **truncated/hashed** client IP via `getClientIp`) for: rate-limit trips (WS + HTTP), oversized/malformed frames, rejected origins, and auth-failure bursts. Don't log full IPs or any token/PII (ties to privacy, T12). Keep volume bounded (e.g., sample or aggregate).

## Out of scope
No protocol changes. No frontend. Don't build alerting infra (free tier = `fly logs`); just make events searchable.

## Acceptance criteria
- `SIGTERM` triggers a clean shutdown (sockets closed, Prisma disconnected, timers cleared) within a few seconds.
- An unhandled rejection/exception is logged with detail and exits non-zero (doesn't hang silently).
- Production Prisma logging no longer emits queries/emails.
- Security-relevant events appear as structured `warn` logs with a non-PII IP token.

## Verify
`cd backend && npm run build && npm run lint`. Manual: send `SIGTERM` to the dev process → observe clean shutdown logs; set `NODE_ENV=production` → confirm no query logs; trip a rate limit → confirm a `warn` event with a truncated IP.

## Commit message
```
feat(ops): graceful shutdown, crash handlers, prod log level, and security event logs
```
