# DATABASE.md

## Status

**Post-M7.** Not active during M1 to M7. Active game state stays in memory. The DB is only for finished-match results and, eventually, player stats.

## When to read this

Any time you're about to add a persistence call, a migration, or a DB client import. If you're editing M1 to M7 code, you shouldn't need this file yet.

## Hard rules

- **Repository pattern.** All SQL lives under `backend/src/db/repos/`. Handlers in `backend/src/handlers/` call repository methods, never raw queries. See `RULES.md`.
- **No provider-specific syntax outside `backend/src/db/`.** No `pg.Pool` imports in handlers, no Supabase client imports in `game/gameLogic.ts`, nothing.
- **In-memory is the source of truth during a match.** Writes happen at end of match (`game_over`), not per move. Move-rate writes are banned.
- **Every DB call is `await`ed and wrapped in the repository method's own try/catch.** A DB failure must log and degrade gracefully, never crash the WS loop.

## Directory layout (planned)

```
backend/src/
└── db/
    ├── client.ts            # creates and exports the pool/client for the active provider
    ├── migrations/          # SQL files, timestamped, applied manually or via a runner
    │   ├── 001_init.sql
    │   └── 002_...
    ├── repos/
    │   ├── matches.ts       # matchesRepo.recordFinished(match)
    │   ├── players.ts       # playersRepo.upsert(player), playersRepo.getByName(name)
    │   └── results.ts       # resultsRepo.listForPlayer(playerId, { limit })
    └── index.ts             # re-exports the repos; handlers import from here only
```

Handlers do `import { matchesRepo } from "../db";` and nothing else DB-related.

## Proposed schema

Postgres dialect. Use `TIMESTAMPTZ` everywhere; store UTC. Column names `snake_case`, table names plural. Mappers in `utils/mappers.ts` translate to camelCase or domain types if needed (the reference repo's pattern).

### `players`

```sql
CREATE TABLE players (
  id           UUID PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_players_display_name ON players (display_name);
```

One row per unique player identity. During M1 to M7 there is no auth, so `display_name` is self-reported from `join_queue`. Post-auth, add `auth_provider`, `auth_subject`, and a uniqueness constraint.

### `matches`

```sql
CREATE TABLE matches (
  id           UUID PRIMARY KEY,
  grid_rows    SMALLINT NOT NULL,
  grid_cols    SMALLINT NOT NULL,
  max_players  SMALLINT NOT NULL,
  started_at   TIMESTAMPTZ NOT NULL,
  ended_at     TIMESTAMPTZ NOT NULL,
  winner_id    UUID NOT NULL REFERENCES players(id),
  turn_count   INTEGER NOT NULL
);

CREATE INDEX idx_matches_ended_at ON matches (ended_at DESC);
CREATE INDEX idx_matches_winner   ON matches (winner_id);
```

Written once, at `game_over`. Never updated.

### `match_players`

```sql
CREATE TABLE match_players (
  match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id),
  player_index    SMALLINT NOT NULL,
  eliminated_turn INTEGER,
  PRIMARY KEY (match_id, player_id)
);

CREATE INDEX idx_match_players_player ON match_players (player_id);
```

One row per participant. `eliminated_turn` is null for the winner.

## Repository interface

Each repo exports an object with named async methods. No exported classes, no prototype indirection.

```ts
// backend/src/db/repos/matches.ts
import { pool } from "../client";

export const matchesRepo = {
  async recordFinished(input: {
    id: string;
    gridRows: number;
    gridCols: number;
    maxPlayers: number;
    startedAt: Date;
    endedAt: Date;
    winnerId: string;
    turnCount: number;
    participants: Array<{ playerId: string; playerIndex: number; eliminatedTurn: number | null }>;
  }) {
    // single transaction: INSERT matches, INSERT match_players[]
  },
  async listRecent({ limit = 20 }: { limit?: number } = {}) {
    // SELECT for a public recent-games feed
  },
};
```

Handlers use these directly:

```ts
// inside handlers/game.handlers.ts on game_over:
import { matchesRepo } from "../db";

await matchesRepo.recordFinished({ ... }).catch(err =>
  logger.error("persist failed", { error: (err as Error).message })
);
```

The `.catch` is there because a DB outage must not prevent the `game_over` broadcast from completing.

## Swapping providers

Because every query lives in `backend/src/db/repos/`, swapping providers is a two-step job:

1. Change the client in `backend/src/db/client.ts`. For most Postgres providers (Neon, Supabase, Fly Postgres, RDS), this is only a connection string change and possibly a different pool library.
2. If the new provider requires different SQL (rare for Postgres-compatible services), update the repo methods. Handlers stay untouched.

Providers explicitly left open: Neon, Supabase, Fly Managed Postgres, self-hosted Postgres on Fly. All wire-compatible with `pg`.

## Migrations

No runner during M1 to M7. Post-M7:

- Plain SQL files under `backend/src/db/migrations/`, timestamp-prefixed.
- Applied manually at first. Introduce a runner (e.g. `node-pg-migrate` or a custom script) only when the count grows past a handful.
- Every migration is forward-only. Rollbacks are new migrations, not reversals.

Note: an alternative considered is Prisma (the reference repo uses it). Defer that decision until persistence work begins; raw SQL repos are simpler if the schema stays small.

## Conventions

- **IDs:** UUIDv4, generated in application code (`uuidv4()`), not by the DB. Matches the existing backend pattern.
- **Column names:** `snake_case`. Tables: plural.
- **Timestamps:** always `TIMESTAMPTZ`, always UTC.
- **Soft deletes:** not used. If you think you want one, reconsider; append an archive table instead.
- **Foreign keys:** always declared, never simulated in application code.
- **Indexes:** add on every column used in a `WHERE`, `JOIN`, or `ORDER BY` path before the query ships.

## Security

Secrets only in `backend/.env` locally and in Fly secrets in production. Never commit a connection string, even for ephemeral dev DBs.
