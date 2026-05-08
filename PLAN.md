# Chain Reaction Product Build Plan

## Summary
Build toward “Chess.com for Chain Reaction” in ordered milestones, with maintainability as the first constraint. The backend must stay aligned with `docs/BACKEND_SETUP_GUIDE.md`: Express app, controller/service/repository/route layering, Prisma + Postgres, JWT auth, strict TypeScript, and clean module boundaries.

The code graph currently returned `0 nodes / 0 edges`, so this plan is based on repo inspection plus the existing docs and implementation shape.

Chosen defaults:
- Guests can play casual games only.
- Ranked, scoring, profiles, and persistent match history require login.
- MVP leaderboard uses simple points only, not Elo.

## Implementation Plan

### 1. Stabilize The Backend Foundation
- Verify `backend/package.json` and `backend/tsconfig.json` match `docs/BACKEND_SETUP_GUIDE.md` exactly where required.
- Keep the backend entry shape clear:
  - `src/app.ts`: Express app composition, middleware, routes, error handling.
  - `src/index.ts`: HTTP server creation, WebSocket attachment, listen lifecycle.
- Run, or ask user to run:
  - `cd backend && npm run db:generate`
  - `cd backend && npm run build`
  - `cd backend && npm run lint`
- Fix Prisma generated import/type issues after `db:generate`.
- Generate a migration for current auth/scoring schema changes.
- Ensure generated Prisma output is either intentionally ignored or consistently handled by the repo.
- Update stale docs that still say DB/auth/persistence are post-M7.

### 2. Finish Auth Properly
- Keep HTTP auth routes:
  - `POST /api/auth/signup`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- Ensure auth code follows layering:
  - route -> controller -> service -> repository -> Prisma.
- Add frontend auth:
  - signup page
  - login page
  - profile/me state
  - logout action
  - auth-aware navigation/queue entry
- Use localStorage JWT for MVP.
- Add an authenticated HTTP client helper that sends `Authorization: Bearer <token>`.
- Add WebSocket auth:
  - frontend passes JWT during socket connection.
  - backend verifies JWT when present.
  - unauthenticated sockets get guest identities.
  - authenticated sockets use stable player IDs.
- Replace temporary socket IDs with authenticated player IDs where token exists.
- Enforce product policy:
  - guest casual queue allowed.
  - ranked queue requires auth.
  - score updates require authenticated ranked games.

### 3. Finish Persistence And Scoring
- Ensure game completion persists in the correct order:
  - record match history first.
  - update player score second.
- Persist authenticated match participants using real player IDs.
- Casual guest games should complete successfully without DB scoring.
- Authenticated casual games may write match history but must not update ranked leaderboard points.
- Ranked authenticated games update:
  - games played
  - wins
  - losses
  - forfeits when applicable
  - score points
- Add persistence failure handling:
  - log match write failure.
  - log score update failure.
  - never break the game-over WebSocket UX because the DB is down.
- Add a later maintenance script:
  - recompute scores from match history.
  - detect score drift.
  - optionally repair score rows.

### 4. Build The Frontend Product Experience
- Add auth pages and wire them into app state.
- Add profile/me state that loads current user from JWT.
- Add leaderboard page backed by backend API.
- Add game result summary:
  - winner
  - players
  - ranked/casual
  - score impact for ranked games
- Improve queue flow:
  - casual queue available to everyone.
  - ranked queue disabled or redirected for guests.
  - clear loading, waiting, matched, reconnecting, and error states.
- Add clean connection handling:
  - socket connecting
  - connected
  - disconnected
  - reconnecting
  - auth failed
  - game unavailable
- Keep UI product-focused, not a landing page.

### 5. Chess.com-Style Product Features
Implement in this order:
1. Ranked vs casual queues.
2. Match history.
3. Player profile stats.
4. Leaderboard filters.
5. Reconnection.
6. Spectators.
7. Private rooms and invite links.
8. Rating system later, only after simple scoring is stable.

MVP behavior:
- Ranked games require auth.
- Ranked games update points.
- Casual games do not affect leaderboard.
- Elo is explicitly deferred.

### 6. Public API And Data Interfaces
Backend HTTP:
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/leaderboard`
- `GET /api/players/:playerId`
- `GET /api/players/:playerId/matches`
- Later: `GET /api/me/matches`

WebSocket:
- Client connects with optional JWT.
- Server assigns either authenticated player identity or guest identity.
- Queue messages include mode: `casual` or `ranked`.
- Server rejects ranked queue join for guests with a typed protocol error.
- Game-over payload includes enough result metadata for frontend summaries.

Database:
- `Player` stores auth identity.
- `Match` stores completed game metadata.
- `MatchPlayer` stores participant rows.
- `PlayerScore` stores simple leaderboard points and aggregate counts.
- Future rating fields are not added until Elo/rating work begins.

### 7. Testing And Quality
Backend:
- Unit tests for game logic.
- Auth service tests.
- Repository tests against test Postgres.
- Score update tests.
- Match persistence tests.
- WebSocket auth and queue integration tests.
- DB outage test for game-over persistence failure.

Frontend:
- Auth page flow tests.
- Authenticated HTTP helper tests.
- Queue mode behavior tests.
- Leaderboard rendering tests.
- Game result summary tests.
- Socket state rendering tests.

CI:
- install dependencies
- Prisma generate
- backend build
- backend lint
- backend tests
- frontend build
- frontend lint
- frontend tests

### 8. Deployment
- Add Docker or deploy config for frontend, backend, and Postgres.
- Define production env vars:
  - database URL
  - JWT secret
  - frontend origin
  - backend port
  - WebSocket URL
- Use `prisma migrate deploy` in production.
- Choose WebSocket-compatible hosting.
- Add structured logging for:
  - auth failures
  - socket auth failures
  - matchmaking events
  - game-over persistence
  - score updates
  - DB failures

## Execution Order
1. Clean backend setup and verify guide compliance.
2. Fix Prisma generation/build/lint.
3. Create migration for auth/scoring schema.
4. Update stale docs and recreate detailed `docs/PLAN.md` / `docs/TODO.md`.
5. Finish JWT auth frontend and HTTP client.
6. Add WebSocket auth and guest/ranked enforcement.
7. Finalize persistence and scoring behavior.
8. Build leaderboard/profile/match-history frontend.
9. Add ranked/casual queue UX.
10. Add tests and CI.
11. Add deployment and observability.
12. Add advanced product features in priority order.

## Acceptance Criteria
- Backend builds and lints cleanly.
- Prisma client generation works from a clean checkout.
- Auth signup/login/me works end to end.
- Guests can play casual games.
- Guests cannot join ranked queue.
- Authenticated ranked games persist match history and update points.
- DB persistence failure is logged but does not break game-over UX.
- Frontend has login/signup, profile state, leaderboard, queue mode selection, and result summary.
- Docs no longer contradict the current auth/db/scoring direction.
- CI can run generate, build, lint, and tests reliably.
