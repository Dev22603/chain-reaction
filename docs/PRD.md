# PRD: Chain Reaction

A multiplayer browser game in the chess.com style. Players queue, get matched on board size and player count, play a single chain-reaction match, and accumulate persistent scores on a leaderboard.

## Status

Greenfield.

- **M1–M7** ship core gameplay (pure logic, queue/room, moves, frontend phases, manual verification).
- **M8** ships finished-match persistence to Postgres.
- **M9** ships score aggregation and the leaderboard read endpoint.

See `../backend/PLAN.md` for the milestone breakdown and `../backend/TODO.md` for the atomic checklist.

## Features

| Feature | What it does | Detail |
|---------|--------------|--------|
| Gameplay | Chain reaction simulation: critical mass, cascades, ownership transfer, elimination, win | [GAMEPLAY.md](./GAMEPLAY.md) |
| Matchmaking | Players join a bucket by `(rows, cols, maxPlayers)`; a full bucket spawns a room | [MATCHMAKING.md](./MATCHMAKING.md) |
| Realtime protocol | WebSocket frames covering connection, queue, game start, moves, game over, errors | [PROTOCOL.md](./PROTOCOL.md) |
| Persistence & scoring | Finished matches persisted to Postgres; player scores update post-game; leaderboard read endpoint | [PERSISTENCE.md](./PERSISTENCE.md) |
| Frontend experience | `lobby → queued → playing → gameover` phases and the screens for each | [EXPERIENCE.md](./EXPERIENCE.md) |

## Out of scope (M1–M7)

Auth, reconnection, spectators, private rooms, ELO ranking, 5+ player games, mobile-specific polish, deployment automation. Deferred to a follow-up plan.

## Glossary

[GLOSSARY.md](./GLOSSARY.md) — canonical names for every concept (room, bucket, myIndex, grace period, cascade, etc.). If a doc, comment, or commit message uses a different term, fix it.
