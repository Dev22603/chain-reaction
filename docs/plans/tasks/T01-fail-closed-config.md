# T01 — Fail-closed configuration (refuse to boot with a default JWT secret)

**Priority:** P0 · **Effort:** S · **Finding:** F-01 (Critical) · **Depends on:** none

**Files:** `backend/src/constants/config.ts`, `backend/src/index.ts`, `backend/.env.example`

> Read `backend/RULES.md` and the *Ground rules* in `docs/plans/tasks/README.md` first. Backend only.

## Context
This is a multiplayer game backend (Express + `ws` + TypeScript, Prisma/Postgres, deployed on Fly.io). JWTs authenticate players. Config is centralized in `src/constants/config.ts`.

## Problem
`config.ts` does `JWT_SECRET: process.env.JWT_SECRET ?? "change-me-in-development"`. If a production deploy is missing `JWT_SECRET`, the server silently runs with a **public, committed** secret, and anyone can forge a token for any account (full takeover). Nothing validates this at startup.

## Do this
Validate required secrets at boot and **fail closed in production**:

```ts
// config.ts
const isProd = (process.env.NODE_ENV ?? "development") === "production";
const jwtSecret = process.env.JWT_SECRET;
if (isProd && (!jwtSecret || jwtSecret === "change-me-in-development" || jwtSecret.length < 32)) {
  throw new Error("JWT_SECRET must be set to a strong (>=32 char) value in production");
}
// keep the dev-only fallback for local work:
export const config = { /* ... */ JWT_SECRET: jwtSecret ?? "change-me-in-development", /* ... */ } as const;
```

- Apply the same required-in-prod check to `DATABASE_URL` (warn or throw — throwing is preferable so a misconfigured prod process exits non-zero and Fly surfaces it).
- The throw happens at import time, which runs before `server.listen` in `index.ts` — that's sufficient. (Optional: add a short comment in `index.ts` noting config validation gates startup.)

## Out of scope
No auth-flow changes, no new deps, no frontend.

## Acceptance criteria
- In production (`NODE_ENV=production`) with no/`change-me-in-development`/short `JWT_SECRET`, the process throws on startup and exits non-zero.
- In development, behavior is unchanged (fallback still works).
- `backend/.env.example` documents that `JWT_SECRET` must be a strong random value in production (keep the placeholder but add a comment).

## Verify
`cd backend && npm run build && npm run lint`. Manually: `NODE_ENV=production node dist/index.js` with `JWT_SECRET` unset → should crash with the clear message; with a 32+ char secret set → boots.

## Commit message
```
fix(config): fail closed when JWT_SECRET is missing or weak in production
```
