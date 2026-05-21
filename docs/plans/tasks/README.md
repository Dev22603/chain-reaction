# Production Hardening — Implementation Tasks

Self-contained, hand-off-ready task briefs derived from `docs/plans/PRODUCTION_HARDENING_PLAN.md` (← `docs/audits/PRODUCTION_HARDENING_AUDIT.md`). Each task is sized to be implemented and **committed separately** — hand one task file to one coding agent.

## How to use these

- **One task = one agent = one focused commit** on branch `claude/harden-backend-production-6qIcf` (or a short-lived sub-branch merged back, or one PR per task — your choice).
- Each task file is written to be understood with **no prior context** beyond the repo. Give the agent the file path and tell it to follow the *Ground rules* below.
- **Run tasks in the order in the table.** Every agent must `git pull --rebase` the latest branch **before starting** so it builds on completed tasks.

## Ground rules (EVERY task must follow these)

1. **Read first:** `backend/CLAUDE.md`, **`backend/RULES.md` (mandatory)**, and the specific finding cited in the task (`docs/audits/PRODUCTION_HARDENING_AUDIT.md`).
2. **Backend only.** Do **not** modify `frontend/`. If a change would alter the WebSocket wire contract (message shape, new/renamed field, error code), **STOP and flag it** — the protocol is mirrored in `frontend/src/lib/types.ts` (out of scope). Prefer changes that keep the wire contract unchanged. New error *codes* are backend-internal and OK to add to `ERROR_CODES` + `docs/PROTOCOL.md`.
3. **Architecture (from RULES.md):** keep layering — WS path `router.ts → handlers/*.ts → game/gameLogic.ts (pure)`; HTTP path `routes → controllers → services → db/repos → Prisma`. No business logic in `router.ts`. `game/gameLogic.ts` stays pure (no imports of `ws`/`http`/`fs`/logger/db/state). DB access only via `db/repos`.
4. **Conventions:** structural/numeric limits → `constants/app.constants.ts` (`LIMITS`, etc.); user-visible strings → `constants/app.messages.ts`; error codes → `ERROR_CODES`. Validate client input with Zod (`safeParse`). Throw `ApiError` for predictable failures. One named Winston logger per file via `getLogger("name")`; structured fields as the 2nd arg, never string-concatenated. snake_case on the wire / camelCase internally. `strict` TS, no `any`, no `@ts-ignore`. File soft cap 300 lines.
5. **No new dependencies** unless the task explicitly says so. **No Redis / no paid services.** In-memory state is acceptable (single Fly machine).
6. **Before committing:** `cd backend && npm run build && npm run lint` must pass. If you touch `game/gameLogic.ts`, also run `npm run smoke:logic` and **append** a reproducing case to the bottom guard (don't replace existing ones).
7. **Commit:** Conventional Commits; use the message in the task's *Commit message* section. Keep the diff scoped to the task.
8. **Update docs in the same commit** when relevant (e.g., new env var → `backend/.env.example`; new error code → `docs/PROTOCOL.md`; behavior change → the relevant `docs/*.md` / `backend/RULES.md` note).

## Execution order & dependencies

| # | Task file | Priority | Depends on | Core files touched | Parallel-safe? |
|---|-----------|----------|------------|--------------------|----------------|
| T01 | `T01-fail-closed-config.md` | **P0** | — | `constants/config.ts`, `index.ts` | yes |
| T02 | `T02-edge-foundation.md` | **P0** | — | `app.ts`, `utils/clientIp.ts` (new), `constants/config.ts` | yes (do early) |
| T03 | `T03-ws-transport-hardening.md` | **P0** | T02 | `realtime/websocket.ts`, `constants/app.constants.ts` | no (shared WS file) |
| T04 | `T04-resource-lifecycle-caps.md` | **P0** | T03 | `handlers/game,queue,room`, `state/memory.ts`, constants | no (shared handlers) |
| T05 | `T05-rate-limiting.md` | **P0** | T02 | `middlewares/rateLimit`, `app.ts`/routes, `realtime/websocket.ts` | no (shared WS file) |
| T06 | `T06-game-leaderboard-integrity.md` | **P0** | T04 | `handlers/*`, `db/repos/scores.ts`, `types/game.ts` | no (shared handlers) |
| T07 | `T07-process-observability.md` | P1 | T02 | `index.ts`, `lib/logger.ts`, `lib/prisma.ts`, `realtime/websocket.ts` | no (shared WS file) |
| T08 | `T08-http-edge-hygiene.md` | P1 | T02 | `app.ts` | partial |
| T09 | `T09-auth-hygiene.md` | P1 | — | `services/auth.service.ts`, `utils/jwt.ts`, `schemas/auth.schemas.ts`, `constants/config.ts` | yes |
| T10 | `T10-deps-and-container.md` | P1 | — | `package.json`, `Dockerfile`, `.github/workflows/ci.yml` | yes |
| T11 | `T11-input-abuse-polish.md` | P2 | — | `schemas/messages.schemas.ts`, `schemas/auth.schemas.ts` | yes |
| T12 | `T12-privacy-gdpr.md` | P2 | — | new route/controller/service, `db/repos/players.ts` | yes |
| T13 | `T13-fly-and-cloudflare.md` | P2 | — | `backend/fly.toml` + your dashboards | yes |

**Conflict guidance:** the core sequence **T02 → T03 → T04 → T05 → T06 → T07 → T08** repeatedly touches `realtime/websocket.ts`, `app.ts`, the handlers, and `constants/` — run these **sequentially**, rebasing each time. The independent tasks **T01, T09, T10, T11, T12, T13** touch separate files and can be done in parallel with the core sequence (and each other) if you coordinate rebases.

**Recommended minimum for public launch:** T01–T06 (all P0). The rest can follow at your pace.

## Shared building block (introduced in T02)

T02 adds `getClientIp(req)` (reads Fly's `Fly-Client-IP`, falls back to `X-Forwarded-For` first hop, then socket address) and `config.ALLOWED_ORIGINS`. **T03, T05, T07, T08 consume these** instead of re-implementing them. If `ALLOWED_ORIGINS` is unset, the app allows all origins but logs a startup warning — so dev/launch don't break, and the lock engages once you set the env to your frontend URL(s).
