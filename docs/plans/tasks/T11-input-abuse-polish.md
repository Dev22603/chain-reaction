# T11 — Input & abuse polish (coordinate bounds + name charset)

**Priority:** P2 · **Effort:** S · **Findings:** F-11 (Low), F-12 (Low) · **Depends on:** none

**Files:** `backend/src/schemas/messages.schemas.ts`, `backend/src/schemas/auth.schemas.ts`, `backend/src/constants/app.constants.ts`

> Read `backend/RULES.md`, `docs/plans/tasks/README.md`, findings F-11/F-12. Backend only. **Keep the wire contract unchanged** (same field names/types) — these are tighter validations, not protocol changes.

## Context
`MakeMoveSchema` validates `row`/`col` as `z.number().int()` with no range. `playerName`/`displayName` are length-capped (≤100) and trimmed but have no charset policy. Names are broadcast to the room and stored in match history.

## Problem
- **F-11:** out-of-range coordinates currently rely on the handler's `isInBounds` to drop them — fine, but the schema should reject impossible values at the boundary (defense-in-depth).
- **F-12:** names allow control chars, zero-width, RTL-override, and can mimic the server's `Guest 0a1b2c3d` format → impersonation/abuse.

## Do this
1. **Bound coordinates (F-11):** add `.min(0).max(LIMITS.GRID_MAX - 1)` to `row`/`col` in `MakeMoveSchema`. (The handler still validates against the *actual* room dimensions; this just rejects clearly-impossible values early.)
2. **Name charset (F-12):** add a shared Zod refinement/transform for `playerName`/`displayName` that strips or rejects control characters, zero-width, and bidi-override code points and collapses internal whitespace. Reject names matching the reserved guest pattern (`^Guest [0-9a-f]{8}$`) for client-supplied names so only the server can assign them. Keep messages in `app.messages.ts`.

## Out of scope
No new message types, no field renames, no frontend. Don't over-restrict (allow normal Unicode names/emoji — just remove dangerous control/format characters).

## Acceptance criteria
- `make_move` with negative or out-of-grid coordinates fails validation (still also safe at the handler).
- Names containing control/zero-width/bidi characters are cleaned or rejected; whitespace is normalized.
- Client-supplied names can't impersonate the `Guest xxxxxxxx` format.
- Normal names (including international characters) still pass.

## Verify
`cd backend && npm run build && npm run lint`. Manual: send `make_move {row:-1,col:0}` → validation error; `join_queue` with a name containing `‮`/zero-width or `Guest deadbeef` → cleaned/rejected; a normal name works.

## Commit message
```
fix(validation): bound move coordinates and sanitize player names
```
