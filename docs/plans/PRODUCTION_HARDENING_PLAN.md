# Chain Reaction — Backend Production Hardening Plan

- **Date:** 2026-05-20
- **Branch:** `claude/harden-backend-production-6qIcf`
- **Source:** `docs/audits/PRODUCTION_HARDENING_AUDIT.md` (27 findings) + `docs/audits/THREAT_MODEL.md`
- **Constraints honored:** free-tier only, single Fly machine, in-memory state (no Redis), no new infra, no frontend changes, existing layered architecture + conventions.

## How to read this (you don't need to be a security expert)

This is a build plan, not a code change. Each item below has:

- **Priority** — **P0** = closes a real, exploitable hole; do before public launch. **P1** = important hardening; do soon after. **P2** = polish / defense-in-depth / depends on your action.
- **What it does for you** — plain-language reason, no jargon.
- **Files**, **Approach** (a short code sketch), **Tool/lib** (free), **Effort** (S ≈ <1h, M ≈ a few hours, L ≈ a day), **Depends on**.

Work is grouped into **independently shippable chunks**. In Phase 3 I implement **one chunk at a time**: I show you the diff, tell you exactly what to click/test to confirm it works, run `/security-review` on the change, and wait for your OK before the next. Nothing ships silently.

**Recommended path:** approve **Chunks 1–5 (all P0)** as the launch-blocker set. That's the "can't open to the public without these" list. P1/P2 can follow at your pace.

### Things that need *you* (not code I can just write)

- **Chunk 7 (CORS) and Chunk 8 (token TTL):** I need the deployed **frontend origin URL(s)** to allowlist. Until then I'll read it from an env var.
- **F-04 (move token out of the URL):** the clean fix touches **frontend** code (out of scope here), so I'll do the backend-safe parts now and flag the rest for a frontend ticket.
- **Chunk 12 (Fly + Cloudflare):** setting up Cloudflare and Fly machine settings happens in **your** Fly/Cloudflare dashboards; I'll give exact values and a checklist.

---

## Priority summary

| Chunk | Title | Priority | Findings | Effort |
|------|-------|----------|----------|--------|
| 1 | Fail-closed configuration | **P0** | F-01 | S |
| 2 | WebSocket DoS hardening | **P0** | F-02, F-03 | M |
| 3 | Resource lifecycle & caps | **P0** | F-08, F-09 | M |
| 4 | Rate limiting that actually works | **P0** | F-05, F-06 | M |
| 5 | Game & leaderboard integrity | **P0** | F-13, F-14 | M–L |
| 6 | Process resilience & observability | P1 | F-20, F-18, F-19 | M |
| 7 | HTTP edge hygiene | P1 | F-21, F-22 | S |
| 8 | Auth hygiene | P1 | F-16, F-04, F-17 | S–M |
| 9 | Dependencies & container | P1 | F-23, F-24, F-25 | S–M |
| 10 | Input & abuse polish | P2 | F-11, F-12 | S |
| 11 | Privacy / GDPR | P2 | F-27 | M |
| 12 | Fly + Cloudflare edge (your action) | P2 | F-26, F-07 | S + you |
| — | Event-loop micro-opt | P2 (monitor) | F-10 | defer |

**Shared dependency:** Chunks 2, 4, and 6 all need to read the **real client IP** behind Fly's proxy. Whichever lands first adds one tiny helper (`getClientIp(req)` reading `Fly-Client-IP`, validated); the others reuse it. I'll put it in `src/realtime/` / `src/utils/` and note it in the first chunk implemented.

---

## Chunk 1 — Fail-closed configuration (P0)

### F-01 — Refuse to boot with a default/weak JWT secret
- **What it does for you:** makes it *impossible* to accidentally deploy with the public placeholder secret (which would let anyone forge logins). Turns a silent catastrophe into a loud, safe startup failure.
- **Files:** `src/constants/config.ts`, `src/index.ts`.
- **Approach:**
  ```ts
  // config.ts — validate once, at import
  function requireSecret(): string {
    const s = process.env.JWT_SECRET;
    if (config.NODE_ENV === "production" && (!s || s === "change-me-in-development" || s.length < 32)) {
      throw new Error("JWT_SECRET must be set to a strong value in production");
    }
    return s ?? "change-me-in-development"; // dev-only fallback
  }
  ```
  Call it so a misconfigured prod process exits non-zero (Fly will surface the crash) instead of running insecurely. Same check can cover other required prod vars (`DATABASE_URL`).
- **Tool/lib:** none.
- **Effort:** S.
- **Depends on:** nothing. Do first.

---

## Chunk 2 — WebSocket DoS hardening (P0)

