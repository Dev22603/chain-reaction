# T08 — HTTP edge hygiene (CORS allowlist + security headers)

**Priority:** P1 · **Effort:** S · **Findings:** F-21 (Medium), F-22 (Low) · **Depends on:** T02

**Files:** `backend/src/app.ts`, `backend/package.json`

> Read `backend/RULES.md`, `docs/plans/tasks/README.md`, findings F-21/F-22. T02 provides `config.ALLOWED_ORIGINS`.

## Context
`app.ts` does `app.use(cors())` (wildcard) and `app.use(express.json())`, with no security headers. The backend serves JSON + WebSocket only (no HTML).

## Problem
- **F-21:** `cors()` sends `Access-Control-Allow-Origin: *` — any website can call the API.
- **F-22:** no security headers (HSTS, `X-Content-Type-Options`, etc.).

## Do this
1. **CORS allowlist (F-21):** configure `cors({ origin })` from `config.ALLOWED_ORIGINS`. Honor the T02 contract: **empty ⇒ allow all** (so dev/launch don't break); when set, only those origins. Do **not** reflect the `Origin` header unconditionally.
   ```ts
   app.use(cors({
     origin: config.ALLOWED_ORIGINS.length ? config.ALLOWED_ORIGINS : true,
   }));
   ```
2. **Security headers (F-22):** add `helmet()` with API-appropriate config (HSTS on; CSP is largely N/A for a JSON API — a restrictive `default-src 'none'` is fine since no HTML is served). Add `helmet` to dependencies.

## Out of scope
WS origin validation is in T03 (don't duplicate). No frontend. Keep `express.json()`'s default 100 KB body limit (already adequate) unless you want to lower it.

## Acceptance criteria
- With `ALLOWED_ORIGINS` set, cross-origin browser requests from other origins are blocked by CORS; the configured frontend origin works.
- With `ALLOWED_ORIGINS` empty, behavior matches today (no breakage).
- Responses include sensible security headers (HSTS, nosniff).

## Verify
`cd backend && npm run build && npm run lint`. Manual: `curl -I` an endpoint and confirm helmet headers; with `ALLOWED_ORIGINS` set, a request with a disallowed `Origin` is rejected by CORS while the allowed origin succeeds.

## Commit message
```
feat(http): restrict CORS to allowed origins and add security headers
```
