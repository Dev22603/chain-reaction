# Chain Reaction: Claude Context

Real-time multiplayer Chain Reaction. Classic pass-and-play, online, server-authoritative.

**Stack:** Node.js + `ws` + TypeScript (backend), Next.js 15 + TypeScript + Tailwind (frontend), Postgres via repository pattern (post-M7), Fly.io hosting.

**Status:** greenfield. Milestones M1 to M7 define build order (see `milestones.md`, `PLAN.md`, `TODO.md`). No DB, auth, reconnect, or ratings until M1 to M7 ships.

**Layout:** flat repo. `backend/` and `frontend/` are independent npm projects with their own `package.json`. Layered TS structure inside each, modeled on a known-good reference (zod validators, named Winston loggers, `ApiError` class, snake_case on the wire / camelCase internally).

> Note: PLAN.md and TODO.md describe a flat 2-file backend (`index.mjs` + `gameLogic.mjs`). The actual layout is layered TS as shown below; behavior is the same, just split across more files. CONVENTIONS.md explains the layering.

## Read first, always

> **[RULES.md](./RULES.md) is mandatory.** Non-negotiables: server-authoritative state, no business logic in the message router, pure game logic, validated messages at the boundary, repository-layer DB access only.

## Directory map

```
/
├── backend/
│   ├── src/
│   │   ├── index.ts                  # entry: starts the server
│   │   ├── server.ts                 # WS server + connection lifecycle
│   │   ├── router.ts                 # JSON parse + dispatch by type
│   │   ├── handlers/
│   │   │   ├── queue.handlers.ts     # join_queue, leave_queue
│   │   │   └── game.handlers.ts      # make_move, leave_game
│   │   ├── game/gameLogic.ts         # pure: createBoard, applyMove, ...
│   │   ├── state/memory.ts           # players, queues, rooms, playerRooms
│   │   ├── schemas/messages.schemas.ts
│   │   ├── constants/                # app.constants, app.messages, config
│   │   ├── lib/logger.ts             # winston getLogger(name)
│   │   ├── utils/                    # api_error.ts, broadcast.ts
│   │   ├── types/                    # protocol.ts, game.ts
│   │   └── db/                       # post-M7: client.ts, repos/, migrations/
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── frontend/
│   ├── src/app/page.tsx              # phase router
│   ├── src/hooks/useGameWebSocket.ts
│   ├── src/components/               # Lobby, QueueScreen, GameBoard, GameOver
│   └── src/lib/                      # types.ts, colors.ts
├── docs/context/                     # the files indexed below
├── CLAUDE.md                         # (this file)
├── RULES.md                          # mandatory read
├── PLAN.md                           # approved plan (M1 to M7)
├── TODO.md                           # atomic checklist
└── milestones.md
```

## Context file index

| File | Read when... |
|------|--------------|
| [RULES.md](./RULES.md) | Always. Non-negotiables before writing any code. |
| [docs/context/ARCHITECTURE.md](./docs/context/ARCHITECTURE.md) | Adding a subsystem, changing the phase machine, deploying. |
| [docs/context/PROTOCOL.md](./docs/context/PROTOCOL.md) | Adding, renaming, or versioning any client/server message. |
| [docs/context/CONVENTIONS.md](./docs/context/CONVENTIONS.md) | Writing new code. Naming, layering, errors, logger, validation, wire format. |
| [docs/context/ERRORS.md](./docs/context/ERRORS.md) | Anything that can fail and needs to surface to the client. |
| [docs/context/BACKEND.md](./docs/context/BACKEND.md) | Editing `backend/`, adding a handler, touching state maps. |
| [docs/context/FRONTEND.md](./docs/context/FRONTEND.md) | Editing `frontend/`, adding a phase, a component, or a hook. |
| [docs/context/GAME_LOGIC.md](./docs/context/GAME_LOGIC.md) | Touching chain reaction rules or `game/gameLogic.ts`. |
| [docs/context/DATABASE.md](./docs/context/DATABASE.md) | Any persistence work. Post-M7 scope. |
| [docs/context/GLOSSARY.md](./docs/context/GLOSSARY.md) | Unsure what "room", "bucket", "myIndex", or "grace period" mean here. |

## Phase machine (frontend)

`lobby → queued → playing → gameover → lobby`

## Run locally

```bash
# terminal A
cd backend && npm run dev

# terminal B
cd frontend && npm run dev
# open http://localhost:3000 in two windows
```

Smoke test for pure game logic: `cd backend && npm run smoke:logic`
