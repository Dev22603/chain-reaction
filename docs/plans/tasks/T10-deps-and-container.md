# T10 — Dependencies & container hardening (bump ws, slim non-root image, CI audit)

**Priority:** P1 · **Effort:** S–M · **Findings:** F-23 (Medium), F-24 (Medium), F-25 (Low) · **Depends on:** none

**Files:** `backend/package.json`, `backend/package-lock.json`, `backend/Dockerfile`, `.github/workflows/ci.yml`

> Read `backend/RULES.md`, `docs/plans/tasks/README.md`, findings F-23/F-24/F-25. Reference: `.claude/skills/security-review/infrastructure/docker.md`. Backend only.

## Context
`ws@8.20.0` is a direct dependency on the live path. The multi-stage `Dockerfile` runs `npm ci` (all deps) in the builder and copies the **entire** `node_modules` into the runner, which runs as `root` with `node` as PID 1. CI (`ci.yml`) runs install + prisma generate + build + lint only.

## Problem
- **F-23:** `ws@8.20.0` has a moderate advisory (uninitialized memory disclosure); a patched release exists.
- **F-24:** dev tooling (Prisma CLI → `hono`/`@hono/node-server`/`fast-uri`, the other `npm audit` hits) ships to production; running as root maximizes blast radius; no init means signals (T07's `SIGTERM`) aren't cleanly forwarded.
- **F-25:** no dependency audit or secret scanning in CI.

## Do this
1. **Bump `ws` (F-23):** update to the patched release; regenerate the lockfile; `npm audit` should no longer flag `ws`.
2. **Slim, non-root container (F-24):** in the **runner** stage, install prod-only deps (e.g. `COPY package*.json`, `RUN npm ci --omit=dev`) instead of copying the full builder `node_modules` (still copy `prisma/` + generated client as needed for `@prisma/client` at runtime — verify the app starts). Add `USER node` (non-root). Run under an init for signal handling: Fly's `[experimental] init = true` in `fly.toml` **or** `tini` as entrypoint (prefer the Fly option to keep the image minimal — coordinate with T13 if editing `fly.toml`).
3. **CI (F-25):** add a non-blocking `npm audit --audit-level=high` step to the backend job; enable **GitHub secret scanning** + **Dependabot** (repo settings / `.github/dependabot.yml`). `.gitignore` already excludes `.env` (verified) — keep it that way.

## Out of scope
No app-code changes. Don't break the Prisma runtime client (test the image boots). No frontend.

## Acceptance criteria
- `npm audit` no longer reports `ws`; the dev-tooling chain is absent from the runtime image (or clearly not installed in the runner stage).
- The production image runs as a non-root user and handles `SIGTERM` cleanly (with T07).
- CI runs an audit step; Dependabot/secret scanning are enabled.
- App builds and starts from the image.

## Verify
`cd backend && npm run build && npm run lint && npm audit`. Build the Docker image and run it locally (with a dummy `DATABASE_URL`/`JWT_SECRET`) to confirm it boots as non-root.

## Commit message
```
chore(deps): patch ws, ship prod-only non-root image, add CI audit
```
