# T12 — Privacy / GDPR (account deletion + IP retention note)

**Priority:** P2 · **Effort:** M · **Finding:** F-27 (Medium) · **Depends on:** none (pairs with T07's PII-log fix)

**Files:** new `backend/src/routes` entry + `controllers` + `services` for account deletion, `backend/src/db/repos/players.ts`, a short note in `docs/` (e.g., `docs/PERSISTENCE.md` or a new `docs/PRIVACY.md`)

> Read `backend/RULES.md`, `docs/plans/tasks/README.md`, finding F-27. Reference: `.claude/skills/security-review/references/data-protection.md`. Follow the HTTP layering: `routes → controllers → services → db/repos → Prisma`. Backend only.

## Context
The app stores account PII (email) and will serve Google Ads to EU users. The Prisma schema has cascade deletes from `Player` to `PlayerScore`/`MatchPlayer`. There is no way for a user to delete their account, and (separately, fixed in T07) Prisma was logging emails.

## Problem (F-27)
GDPR/ePrivacy for EU traffic requires: the right to erasure (and ideally access/export) for accounts, and a defined stance on IP retention. None exist. (The cookie-consent banner is **frontend** and out of scope — flag it.)

## Do this
1. **Account deletion endpoint:** add `DELETE /api/me` behind `requireAuth`. Controller reads `response.locals.auth.sub`; service calls a new `playersRepo.deleteAccount(playerId)` that deletes the `Player` (cascades remove `PlayerScore` and `MatchPlayer` rows via existing relations). Return 204. Follow existing controller/service patterns and error handling (`ApiError`).
2. **(Optional, same task) data export:** an authenticated `GET /api/me/export` returning the account's stored data (profile + match history) as JSON — leverages existing repo reads. Include only if quick; otherwise note as a follow-up.
3. **IP retention note:** document in `docs/` that the app does not persist client IPs to the database; any IPs in logs (from T07 security events) are truncated/hashed and short-retention. Cross-reference T07/F-18.
4. **Flag frontend dependency:** note that a cookie-consent surface for ad cookies is a frontend task (out of scope here).

## Out of scope
No consent UI (frontend). No new infra. Don't log additional PII.

## Acceptance criteria
- An authenticated user can delete their account; afterward their `Player`, `PlayerScore`, and `MatchPlayer` rows are gone and their token no longer resolves to an account.
- A short privacy/IP-retention note exists in `docs/`.
- New code follows the route→controller→service→repo layering and `ApiError` conventions.

## Verify
`cd backend && npm run build && npm run lint`. Manual (needs a dev Postgres): sign up, create some match history, `DELETE /api/me` with the token → 204; confirm the player and related rows are removed and `/api/auth/me` now fails.

## Commit message
```
feat(privacy): add authenticated account deletion and IP-retention note
```
