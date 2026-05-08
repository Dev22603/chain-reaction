# Persistence & Scoring

Live match state stays in memory. Finished matches are written to Postgres via Prisma after `game_over`. Player scores update once per match, never per move.

Code-side rules live in [RULES.md](./RULES.md). This file describes the data model and policy.

## Status

- **M8**: JWT account auth (`players.email`, `players.password_hash`).
- **M9**: finished-match writes (`matches`, `match_players`, `players`).
- **M10**: score aggregation (`player_scores`) and leaderboard read endpoint.

## Models

The schema source of truth is `backend/prisma/schema.prisma`. Postgres column names are `snake_case` via Prisma `@map`; TypeScript-facing Prisma fields stay `camelCase`.

- **Player**: one row per player identity. Authenticated players have `email` and `password_hash`; temporary socket players may have those fields null until WebSocket auth is mandatory.
- **Match**: one row per completed match. Includes board dimensions, start/end timestamps, winner.
- **MatchPlayer**: one row per participant in a completed match. Records final state: eliminated turn and forfeit flag.
- **PlayerScore**: aggregate projection for leaderboard reads.

## Scoring Policy

| Outcome | Score | Wins | Losses | Games | Forfeits |
|---|---:|---:|---:|---:|---:|
| Winner | +3 | +1 | 0 | +1 | 0 |
| Non-winner eliminated | +1 | 0 | +1 | +1 | 0 |
| Forfeit | policy TBD | 0 | +1 | +1 | +1 |

`matches` and `match_players` are the durable audit log. `player_scores` is a cached projection and must be recomputable from match history.

## Write Order At Game Over

1. Server broadcasts `game_over` to all room members.
2. Server calls `matchesRepo.recordFinished(input)`.
3. Server calls `scoresRepo.applyMatchResult(input)`.

Both repository calls use Prisma. A DB outage logs an error but does not prevent the `game_over` broadcast.

## Leaderboard Read

`GET /api/leaderboard?limit=20`

Returns the `player_scores` projection joined with player display names, ordered by score, then wins, then games played. The route uses:

```text
routes -> controllers -> services -> db/repos -> Prisma
```

## Auth Routes

`POST /api/auth/signup`

Creates a player account with bcrypt password hashing and returns a JWT.

`POST /api/auth/login`

Verifies credentials and returns a JWT.

`GET /api/auth/me`

Requires `Authorization: Bearer <token>` and returns the authenticated player.

## Security

- Secrets only live in `backend/.env` locally and in production secret storage.
- Never commit a real `DATABASE_URL` or `JWT_SECRET`.
- Passwords are stored only as bcrypt hashes.
- JWT verification belongs in middleware, not controllers.