### F-02 — Payload cap, heartbeat, idle timeout, connection caps
- **What it does for you:** stops one person from knocking the whole game offline by sending huge messages, opening thousands of sockets, or leaving dead connections piling up. These are the cheapest "take the game down" attacks.
- **Files:** `src/realtime/websocket.ts`, `src/constants/app.constants.ts`.
- **Approach:**
  ```ts
  const wss = new WebSocketServer({ server, maxPayload: 16 * 1024 }); // 16 KB
  // ping/pong liveness sweep
  const interval = setInterval(() => {
    for (const ws of wss.clients) {
      if ((ws as Live).isAlive === false) { ws.terminate(); continue; }
      (ws as Live).isAlive = false; ws.ping();
    }
  }, 30_000);
  socket.on("pong", () => { (socket as Live).isAlive = true; });
  // idle timeout: reset a per-socket timer on each message; terminate if it fires
  // connection caps: track counts globally and per-IP (getClientIp), reject the upgrade past the cap
  ```
  New constants: `WS_MAX_PAYLOAD_BYTES`, `WS_PING_INTERVAL_MS`, `WS_IDLE_TIMEOUT_MS`, `MAX_CONNECTIONS`, `MAX_CONNECTIONS_PER_IP`.
- **Tool/lib:** built-in `ws` options (no new dep). Pattern is straight from `websocket-engineer/references/security.md`.
- **Effort:** M.
- **Depends on:** the `getClientIp` helper (per-IP cap).

### F-03 — Validate `Origin` on the WS upgrade
- **What it does for you:** stops other websites from opening connections to your game server and driving bot traffic.
- **Files:** `src/realtime/websocket.ts`.
- **Approach:** pass `verifyClient`/check `request.headers.origin` against an allowlist env (`ALLOWED_ORIGINS`); close with code `1008` if not allowed. Allow no-origin native clients only if we decide to.
- **Tool/lib:** none.
- **Effort:** S.
- **Depends on:** the same `ALLOWED_ORIGINS` env used by Chunk 7 (CORS).

---

## Chunk 3 — Resource lifecycle & caps (P0)

### F-08 — Reap abandoned rooms; clean up when nobody is left
- **What it does for you:** fixes a memory leak where creating a private room and disconnecting leaves it in memory forever — an attacker (or just churn) can balloon memory until the server dies.
- **Files:** `src/handlers/game.handlers.ts` (`eliminateAndBroadcast`), `src/realtime/websocket.ts` (close path), a small reaper.
- **Approach:** when a forfeit/disconnect leaves **0** players alive, delete the room + its `inviteCode` from `roomCodes` + all `playerRooms` entries (the cleanup that today only runs on a clean win). Add a periodic reaper (e.g., every 60s) that removes rooms with no connected sockets and private rooms idle past a TTL.
  ```ts
  function destroyRoom(room: Room) {
    rooms.delete(room.id);
    if (room.inviteCode) roomCodes.delete(room.inviteCode);
    for (const p of room.players) playerRooms.delete(p.id);
  }
  ```
- **Tool/lib:** none.
- **Effort:** M.
- **Depends on:** nothing (pairs naturally with F-09).

### F-09 — Cap rooms, queue size, and connections
- **What it does for you:** an upper bound so no single actor can exhaust memory by spamming rooms/queue entries/sockets.
- **Files:** `src/state/memory.ts`, `src/handlers/queue.handlers.ts`, `src/handlers/room.handlers.ts`, `src/constants/app.constants.ts`.
- **Approach:** before inserting, check `rooms.size`, the bucket length, and connection counts against new `LIMITS.MAX_ROOMS` / `MAX_QUEUE_SIZE` / per-IP room cap; reject past the ceiling with a typed `ApiError`. (Connection cap is enforced in Chunk 2.)
- **Tool/lib:** none.
- **Effort:** S–M.
- **Depends on:** Chunk 2 for the connection side.
- **Scale flag:** in-memory counters are correct on one machine; they reset/diverge across machines — revisit if we ever scale out.

---

## Chunk 4 — Rate limiting that actually works (P0)

### F-05 — Trust the proxy; key limits on real client IP; per-IP WS limit
- **What it does for you:** today the login throttle treats *every* visitor as one shared user (because of how Fly forwards traffic), so it both fails to stop attackers and can lock out real players. This makes per-person limits real, and stops message floods from a single source.
- **Files:** `src/app.ts` (`app.set("trust proxy", 1)`), `src/middlewares/rateLimit.middleware.ts`, `src/realtime/websocket.ts`.
- **Approach:** enable `trust proxy`; key `express-rate-limit` on the validated client IP; aggregate the WS message limit **per IP** (not per socket) and add a global message budget; on sustained WS abuse, `close()` the socket instead of only dropping messages.
- **Tool/lib:** existing `express-rate-limit` (in-memory store is fine for one machine).
- **Effort:** M.
- **Depends on:** `getClientIp` helper.
- **Scale flag:** in-memory limiter is per-machine; multi-machine needs a shared store (deferred, would be the one place Redis later earns its keep).

