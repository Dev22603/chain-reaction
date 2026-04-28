# Chain Reaction: Claude Context

Real-time multiplayer Chain Reaction. Server-authoritative gameplay over WebSocket. chess.com-style scoring/leaderboard backed by Postgres.

**Stack:** Express + ws + TypeScript (backend), Next.js + Tailwind (frontend), Postgres via Prisma. Hosted on Fly.io.

## Read first

**[RULES.md](./RULES.md) is mandatory before writing or refactoring any code.** It is the merged source of truth for non-negotiables, layering, naming, error handling, validation, logging, the persistence boundary, file maps, and "where to add things". When in doubt, read it.

## When to read what

| Need | File |
|------|------|
| Coding rules, layering, error/validation patterns, file maps, repo boundary, "where to add things" | [RULES.md](./RULES.md) |
| Approved milestones (M0–M9), build strategy, risk register | [PLAN.md](./PLAN.md) |
| Atomic build checklist by milestone | [TODO.md](./TODO.md) |
| What the product does (overview of all features) | [../docs/PRD.md](../docs/PRD.md) |
| Chain reaction rules: critical mass, cascades, ownership, elimination, win | [../docs/GAMEPLAY.md](../docs/GAMEPLAY.md) |
| Queue buckets, room creation, match lifecycle, forfeit/disconnect | [../docs/MATCHMAKING.md](../docs/MATCHMAKING.md) |
| WebSocket frame contract, error frame, error codes | [../docs/PROTOCOL.md](../docs/PROTOCOL.md) |
| Finished-match persistence, scoring policy, leaderboard | [../docs/PERSISTENCE.md](../docs/PERSISTENCE.md) |
| Frontend phases, screens, what the user sees | [../docs/EXPERIENCE.md](../docs/EXPERIENCE.md) |
| Canonical names: room, bucket, myIndex, grace period, etc. | [../docs/GLOSSARY.md](../docs/GLOSSARY.md) |

## Layout

```
chain-reaction/
├── backend/                 ← project root for code work
│   ├── CLAUDE.md            (this file — navigation)
│   ├── RULES.md             (coding standards)
│   ├── PLAN.md              (milestones)
│   ├── TODO.md              (atomic checklist)
│   ├── src/
│   ├── prisma/
│   └── package.json
├── frontend/
└── docs/                    ← product docs (PRD + features + glossary)
    ├── PRD.md
    ├── GAMEPLAY.md
    ├── MATCHMAKING.md
    ├── PROTOCOL.md
    ├── PERSISTENCE.md
    ├── EXPERIENCE.md
    └── GLOSSARY.md
```

## Phase machine (frontend)

`lobby → queued → playing → gameover → lobby`

## Run

```bash
cd backend && npm run dev          # backend on :8080
cd frontend && npm run dev         # frontend on :3000

cd backend && npm run smoke:logic  # pure game-logic smoke test
```
