# Chain Reaction TODO

Status legend:

- `[x]` done
- `[~]` in progress
- `[ ]` not started

## 1. Backend Foundation

- [x] Keep Express composition in `backend/src/app.ts`.
- [x] Keep server lifecycle in `backend/src/index.ts`.
- [x] Use Express, not a raw HTTP router, for HTTP routes.
- [x] Use `node:http` and `node:crypto` imports for Node built-ins.
- [x] Keep Prisma generated output under `backend/src/generated/`.
- [x] Ensure generated output stays git-ignored.
- [x] Add JWT env vars to `backend/.env.example`.
- [x] Add Prisma/Postgres models for players, matches, match players, and player scores.
- [x] Add auth fields to Prisma schema.
- [x] Add match mode to Prisma schema.
- [x] Add migration for auth fields and match mode.
- [x] User runs `cd backend && npm run db:generate`.
- [x] Fix generated Prisma import/type issues if generation exposes any.
- [x] User runs `cd backend && npm run build`.
- [x] Fix backend TypeScript errors.
- [x] User runs `cd backend && npm run lint`.
- [x] Fix backend lint errors.

## 2. Backend Auth

- [x] Add signup schema.
- [x] Add login schema.
- [x] Add auth controller.
- [x] Add auth service.
- [x] Add player repository account methods.
- [x] Hash passwords with bcrypt.
- [x] Sign access tokens with JWT.
- [x] Verify bearer tokens in HTTP middleware.
- [x] Add `POST /api/auth/signup`.
- [x] Add `POST /api/auth/login`.
- [x] Add `GET /api/auth/me`.
- [x] Add WebSocket JWT parsing.
- [x] Resolve authenticated WebSocket identity from JWT.
- [x] Fall back to guest WebSocket identity when no token exists.
- [x] Track connection identity separately from socket map.
- [x] Send `displayName` and `isGuest` in `connected`.
- [ ] Add explicit frontend handling for expired/invalid token.
- [ ] Add logout behavior that clears token and reconnects as guest.
- [ ] Add auth tests.

## 3. Queue Modes

- [x] Add `GameMode` type.
- [x] Add `casual` and `ranked` constants.
- [x] Add `mode` to `join_queue`.
- [x] Default missing `mode` to `casual` server-side.
- [x] Include mode in queue buckets.
- [x] Include mode in `queued`.
- [x] Include mode in `game_start`.
- [x] Include mode in `game_over`.
- [x] Reject guest ranked queue joins.
- [x] Use account display name for authenticated queue joins.
- [x] Add frontend guest ranked lock once auth state exists.
- [x] Add queue copy/states for ranked rejection.
- [ ] Add WebSocket integration test for guest ranked rejection.

## 4. Persistence

- [x] Record finished matches through repository layer.
- [x] Apply score updates through repository layer.
- [x] Add failure logging around game-over persistence.
- [x] Broadcast `game_over` before persistence work.
- [x] Skip persistence for guest rooms.
- [x] Persist authenticated casual matches as history.
- [x] Update scores only for ranked authenticated matches.
- [x] Add match history query repository method.
- [x] Add player profile stats query repository method.
- [ ] Add score recomputation script.
- [ ] Add DB outage test for game-over UX.
- [ ] Add repository tests with test Postgres.

## 5. Frontend Auth

- [x] Add frontend token storage helper.
- [x] Attach stored JWT to WebSocket URL.
- [x] Add HTTP client helper with bearer token.
- [x] Add `/login` page.
- [x] Add `/signup` page.
- [ ] Add auth form validation.
- [x] Store JWT after login/signup.
- [ ] Fetch `/api/auth/me` on app load.
- [ ] Add user context/provider.
- [ ] Add logout action.
- [x] Add auth-aware top bar.
- [x] Add redirect or inline prompt for ranked guests.

## 6. Frontend Gameplay Product

- [x] Add casual/ranked selector to lobby.
- [x] Send queue mode from frontend.
- [x] Display queue mode while waiting.
- [ ] Add connection status state.
- [ ] Add reconnecting state.
- [ ] Add disconnected state.
- [ ] Add auth failed state.
- [x] Add game result summary details.
- [x] Show whether a game was casual or ranked in result summary.
- [ ] Show score impact for ranked games after backend exposes it.
- [ ] Add better empty/loading/error states.

## 7. Leaderboard And Profiles

- [x] Add leaderboard repository.
- [x] Add leaderboard service.
- [x] Add leaderboard controller.
- [x] Add leaderboard route.
- [x] Add frontend leaderboard page.
- [ ] Add leaderboard filters.
- [x] Add player profile route.
- [x] Add player profile service.
- [x] Add player profile controller.
- [x] Add frontend profile page.
- [x] Add match history page/section.

## 8. Chess.com-Style Features

- [ ] Reconnection support.
- [ ] Spectator support.
- [ ] Private rooms.
- [ ] Invite links.
- [ ] Per-player match history.
- [ ] Public player profiles.
- [ ] Elo/rating model design.
- [ ] Elo/rating schema.
- [ ] Elo/rating tests.

## 9. Testing

- [ ] Add backend test runner.
- [ ] Add pure game logic unit tests.
- [ ] Add auth service tests.
- [ ] Add scoring service/repository tests.
- [ ] Add match repository tests.
- [ ] Add WebSocket queue tests.
- [ ] Add WebSocket gameplay tests.
- [ ] Add frontend test runner.
- [ ] Add auth flow tests.
- [ ] Add lobby/queue component tests.
- [ ] Add game-over summary tests.

## 10. CI And Deployment

- [ ] Add CI install step.
- [ ] Add CI Prisma generate step.
- [ ] Add CI backend build step.
- [ ] Add CI backend lint step.
- [ ] Add CI backend test step.
- [ ] Add CI frontend build step.
- [ ] Add CI frontend lint step.
- [ ] Add CI frontend test step.
- [ ] Add Dockerfile or platform config.
- [ ] Add production env var docs.
- [ ] Add Postgres provisioning notes.
- [ ] Add `prisma migrate deploy` deployment step.
- [ ] Add WebSocket-compatible hosting notes.
- [ ] Add logging/observability plan.

## Next Immediate Commands For User

Backend checks completed:

```bash
cd backend && npm run db:generate
cd backend && npm run build
cd backend && npm run lint
```

Frontend direct build/lint checks completed after auth/profile changes. Use these npm commands for a final workspace-facing confirmation:

```bash
cd frontend && npm run build
cd frontend && npm run lint
```
