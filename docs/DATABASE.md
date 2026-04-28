# DATABASE.md

## Status

Post-M7 persistence is part of the product direction. The database is Postgres, accessed through Prisma. Live match state still stays in memory; durable writes happen after `game_over`, never per move.

## When To Read This

Read this before adding persistence, scoring, leaderboard reads, migrations, or any Prisma model. If you are touching live game rules, read `GAME_LOGIC.md` instead.

## Hard Rules

- All database operations live in repositories under `backend/src/db/repos/`.
- Prisma is imported only by repository/client code, not controllers, services, handlers, or game logic.
- Live match state stays in `state/memory.ts`; the DB stores finished matches and aggregate score projections.
- Score writes happen after the match result is known, not during moves.
- DB failures must log and degrade gracefully; they must not prevent `game_over` from reaching players.
- The current implementation broadcasts `game_over` first, then calls `matchesRepo.recordFinished` and `scoresRepo.applyMatchResult`.

## Directory Layout

```text
backend/
├── prisma/
│   └── schema.prisma
└── src/
    ├── lib/
    │   └── prisma.ts
    └── db/
        ├── index.ts
        └── repos/
            ├── matches.ts
            ├── players.ts
            └── scores.ts
```

Handlers and services import from `backend/src/db/index.ts` only:

```ts
import { matchesRepo, playersRepo, scoresRepo } from "../db/index.js";
```

## Prisma Models

The schema source of truth is `backend/prisma/schema.prisma`.

Models:

- `Player`: one row per player identity.
- `Match`: one row per completed match.
- `MatchPlayer`: one row per participant in a completed match.
- `PlayerScore`: aggregate projection for leaderboard reads.

Postgres column names use `snake_case` through Prisma `@map`; TypeScript-facing Prisma fields stay `camelCase`.

## Scoring Policy

Initial policy:

- Winner: `+3` score, `+1` win.
- Non-winner: `+1` participation score, `+1` loss.
- Every participant: `+1` game played.
- Forfeit: tracked in `forfeits`; no score penalty until explicitly decided.

`matches` and `match_players` are the durable audit log. `player_scores` is a cached projection and must be recomputable from match history.

## Repositories

### `playersRepo`

- `upsert({ id, displayName })`
- Used when a player identity must exist before writing matches or scores.

### `matchesRepo`

- `recordFinished(input)`
- Uses a Prisma transaction.
- Upserts participants.
- Creates a `Match`.
- Creates nested `MatchPlayer` rows.

### `scoresRepo`

- `applyMatchResult(input)`
- Uses Prisma `playerScore.upsert` inside a transaction.
- Applies the scoring policy after the match result is known.
- `getLeaderboard({ limit })`
- Reads score rows ordered by score, wins, and games played.

## HTTP Surface

Leaderboard/scoring read APIs use the guide-style stack:

```text
routes -> controllers -> services -> db/repos -> Prisma
```

Current route:

```text
GET /api/leaderboard?limit=20
```

The route returns the aggregate `player_scores` projection with player display names.

## Prisma Commands

```bash
cd backend
npm run db:generate
npm run db:migrate
npm run db:studio
```

Production migration:

```bash
cd backend
npm run db:migrate:prod
```

## Security

Secrets only live in `backend/.env` locally and production secret storage in deployment. Never commit a real `DATABASE_URL`.
