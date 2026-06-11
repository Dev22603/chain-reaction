# Chain Reaction

A real-time multiplayer Chain Reaction game. The backend is the source of truth for game state, turn order, chain reactions, elimination, and game-over cleanup. The frontend renders server broadcasts and sends player intent over WebSockets.

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

All durable data is stored in Supabase Postgres. Create a free project at [supabase.com](https://supabase.com), then copy `backend/.env.example` to `backend/.env` and fill in `DATABASE_URL` (transaction pooler) and `DIRECT_URL` (session pooler) from the dashboard's Connect panel. Apply the schema with:

```bash
npm run db:migrate -w backend
```

See [docs/DATABASE.md](./docs/DATABASE.md) for the Supabase connection model.

## Google Sign-In (optional)

Google login runs through Supabase Auth: the frontend completes the OAuth dance with Supabase, then exchanges the Supabase token at `POST /api/auth/google` for the backend's own JWT. Accounts are linked by email, so a Google sign-in with the same email as an email/password signup lands in the same account. To enable it:

1. In Google Cloud Console, create an OAuth client (Web application) and add `https://[PROJECT-REF].supabase.co/auth/v1/callback` as an authorized redirect URI.
2. In Supabase Dashboard, go to Authentication, then Sign In / Providers, enable **Google**, and paste the Google client ID and secret.
3. Still in Authentication, under URL Configuration, add `http://localhost:3000/auth/callback` (and your production URL) to **Redirect URLs**.
4. Disable the **Email** provider in Supabase (the backend handles email/password itself; leaving it on would let anyone mint Supabase tokens, which the backend rejects but does not need).
5. Set `SUPABASE_URL` + `SUPABASE_ANON_KEY` in `backend/.env` and `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `frontend/.env.local` (values from Supabase Dashboard, Settings, API).

Leaving these env vars unset simply disables the Google button; email/password auth works regardless.

## Key Docs

- [Architecture](./docs/ARCHITECTURE.md) — System design and data flow.
- [Protocol](./docs/PROTOCOL.md) — WebSocket message contract.
- [Hardening & Roadmap](./docs/HARDENING_STATUS.md) — Security status and future tasks.
- [Game Logic](./docs/GAME_LOGIC.md) — Chain Reaction rules and invariants.
- [Backend Setup](./docs/BACKEND_SETUP_GUIDE.md) — Deployment and local environment.
