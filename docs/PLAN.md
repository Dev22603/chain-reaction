# Chain Reaction Product Plan

## Product Direction

Build a maintainable "Chess.com for Chain Reaction":

- Casual games are open to guests.
- Ranked games require an authenticated account.
- Ranked games update persistent simple points.
- Elo/rating is intentionally deferred until the scoring foundation is stable.
- Backend code follows the setup guide: Express app in `app.ts`, server lifecycle in `index.ts`, and route/controller/service/repository layering for HTTP resources.

## Current Foundation

- Frontend: Next.js game UI with lobby, queue, board, and game-over states.
- Backend: Express HTTP API, `ws` realtime transport, pure game logic, in-memory active rooms, Prisma/Postgres persistence, JWT auth routes, and leaderboard route.
- Database: Prisma schema has players, matches, match participants, and player scores.
- Realtime: WebSocket connections may be guest or authenticated. Authenticated sockets use stable player IDs from JWT.

## Build Milestones

### Milestone 1: Backend Stability

Goal: make the current backend compile, migrate, and follow the setup guide cleanly.

- Keep `src/app.ts` responsible for Express middleware, routes, and error middleware.
- Keep `src/index.ts` responsible for creating the HTTP server, attaching WebSocket, and listening.
- Keep Prisma access behind repositories.
- Keep auth business rules in services.
- Keep WebSocket live-game mutation in handlers.
- Keep pure Chain Reaction rules in `game/gameLogic.ts`.
- Generate Prisma client from a clean checkout.
- Build and lint backend.
- Fix any generated Prisma import/type issues.
- Keep `backend/src/generated/` git-ignored.

### Milestone 2: Auth Completion

Goal: make account identity usable by both HTTP and WebSocket flows.

- HTTP auth:
  - `POST /api/auth/signup`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- Frontend auth:
  - signup screen
  - login screen
  - logout action
  - persisted localStorage access token
  - `/me` fetch on app load
- WebSocket auth:
  - pass JWT as a connection token
  - verify token server-side
  - attach stable player identity when valid
  - fall back to guest identity when no token exists
  - prevent guests from joining ranked queue

### Milestone 3: Persistence And Scoring

Goal: make completed games persist without hurting gameplay UX.

- On game over:
  - broadcast result first
  - attempt persistence asynchronously
  - log failures
  - never block or break game-over UI if DB is down
- Match history:
  - persist authenticated matches
  - skip guest rooms
  - store match mode
  - store participants
  - store forfeits and eliminated turns
- Scoring:
  - only ranked authenticated matches update score
  - casual matches do not affect score
  - score remains simple points for MVP

### Milestone 4: Product Frontend

Goal: turn the current game shell into an account-aware product.

- Add login/signup pages.
- Add authenticated user state.
- Add auth-aware top bar.
- Add casual/ranked queue selector.
- Add ranked lock/redirect for guests.
- Add leaderboard page.
- Add profile page.
- Add match-history view.
- Add game result summary with mode and winner.
- Add loading, error, connecting, reconnecting, and disconnected states.

### Milestone 5: Chess.com-Style Depth

Goal: add competitive and social surfaces after the core path is stable.

- Ranked vs casual queue separation.
- Player profile stats.
- Leaderboard filters.
- Reconnection.
- Spectators.
- Private rooms and invite links.
- Elo/rating after simple points are proven.

### Milestone 6: Testing And CI

Goal: make changes safe to keep making.

- Backend unit tests for pure game logic.
- Auth service tests.
- Repository tests with test Postgres.
- WebSocket integration tests.
- Frontend component tests.
- Frontend flow tests.
- CI pipeline:
  - install
  - Prisma generate
  - backend build
  - backend lint
  - backend tests
  - frontend build
  - frontend lint
  - frontend tests

### Milestone 7: Deployment

Goal: make the product deployable and observable.

- Add Docker or platform config.
- Define production env vars.
- Provision Postgres.
- Run `prisma migrate deploy`.
- Deploy to WebSocket-compatible hosting.
- Add structured logs for auth, matchmaking, game over, persistence, score updates, and DB failures.

## API Direction

### HTTP

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/leaderboard`
- `GET /api/players/:playerId`
- `GET /api/players/:playerId/matches`
- `GET /api/me/matches`

### WebSocket

- Connection accepts optional JWT.
- `connected` returns `playerId`, `displayName`, and `isGuest`.
- `join_queue` includes `mode: "casual" | "ranked"`.
- `queued`, `game_start`, and `game_over` include mode.
- Ranked queue rejects guests with `not_authenticated`.

## Verification Commands

Ask the user to run these when a milestone touches the relevant area:

```bash
cd backend && npm run db:generate
cd backend && npm run build
cd backend && npm run lint
cd frontend && npm run build
cd frontend && npm run lint
```

## Decisions

- LocalStorage JWT is the MVP token strategy.
- Guests are casual-only.
- Simple points are the MVP scoring model.
- Elo/rating is deferred.
- Authenticated casual matches may be persisted as history but do not update score.
- Guest rooms are not persisted.
