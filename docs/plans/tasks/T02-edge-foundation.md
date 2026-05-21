# T02 — Edge foundation: trust proxy, client-IP helper, allowed-origins config

**Priority:** P0 · **Effort:** S · **Finding:** part of F-05 (shared building block) · **Depends on:** none

**Files:** `backend/src/app.ts`, `backend/src/utils/clientIp.ts` (new), `backend/src/constants/config.ts`, `backend/.env.example`

> Read `backend/RULES.md` and `docs/plans/tasks/README.md` *Ground rules* first. Backend only. This task is small but **T03, T05, T07, T08 depend on it** — land it early.

## Context
The app runs behind Fly.io's edge proxy. Express's `req.ip` and the WS layer currently never read the real client IP, and there is no shared origin allowlist. Several later tasks need both.

## Problem
Without `trust proxy`, every request appears to come from Fly's proxy IP (breaks per-IP rate limiting — F-05). The real client IP is available via the `Fly-Client-IP` header but is unused. There's also no single source of allowed origins for CORS (T08) and WS origin checks (T03).

## Do this
1. **Trust the proxy** in `app.ts` (Fly is a single hop):
   ```ts
   app.set("trust proxy", 1);
   ```
2. **Add `src/utils/clientIp.ts`** — works for both Express `Request` and `ws`'s `IncomingMessage` (both extend `http.IncomingMessage`):
   ```ts
   import type { IncomingMessage } from "node:http";
   export function getClientIp(req: IncomingMessage): string {
     const fly = req.headers["fly-client-ip"];
     if (typeof fly === "string" && fly.trim()) return fly.trim();
     const xff = req.headers["x-forwarded-for"];
     const first = (Array.isArray(xff) ? xff[0] : xff)?.split(",")[0]?.trim();
     return first || req.socket.remoteAddress || "unknown";
   }
   ```
3. **Add `ALLOWED_ORIGINS` to `config.ts`** (comma-separated env → string[]):
   ```ts
   ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS ?? "").split(",").map(s => s.trim()).filter(Boolean),
   ```
   Document the contract for downstream tasks: **empty array ⇒ allow all origins (log a startup warning via a logger in `app.ts`)**, so local dev and initial launch don't break; the lock engages once the env is set. Add `ALLOWED_ORIGINS` to `.env.example` with an example (`https://your-frontend.example`).

## Out of scope
Do **not** implement the rate limiters, CORS, or WS origin checks here — those are T05/T08/T03. This task only provides the shared primitives.

## Acceptance criteria
- `app.set("trust proxy", 1)` is set.
- `getClientIp` is exported and unit-callable with an `IncomingMessage`-like object.
- `config.ALLOWED_ORIGINS` is a `string[]`; empty when the env is unset; a startup warning is logged when empty.
- `.env.example` documents `ALLOWED_ORIGINS`.

## Verify
`cd backend && npm run build && npm run lint`.

## Commit message
```
feat(config): add trust-proxy, client-IP helper, and allowed-origins config
```
