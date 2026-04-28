# Persistence & Scoring

Live match state stays in memory. Finished matches are written to Postgres via Prisma after `game_over`. Player scores update once per match, never per move.

> Code-side rules (repository pattern, where Prisma may be imported, write order) live in [../backend/RULES.md](../backend/RULES.md). This file describes the data model and policy.

## Status

- **M8** — finished-match writes (`matches`, `match_players`, `players`).
- **M9** — score aggregation (`player_scores`) and the leaderboard read endpoint.

## Models

The schema source of truth is `backend/prisma/schema.prisma`. Postgres column names are `snake_case` via Prisma `@map`; TypeScript-facing Prisma fields stay `camelCase`.

- **Player** — one row per player identity. Upserted by current player identity at game-over time.
- **Match** — one row per completed match. Includes board dimensions, start/end timestamps, winner.
- **MatchPlayer** — one row per participant in a completed match. Records final state: was-winner, eliminated turn, forfeit flag.
- **PlayerScore** — aggregate projection (cached) for leaderboard reads.

## Scoring policy

| Outcome | Score | Wins | Losses | Games | Forfeits |
|---------|-------|------|--------|-------|----------|
| Winner | +3 | +1 | — | +1 | — |
| Non-winner (eliminated) | +1 | — | +1 | +1 | — |
| Forfeit | tracked separately | — | — | +1 | +1 |

`matches` and `match_players` are the durable audit log. `player_scores` is a cached projection — recomputable from match history. A recomputation script must be able to rebuild `player_scores` from `match_players` and produce the same totals.

## Write order at game over

1. Server broadcasts `game_over` to all room members.
2. Server calls `matchesRepo.recordFinished(input)` — a Prisma transaction that:
   - Upserts each participant in `players`.
   - Creates the `Match` row.
   - Creates one `MatchPlayer` row per participant.
3. Server calls `scoresRepo.applyMatchResult(input)` — a Prisma transaction that:
   - Upserts a `PlayerScore` for each participant.
   - Applies the policy table above.

A DB outage at step 2 or 3 logs an error but does **not** prevent the broadcast at step 1.

## Leaderboard read

`GET /api/leaderboard?limit=20`

Returns the `player_scores` projection joined with player display names, ordered by score, then wins, then games_played. The route uses the standard layered stack: `routes → controllers → services → db/repos → Prisma`.

## Security

- Secrets only live in `backend/.env` locally and in production secret storage.
- Never commit a real `DATABASE_URL`.
- See [../backend/RULES.md](../backend/RULES.md) §10 for the Prisma command set.
