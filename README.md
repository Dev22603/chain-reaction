# Chain Reaction

A real-time multiplayer Chain Reaction game built with Node.js and Next.js. The backend is the source of truth for game state, turn order, chain reactions, elimination, and game-over cleanup. The frontend renders server broadcasts and sends player intent over WebSockets.

## Project Shape

```text
backend/   Node.js + TypeScript + ws backend
frontend/  Next.js frontend
docs/      Product plan, TODOs, protocol, rules, and architecture notes
```

## Install

```bash
npm install
npm run db:generate -w backend
```

## Run

Backend:

```bash
npm run dev:backend
```

Frontend:

```bash
npm run dev:frontend
```

Open `http://localhost:3000` in two browser windows, enter different names with the same board settings, and join the queue from both windows.

## Verify

```bash
npm run smoke:logic
npm run build
npm run lint
```

When you have a local Postgres database available, copy `backend/.env.example` to `backend/.env`, set `DATABASE_URL`, then run:

```bash
npm run db:migrate -w backend
```

## Key Docs

- `docs/PLAN.md`: milestone build plan.
- `docs/TODO.md`: micro-level implementation checklist.
- `docs/PROTOCOL.md`: WebSocket message contract.
- `docs/RULES.md`: non-negotiable architecture and implementation rules.
- `docs/GAME_LOGIC.md`: Chain Reaction rules and invariants.
