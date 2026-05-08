# PRD: Chain Reaction

A multiplayer browser game in the chess.com style. Players create accounts, queue, get matched on board size and player count, play chain-reaction matches, and accumulate persistent scores on a leaderboard.

## Status

Greenfield.

- **M1-M7** ship core gameplay: pure logic, queue/room, moves, frontend phases, manual verification.
- **M8** ships JWT account auth.
- **M9** ships finished-match persistence to Postgres.
- **M10** ships score aggregation and the leaderboard read endpoint.

## Features

| Feature | What it does | Detail |
|---|---|---|
| Auth | Account signup/login, JWT access tokens, protected profile route | [PERSISTENCE.md](./PERSISTENCE.md) |
| Gameplay | Chain reaction simulation: critical mass, cascades, ownership transfer, elimination, win | [GAMEPLAY.md](./GAMEPLAY.md) |
| Matchmaking | Players join a bucket by `(rows, cols, maxPlayers)`; a full bucket spawns a room | [MATCHMAKING.md](./MATCHMAKING.md) |
| Realtime protocol | WebSocket frames covering connection, queue, game start, moves, game over, errors | [PROTOCOL.md](./PROTOCOL.md) |
| Persistence & scoring | Finished matches persisted to Postgres; player scores update post-game; leaderboard read endpoint | [PERSISTENCE.md](./PERSISTENCE.md) |
| Frontend experience | `lobby -> queued -> playing -> gameover` phases and the screens for each | [EXPERIENCE.md](./EXPERIENCE.md) |

## Out Of Scope For Core Gameplay

Reconnection, spectators, private rooms, ELO ranking, 5+ player games, mobile-specific polish, deployment automation. Deferred to follow-up milestones.

## Glossary

[GLOSSARY.md](./GLOSSARY.md) is canonical for room, bucket, myIndex, grace period, cascade, and related terms.
