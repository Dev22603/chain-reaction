# Chain Reaction Backend

Real-time multiplayer Chain Reaction. Server-authoritative gameplay over WebSocket, REST APIs for auth/profiles/leaderboard, Postgres via Prisma. Hosted on Fly.io.

**Stack:** Express 5 + ws + TypeScript (CommonJS) + Prisma 7 + PostgreSQL + Zod v4 + Winston.

## Architecture

REST layering (one vertical slice per domain):

```
routes → controllers → services → repositories → Prisma
```

- **Routes** (`src/routes/*.routes.ts`) — default-export Router, middleware chained inline (`authenticate`, rate limiters).
- **Controllers** (`src/controllers/*.controllers.ts`) — named async functions, per-function try-catch: `ApiError` → its status, else log + 500. Respond with `new ApiResponse(code, message, data)`.
- **Services** (`src/services/*.services.ts`) — object literals; call `validateXxx()` (Zod) first; throw `ApiError` directly; own their in-memory state Maps.
- **Repositories** (`src/repositories/*.repositories.ts`) — pure Prisma wrappers, per-method try-catch logging `DB error — method` then rethrow.
- **Schemas** (`src/schemas/*.schemas.ts`) — Zod v4 schemas + `validateXxx(data: unknown)` functions throwing `ApiError(400, msg, issues)`.

WebSocket layering (same modularity, on top of REST):

```
upgrade (sockets/index.ts: limits + socket-auth) → gateway (parse → dispatch → handlers) → services → lib/realtime emits
```

- Frames are `{event, data}` both directions; event names in `src/constants/socket.events.ts` (`game:*`).
- Auth token rides the `sec-websocket-protocol` header; no/invalid token → guest identity (never rejected).
- `src/lib/realtime.ts` owns the WSS singleton, the playerId→socket registry (`sendToPlayer`/`sendToPlayers`), and WS hardening (rate budgets, idle timeout, connection caps).
- `src/game/game.logic.ts` is pure board logic (no I/O).

Game state lives in memory inside the owning service (rooms in `room.services`, queues in `queue.services`, connections in `connection.services`). Only finished matches are persisted (fire-and-forget transaction).

## Run

```bash
npm run dev            # dev server on :8080 (tsx watch)
npm run build          # tsc → dist/
npm run lint           # eslint
npm run db:migrate     # prisma migrate dev
npm run db:studio      # prisma studio
```

WS protocol smoke tests (server must be running): `npx tsx scripts/ws-smoke.ts [token]` and `npx tsx scripts/ws-ranked-smoke.ts <tokenA> <tokenB>`.

Env: see `.env.example` (`DATABASE_URL`, `JWT_SECRET`, `ALLOWED_ORIGINS`, `PORT`).

Product docs (gameplay, matchmaking, protocol, persistence): `../docs/`.