### F-06 — Rate-limit the public read endpoints
- **What it does for you:** stops someone from hammering the leaderboard/profile endpoints to overload your database.
- **Files:** `src/routes/index.ts` (or per-router), reuse the limiter middleware.
- **Approach:** a looser general per-IP limiter on `/api` read routes (separate, more generous budget than auth).
- **Tool/lib:** `express-rate-limit`.
- **Effort:** S.
- **Depends on:** F-05 (`trust proxy`) must land first or the limiter keys are wrong.

---

## Chunk 5 — Game & leaderboard integrity (P0)

### F-13 — Stop leaderboard farming (started-gate + mode-gated scoring)
- **What it does for you:** today one person can create a private room alone, make a single move, instantly "win," and bank ranked points — repeatedly. This closes that and stops casual/solo games from touching the ranked ladder.
- **Files:** `src/handlers/game.handlers.ts` (`handleMove`, `getWinner`, `endGame`/`persistFinishedMatch`), `src/handlers/queue.handlers.ts` + `src/handlers/room.handlers.ts` (set state), `src/db/repos/scores.ts`, `src/types/game.ts`.
- **Approach:** add an explicit room state machine (`lobby → active → finished`); `make_move` and win-evaluation only run when `active` (set when the room reaches its required player count, ≥2). Gate `scoresRepo.applyMatchResult` (leaderboard points) to **ranked** matches with ≥2 distinct authenticated players; casual/solo persist as history at most. Add a per-account ranked-completion velocity cap as anti-farming defense-in-depth.
- **Tool/lib:** none.
- **Effort:** M–L (most careful chunk; I'll lean on the existing `gameLogic.ts` smoke test and add cases).
- **Depends on:** nothing, but coordinate with F-14.

### F-14 — Enforce "ranked requires login" (it's documented but not enforced)
- **What it does for you:** keeps guests out of the ranked queue, which currently corrupts ranked records.
- **Files:** `src/handlers/queue.handlers.ts`.
- **Approach:** if `mode === "ranked"` and the connection identity is a guest, throw `ApiError(NOT_AUTHENTICATED, RANKED_REQUIRES_AUTH)` (the message already exists, just unused).
- **Tool/lib:** none.
- **Effort:** S.
- **Depends on:** none.

---

## Chunk 6 — Process resilience & observability (P1)

### F-20 — Graceful shutdown + crash handlers
- **What it does for you:** a single unexpected error currently can crash the whole server and drop every game at once; deploys also kill games abruptly. This makes shutdowns clean and crashes logged/contained.
- **Files:** `src/index.ts`, `src/lib/logger.ts` (Winston handlers), `src/lib/prisma.ts` (`$disconnect`).
- **Approach:** on `SIGTERM`/`SIGINT`, stop accepting connections, close the WS server (going-away code), `prisma.$disconnect()`, then exit; register Winston `exceptionHandlers`/`rejectionHandlers` (or `process.on`) that log and exit so Fly restarts a clean process.
- **Tool/lib:** built-in + Winston (already present).
- **Effort:** M.

### F-18 — Stop logging every DB query (and player emails) in production
- **What it does for you:** removes player email addresses from your logs (privacy) and cuts log noise/cost.
- **Files:** `src/lib/prisma.ts`.
- **Approach:** `log: config.NODE_ENV === "production" ? ["warn", "error"] : ["query","info","warn","error"]`.
- **Tool/lib:** none. **Effort:** S.

### F-19 — Make attacks visible (security events + client IP)
- **What it does for you:** right now an attack is invisible until the server falls over; this emits searchable warnings you can see in `fly logs`.
- **Files:** `src/realtime/websocket.ts`, `src/router.ts`, `src/middlewares/rateLimit.middleware.ts`.
- **Approach:** rate-limited `warn` logs for rate-limit trips, oversized/malformed frames, rejected origins, and auth-failure bursts, including a **truncated/hashed** client IP (privacy-aware, ties to F-27).
- **Tool/lib:** Winston (present). **Effort:** S–M.

---

## Chunk 7 — HTTP edge hygiene (P1)

### F-21 — CORS allowlist instead of "any site"
- **What it does for you:** restricts API use to your own frontend.
- **Files:** `src/app.ts`. **Approach:** `cors({ origin: ALLOWED_ORIGINS.split(",") })`. **Needs from you:** the frontend origin URL(s). **Effort:** S.

### F-22 — Security headers
- **What it does for you:** cheap best-practice headers (HSTS, nosniff) for a public service.
- **Files:** `src/app.ts`. **Approach:** add `helmet()` with API-appropriate config. **Tool/lib:** [`helmet`](https://www.npmjs.com/package/helmet) (free). **Effort:** S.

---

## Chunk 8 — Auth hygiene (P1)

### F-16 — Equalize login timing (stop email enumeration)
- **Files:** `src/services/auth.service.ts`. **Approach:** run a dummy `bcrypt.compare` against a fixed hash when the user is missing so response time doesn't reveal whether an email exists. **Effort:** S.

### F-04 — Token hardening (backend parts now; flag frontend)
- **Files:** `src/utils/jwt.ts`, `src/constants/config.ts`. **Approach (backend-safe):** pin `algorithms: ["HS256"]`, set/validate `iss`/`aud`, shorten TTL. **Flag:** moving the token out of the WS URL into the `Sec-WebSocket-Protocol` header needs a **frontend** change — out of scope; I'll open it as a frontend ticket. **Effort:** S.

### F-17 — Password max length
- **Files:** `src/schemas/auth.schemas.ts`. **Approach:** add `.max(200)`; keep policy light (this is a game, not a bank — heavier rules hurt signups for no real gain). **Effort:** S.

---

## Chunk 9 — Dependencies & container (P1)

### F-23 — Bump `ws` past the advisory
- **Files:** `package.json`, lockfile. **Approach:** upgrade `ws` to the patched release, re-run `npm audit`. **Effort:** S.

### F-24 — Slim, non-root container
- **Files:** `backend/Dockerfile`. **Approach:** in the runner stage install prod-only deps (`npm ci --omit=dev`), add `USER node`, run under an init (Fly `init`/tini) so signals (Chunk 6) are handled. Drops the vulnerable Prisma dev-tooling chain from the image. **Effort:** M.

### F-25 — CI: audit + secret scanning
- **Files:** `.github/workflows/ci.yml`. **Approach:** add a non-blocking `npm audit --audit-level=high` step; enable GitHub secret scanning + Dependabot (free). **Effort:** S.

---

## Chunk 10 — Input & abuse polish (P2)

### F-11 — Bound `make_move` coordinates in the schema
- **Files:** `src/schemas/messages.schemas.ts`. **Approach:** `row`/`col` `.min(0).max(LIMITS.GRID_MAX - 1)` (defense-in-depth; handler already bounds them). **Effort:** S.

### F-12 — Name charset policy
- **Files:** `src/schemas/messages.schemas.ts`, `src/schemas/auth.schemas.ts`. **Approach:** strip control/zero-width/bidi chars, collapse whitespace, reserve the `Guest ` prefix for server-assigned names (stops impersonation). **Effort:** S.

---

## Chunk 11 — Privacy / GDPR (P2)

### F-27 — Account deletion + IP retention policy
- **What it does for you:** EU users + ad cookies mean you need a "delete my account" path and a clear stance on IP logging.
- **Files:** new authenticated route/controller/service + `src/db/repos/players.ts` (delete leveraging existing cascade relations); short docs note on IP retention (PII-in-logs already fixed in Chunk 6).
- **Approach:** `DELETE /api/me` (auth) → cascade-deletes score/match-player rows; document that any logged IPs are truncated/short-retention. **Note:** the cookie-consent banner is **frontend** (out of scope) — flag for coordination. **Effort:** M.

---

## Chunk 12 — Fly + Cloudflare edge (P2 — mostly your action)

### F-26 — Fly health check, VM sizing, min machine
- **Files:** `backend/fly.toml`. **Approach:** add `[[http_service.checks]]` hitting `/api/health`; set `[[vm]]` memory (≈512 MB); `min_machines_running = 1` for launch; add `[http_service.concurrency]` limits. I write the config; you deploy. **Effort:** S.

### F-07 — Cloudflare free in front of Fly
- **What it does for you:** hides your server's real IP and absorbs large volumetric attacks for free. **Won't** filter per-message WS floods (that's what Chunks 2/4 are for) — so it complements, doesn't replace them.
- **Your action:** add the domain to Cloudflare (free), proxy DNS to Fly, and lock Fly to accept only Cloudflare. I'll give a step-by-step checklist; **don't buy** Pro/WAF — not cost-justified for this.
- **Effort:** S (you) — no code.

### F-10 — Event-loop micro-opt (monitor, defer)
Not a launch blocker. Keep `SAFETY_BREAK`; if move latency shows up under load, switch the cascade to a worklist instead of full-board rescans.

---

## Suggested sequencing

1. **Launch-blockers (P0):** Chunk 1 → 2 → 3 → 4 → 5. (1 first; 2 before 3's connection cap; 4 before 6's IP reuse.)
2. **Soon after:** Chunk 6 → 7 → 8 → 9.
3. **At your pace:** Chunk 10 → 11 → 12.

After each chunk in Phase 3: diff shown, `/security-review` run on it, plain-language "what changed" + exact manual test steps, then your OK before the next. Docs (`CLAUDE.md`, `docs/`, `PLAN.md`, `TODO.md`) updated as work lands.
