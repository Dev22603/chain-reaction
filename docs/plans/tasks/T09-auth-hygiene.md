# T09 — Auth hygiene (login timing, JWT hardening, password max length)

**Priority:** P1 · **Effort:** S–M · **Findings:** F-16 (Medium), F-04 (Medium, backend parts), F-17 (Low) · **Depends on:** none

**Files:** `backend/src/services/auth.service.ts`, `backend/src/utils/jwt.ts`, `backend/src/constants/config.ts`, `backend/src/schemas/auth.schemas.ts`

> Read `backend/RULES.md`, `docs/plans/tasks/README.md`, findings F-04/F-16/F-17. Reference: `.claude/skills/security-review/references/api-security.md` (JWT). Backend only.

## Context
`auth.service.ts` handles signup/login with bcrypt (12 rounds). `jwt.ts` signs/verifies with `config.JWT_SECRET`; tokens last 7 days. `auth.schemas.ts` validates email/password/displayName with Zod.

## Problem
- **F-16:** `login` returns immediately for unknown emails (no bcrypt work) but runs a ~100 ms compare for known ones → timing oracle for email enumeration.
- **F-04 (backend parts):** `jwt.verify` doesn't pin the algorithm or validate `iss`/`aud`; TTL is long. (Moving the WS token out of the URL needs a **frontend** change — out of scope; see note.)
- **F-17:** password has `min(8)` but no max length.

## Do this
1. **Equalize login timing (F-16):** when the user/`passwordHash` is missing, run a `bcrypt.compare` against a fixed dummy hash (a precomputed bcrypt hash constant) before throwing `invalid_credentials`, so timing doesn't reveal account existence.
2. **JWT hardening (F-04, backend-safe):** in `signAccessToken`/`verifyAccessToken`, pin `algorithms: ["HS256"]` on verify, and set + validate `iss`/`aud` (add `JWT_ISSUER`/`JWT_AUDIENCE` to `config.ts`, with sensible defaults). Consider shortening the default TTL (`JWT_EXPIRES_IN`) — keep it env-driven.
3. **Password max length (F-17):** add `.max(200)` to the password schema (bcrypt truncates at 72 bytes; a max avoids surprise and trivial abuse). Keep the policy otherwise light — heavy complexity rules hurt signups for a game.

## Out of scope
- **Do NOT** change how the WS token is transported (URL → `Sec-WebSocket-Protocol`) — that touches `frontend/`. Leave a `// TODO(frontend): move WS token off the URL query string (F-04)` near `getTokenFromRequest` in `realtime/websocket.ts` and note it for a frontend ticket.
- No token revocation/refresh store (needs shared state; deferred).

## Acceptance criteria
- Login response timing is similar for existing vs non-existing emails.
- `verifyAccessToken` rejects tokens not signed with HS256 and tokens with wrong/absent `iss`/`aud`; existing valid tokens issued post-change verify correctly.
- Passwords longer than the max are rejected at validation.
- Signup/login still work end to end.

## Verify
`cd backend && npm run build && npm run lint`. Manual: sign up, log in, call `/api/auth/me` with the token → works; tamper the token alg/claims → rejected; time a login for a known vs unknown email → comparable.

## Commit message
```
fix(auth): equalize login timing, pin JWT alg/claims, cap password length
```
