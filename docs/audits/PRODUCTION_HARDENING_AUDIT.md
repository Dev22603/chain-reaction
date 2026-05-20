# Chain Reaction — Backend Production Hardening Audit

- **Date:** 2026-05-20
- **Branch:** `claude/harden-backend-production-6qIcf`
- **Scope:** Backend (`backend/`) only. The full live attack surface — the WebSocket game protocol **and** the JWT auth / HTTP API / Postgres persistence that already exist in the code — because all of it is reachable from the public internet via Fly.io. Frontend is explicitly out of scope.
- **Target model:** Unauthenticated-by-default public real-time multiplayer game, ads-funded, with an optional account/ranked layer already implemented. Single Fly.io machine, free-tier services only, in-memory game state, no Redis.
- **Method:** Manual code review of the entire backend (`src/`, `prisma/`, `Dockerfile`, `fly.toml`, CI), `npm audit`, and threat modelling (see `THREAT_MODEL.md`). At audit time the Sentry/Phoenix/trailofbits/OWASP/WebSocket-Engineer skills named in the task brief were not installed, so the primary pass used an equivalent manual STRIDE/DREAD + OWASP + `ws`-hardening review. The **Sentry `find-bugs` + `security-review`** and **WebSocket Engineer** skills were subsequently installed (merged from `main`) and used as a **cross-check pass** — see *Cross-check against installed skills* below and Appendix B. Phoenix, trailofbits, and agamm OWASP remain unavailable. Findings carry an explicit confidence rating in place of the skills' automated scoring.

> **Note on the brief vs. reality:** the task framed this as "no user accounts, no payments, Postgres deferred." The code already contains full JWT auth (`signup`/`login`/`me` + WS `?token=`), bcrypt, accounts, and a Prisma/Postgres scoring layer with migrations. This audit treats those as in-scope live surface. The "do not add Postgres" constraint is moot (it is already here); no new infrastructure is proposed — only hardening of what exists.

## How to read this

- **Severity** = impact if exploited, in *this* product (an ads-funded game where the crown jewels are service availability, leaderboard integrity, and a small amount of account PII). Not a generic CVSS.
- **Confidence** = how sure I am the issue is real and exploitable as described (High = confirmed by reading the code path end to end; Medium = strong inference; Low = plausible, needs validation).
- Each finding: **What / Why it matters / Current state (file cited) / Severity / Confidence / Direction.**

## Summary

| Severity | Count | IDs |
|----------|-------|-----|
| Critical | 1 | F-01 |
| High | 5 | F-02, F-05, F-08, F-09, F-13 |
| Medium | 13 | F-03, F-04, F-06, F-07, F-14, F-15, F-16, F-18, F-19, F-20, F-21, F-26, F-27 |
| Low | 8 | F-10, F-11, F-12, F-17, F-22, F-23*, F-24, F-25 |

\* F-23 (`ws` advisory) is Medium-leaning but kept in the dependency block; see note.

**Headline:** the single most dangerous issue is the **JWT secret fallback (F-01)** — one missed Fly secret silently makes every account forgeable. The most *certain* day-one problems for a public launch are **resource-exhaustion DoS** (F-02, F-08, F-09) and **broken rate limiting** (F-05), all trivially triggerable by an unauthenticated client. **Leaderboard farming (F-13)** will be discovered within days of launch and destroys the one product feature this audit's "in-scope assets" cares about most.

## Findings index

| ID | Title | Severity | Confidence |
|----|-------|----------|------------|
| F-01 | JWT secret falls back to a hardcoded default with no production guard | Critical | High |
| F-02 | No WS payload cap, no heartbeat/idle timeout, no connection caps | High | High |
| F-03 | No `Origin` validation on the WebSocket upgrade | Medium | High |
| F-04 | JWT carried in the WS URL query string; weak token lifecycle | Medium | High |
| F-05 | Per-IP rate limiting is broken behind Fly's proxy; WS limit is per-socket and bypassable | High | High |
| F-06 | No rate limiting on unauthenticated HTTP read endpoints | Medium | High |
| F-07 | No edge DDoS protection; origin reachable; single-machine L7 exposure | Medium | High |
| F-08 | Abandoned-room memory leak (solo private room on disconnect) | High | High |
| F-09 | No caps on concurrent rooms, queue size, or connections | High | High |
| F-10 | Chain-reaction simulation blocks the event loop on large boards | Low | Medium |
| F-11 | `make_move` coordinates are unbounded in the Zod schema | Low | High |
| F-12 | Display/player names allow control chars and impersonation | Low | Medium |
| F-13 | Leaderboard farming: solo-room instant win + no game-mode gate on scoring | High | High |
| F-14 | Ranked-queue auth requirement is documented but never enforced | Medium | High |
| F-15 | Trivial Sybil/multi-account, name spoofing, and collusion (abuse surface) | Medium | Medium |
| F-16 | Account enumeration via login timing and signup error | Medium | Medium |
| F-17 | Weak password policy; no maximum length | Low | High |
| F-18 | Prisma query logging enabled in production (PII + log volume) | Medium | High |
| F-19 | No in-flight attack detection or security signals; no client IP captured | Medium | Medium |
| F-20 | No graceful shutdown; no `unhandledRejection`/`uncaughtException` handlers | Medium | High |
| F-21 | Open CORS (`Access-Control-Allow-Origin: *`) | Medium | High |
| F-22 | No security headers (no `helmet`) | Low | High |
| F-23 | `ws` 8.20.0 has a moderate advisory and is a direct production dependency | Medium | High |
| F-24 | Container ships dev dependencies, runs as root, no init process | Medium | High |
| F-25 | CI has no dependency audit or secret scanning | Low | High |
| F-26 | Fly config gaps: no health check, no VM sizing, scale-to-zero cold start | Medium | Medium |
| F-27 | GDPR gaps: no erasure/export, no consent record, undefined IP retention | Medium | High |

---

## A. Secrets & configuration

### F-01 — JWT secret falls back to a hardcoded default with no production guard
- **What:** `JWT_SECRET` defaults to the literal string `"change-me-in-development"` when the env var is unset, and nothing validates it at boot.
- **Why it matters:** if a production deploy ever ships without `JWT_SECRET` set (forgotten Fly secret, renamed var, broken release), the server boots happily signing and verifying tokens with a **publicly known** secret. Anyone can forge a token for any `sub` (player id) and `email`, achieving full account takeover, ranked-score manipulation, and impersonation. The failure is silent — there is no log, no crash, no signal. The same default is also committed in `.env.example`, so the value is in the repo.
- **Current state:** `src/constants/config.ts:11` (`JWT_SECRET: process.env.JWT_SECRET ?? "change-me-in-development"`); used by `src/utils/jwt.ts:9,16`. No startup validation anywhere (`src/index.ts` does no env checks).
- **Severity:** Critical
- **Confidence:** High
- **Direction:** Fail closed — on boot in production, refuse to start if `JWT_SECRET` is unset, equals the default, or is shorter than ~32 chars; never embed a usable default.

---

## B. WebSocket attack surface

### F-02 — No WS payload cap, no heartbeat/idle timeout, no connection caps
- **What:** The `WebSocketServer` is created with no `maxPayload`, no ping/pong liveness loop, and no per-IP or global connection limit.
- **Why it matters:** three distinct DoS vectors on a single machine: (1) `ws` defaults `maxPayload` to **100 MiB**, so one client can force the server to buffer huge frames — a handful of connections sending large payloads exhausts the 256 MB default Fly VM; (2) with no ping/pong, half-open ("dead") TCP connections are never detected or reaped, so sockets and their `players`/`connections`/`rateLimitState` entries accumulate indefinitely behind NAT/mobile drops; (3) with no connection cap, an attacker opens tens of thousands of sockets and exhausts file descriptors / memory before any game logic is even reached.
- **Current state:** `src/realtime/websocket.ts:22` (`new WebSocketServer({ server })` — no options); `wireSocketEvents` (`:77`) registers `message`/`close` but no `pong`/`ping` handling; no `clients` size check; grep confirms no `maxPayload`/`isAlive`/`ping`/`heartbeat` anywhere in `src/`.
- **Severity:** High
- **Confidence:** High
- **Direction:** Set `maxPayload` to a few KB (largest legit client frame is tiny); add a 30s `ping`/`pong` sweep that terminates unresponsive sockets, plus an idle timeout that closes sockets with no game activity; cap total `wss.clients` and connections-per-IP (using the Fly client IP, see F-05). (All four are the exact controls prescribed in `websocket-engineer/references/security.md`.)

### F-03 — No `Origin` validation on the WebSocket upgrade
- **What:** The upgrade handshake accepts connections from any origin; there is no `verifyClient`/`handleProtocols` origin allowlist.
- **Why it matters:** any third-party website can open WebSocket connections to the backend and drive game traffic (bot farms, embedding the game elsewhere, automated abuse). Because auth here is a query-string token rather than a cookie, classic cross-site WebSocket hijacking (riding a victim's session) does **not** apply — which is why this is Medium, not High — but origin pinning is still the standard, cheap first gate against off-site automation.
- **Current state:** `src/realtime/websocket.ts:21-29`; no origin check; grep confirms no `verifyClient`/`origin` handling.
- **Severity:** Medium
- **Confidence:** High
- **Direction:** Reject upgrades whose `Origin` is not in an allowlist (the deployed frontend origin(s)); allow native/no-origin clients only if explicitly desired.

### F-04 — JWT carried in the WS URL query string; weak token lifecycle
- **What:** The WebSocket auth token is read from `?token=` on the connection URL. Tokens also have a 7-day TTL, `jwt.verify` does not pin the algorithm, and there is no revocation path.
- **Why it matters:** query strings end up in access logs, proxy logs, Fly logs, browser history, and `Referer` headers — far more exposure surface than a header. Combined with a 7-day lifetime and no revocation, a single leaked URL is a week-long account compromise. Not pinning `algorithms` is a latent footgun (defense-in-depth against algorithm confusion).
- **Current state:** `src/realtime/websocket.ts:168-171` (`url.searchParams.get("token")`); `src/utils/jwt.ts:16` (`jwt.verify(token, config.JWT_SECRET)` with no `algorithms`); `config.JWT_EXPIRES_IN` default `"7d"` (`src/constants/config.ts:12`).
- **Severity:** Medium
- **Confidence:** High
- **Direction:** Pass the token via the `Sec-WebSocket-Protocol` subprotocol header instead of the URL; pin `algorithms: ["HS256"]` and set/validate `iss`/`aud` claims in `verify`; shorten TTL and plan a refresh/rotation story (revocation list is deferred — it would need shared state we don't have yet, so flag for scale).

---

## C. Rate limiting

### F-05 — Per-IP rate limiting is broken behind Fly's proxy; WS limit is per-socket and bypassable
- **What:** Two compounding problems. (1) HTTP: `express-rate-limit` keys on `req.ip`, but the app never calls `app.set("trust proxy", ...)`. Behind Fly's edge proxy, `req.ip` is the *proxy's* address, identical for every client — so the auth limiter (10 / 15 min) is effectively a single **global** bucket shared by all users, not per-attacker. (2) WS: the message rate limit is stored in a `WeakMap` keyed by the *socket*, so an attacker who opens N connections gets N× the budget, and there is no per-IP aggregation at all.
- **Why it matters:** the HTTP limiter is supposed to stop credential brute-force/stuffing on `login`; behind the proxy it instead lets one shared counter throttle *legitimate* users (an attacker can even DoS login for everyone by burning the shared bucket), while a distributed attacker rotating connections is barely slowed. The WS limiter looks like flood protection but is trivially bypassed by reconnecting/multi-connecting. The actual client IP is available (`Fly-Client-IP` header / `X-Forwarded-For`) but is never read.
- **Current state:** `src/app.ts` (no `trust proxy`); `src/middlewares/rateLimit.middleware.ts:1-9`; `src/realtime/websocket.ts:19` (`new WeakMap<WebSocket, …>`) and `:80-97` (per-socket counter); grep confirms no `trust proxy` and no client-IP usage anywhere.
- **Severity:** High
- **Confidence:** High
- **Direction:** Set `app.set("trust proxy", 1)` (Fly is a single hop) and key all limiters on the validated client IP; aggregate WS limits per IP (and add a global message budget) using `Fly-Client-IP`; on sustained WS abuse, close the socket rather than just dropping messages. In-memory keying is acceptable on one machine — **flag:** this breaks the moment we run >1 machine (would need shared state we're intentionally deferring).

### F-06 — No rate limiting on unauthenticated HTTP read endpoints
- **What:** `GET /api/leaderboard`, `GET /api/players/:playerId`, and `GET /api/players/:playerId/matches` are public with no limiter.
- **Why it matters:** each hits Postgres (the `players/:id/matches` query joins matches + participants + players). An unauthenticated scraper or flood drives unbounded DB load on the single instance and its Postgres, degrading the whole service. Only `signup`/`login` are limited today.
- **Current state:** `src/routes/leaderboard.routes.ts`, `src/routes/players.routes.ts` (no limiter); `authLimiter` is applied only in `src/routes/auth.routes.ts:9-10`.
- **Severity:** Medium
- **Confidence:** High
- **Direction:** Add a general per-IP limiter on `/api` (after the F-05 `trust proxy` fix), with a looser budget than auth.

---

## D. DDoS resilience

### F-07 — No edge DDoS protection; origin reachable; single-machine L7 exposure
- **What:** Traffic hits the Fly app directly; there is no CDN/edge layer, and the origin is a single machine.
- **Why it matters:** a layer-7 flood (mass WS upgrades or message floods) lands directly on one Node process. With no connection/payload caps (F-02) and broken rate limiting (F-05), the event loop saturates and all players are affected. Fly's `auto_start`/autoscale will not save you — it scales on healthy load, not on an attack, and scaling out costs money while also breaking the in-memory single-machine model.
- **Current state:** `fly.toml` (`force_https`, `auto_stop_machines`, `auto_start_machines`; no edge, no concurrency limits); architecture is single-region `iad`.
- **Severity:** Medium
- **Confidence:** High
- **Direction (free-tier reality check):**
  - **Cloudflare free tier in front of Fly *does* buy:** always-on L3/L4 volumetric DDoS absorption; **origin IP hiding** (so attackers can't bypass to the Fly app directly — requires locking Fly to only accept Cloudflare); free TLS; "Bot Fight Mode"; and **one** rate-limiting rule on the *HTTP handshake*.
  - **It does *not* buy (important for us):** WebSocket **frame** inspection or rate limiting. Once the `Upgrade` completes, Cloudflare is a passthrough tunnel — it sees one long-lived connection, not your `make_move`/`join_queue` floods. The free WAF is minimal and the single free rate-limit rule is coarse.
  - **Conclusion:** Cloudflare free is worth adding for IP hiding + L3/4 + handshake throttling, but **the per-message and connection-exhaustion defenses must live in the app** (F-02, F-05, F-09). Do not pay for Cloudflare/WAF for this — the paid WS protections are not cost-justified pre-revenue. This is the correct free-tier split.

---

## E. Resource exhaustion

### F-08 — Abandoned-room memory leak (solo private room on disconnect)
- **What:** When a player who is the **only** member of a room disconnects, the room, its invite code, and its `playerRooms` mapping are never deleted.
- **Why it matters:** the close handler routes a guest in a room to `handleLeaveGame` → `eliminateAndBroadcast`, which marks the lone player eliminated and then calls `getWinner`. With zero players left alive, `getWinner` returns `null` (it only returns a winner when *exactly one* remains), so `endGame` (the only path that deletes the room/code/mapping) never runs. The entry leaks permanently. An unauthenticated attacker loops `create_room` → disconnect to grow `rooms` and `roomCodes` without bound until the machine OOMs. No reaper exists.
- **Current state:** `src/handlers/game.handlers.ts:81-112` (`eliminateAndBroadcast` — no cleanup when `alive.length === 0`); `:138-141` (`getWinner` returns a winner only at `length === 1`); cleanup lives only in `endGame` `:188-194`; close path `src/realtime/websocket.ts:99-117`; state maps `src/state/memory.ts`.
- **Severity:** High
- **Confidence:** High
- **Direction:** On disconnect/forfeit, when no players remain alive, delete the room + its `inviteCode` from `roomCodes` + all `playerRooms` entries; add a periodic reaper for rooms with no connected sockets and an idle-room TTL (private rooms never filled).

### F-09 — No caps on concurrent rooms, queue size, or connections
- **What:** There is no maximum on the number of rooms, the size of any queue bucket, or total/concurrent connections.
- **Why it matters:** even without the F-08 leak, an attacker (or organic spike) can create unbounded rooms, pile unbounded entries into a queue bucket (one entry per connection; connections are unlimited), or open unbounded sockets — each consuming memory on a 256 MB VM. These are the standard "unauthenticated public game" exhaustion levers and there is currently no ceiling on any of them.
- **Current state:** `src/state/memory.ts` (plain `Map`s, no size guards); `src/handlers/queue.handlers.ts:40-79`, `src/handlers/room.handlers.ts:23-77` (no global caps before insert); `LIMITS` in `src/constants/app.constants.ts` has grid/player caps but no room/queue/connection caps.
- **Severity:** High
- **Confidence:** High
- **Direction:** Add `LIMITS.MAX_ROOMS`, `LIMITS.MAX_QUEUE_SIZE`, `LIMITS.MAX_CONNECTIONS`, and per-IP connection/room caps; reject past the ceiling with a typed error. In-memory counters are fine on one machine (flag for multi-machine).

### F-10 — Chain-reaction simulation blocks the event loop on large boards
- **What:** `applyMove` runs a synchronous loop that rescans the entire board each pass (up to `SAFETY_BREAK = 2000` passes), recomputing critical mass per cell.
- **Why it matters:** Node is single-threaded; a long cascade on a 20×20 board momentarily blocks *all* connections on the machine. Moves are validated (own/empty cell, in turn, in bounds), so this is not a direct injection vector and worst-case work is bounded, but the whole-board rescan-per-pass is needlessly O(passes × cells) and adds tail latency under load. Listed for completeness, not as an urgent exploit.
- **Current state:** `src/game/gameLogic.ts:39-109` (`applyMove`; `getCriticalMass` recomputed in inner loops `:64,76,85`).
- **Severity:** Low
- **Confidence:** Medium
- **Direction:** Keep `SAFETY_BREAK`; optionally switch to a queue/worklist of unstable cells instead of full rescans. Not a launch blocker; monitor for slow moves.

---

## F. Input validation

### F-11 — `make_move` coordinates are unbounded in the Zod schema
- **What:** `MakeMoveSchema` validates `row`/`col` as `z.number().int()` with no min/max.
- **Why it matters:** out-of-range values currently fail the handler's `isInBounds` check and are dropped, so there's no live exploit — but the schema should reject impossible coordinates at the boundary (defense-in-depth, and it keeps the contract honest). Very large integer-valued floats also slip past `.int()`.
- **Current state:** `src/schemas/messages.schemas.ts:42-46`; bounds enforced downstream at `src/handlers/game.handlers.ts:24,123-125`.
- **Severity:** Low
- **Confidence:** High
- **Direction:** Add `.min(0).max(LIMITS.GRID_MAX - 1)` (or validate against the room's actual dimensions in the handler and reject otherwise).

### F-12 — Display/player names allow control chars and impersonation
- **What:** `playerName`/`displayName` are length-capped (≤100) and trimmed, but there is no charset policy — control characters, newlines, zero-width, RTL-override, and homoglyphs are accepted; guests can also pick names like `Guest 0a1b2c3d` that mimic the server-assigned guest format.
- **Why it matters:** enables impersonation of other players and of the "Guest" naming convention, and confusing/abusive display names broadcast to the whole room and stored in match history. Stored-XSS risk is low (React escapes, and frontend is out of scope) and Winston JSON-encodes fields (so log injection is mitigated), which is why this is Low — but identity confusion is a real social-abuse lever in an unauthenticated game.
- **Current state:** `src/schemas/messages.schemas.ts:31-36,53-58,76-83` and `src/schemas/auth.schemas.ts:12-16`.
- **Severity:** Low
- **Confidence:** Medium
- **Direction:** Restrict to a sane printable range, collapse internal whitespace, strip control/zero-width/bidi characters, and reserve the `Guest …` prefix for server-assigned names.

> **Prototype pollution & integer overflow — assessed, low risk:** every client frame goes through `JSON.parse` then a Zod object schema; Zod returns a fresh object with only known keys, so `__proto__`/`constructor` payloads never reach handlers (`src/router.ts:16-23`, `src/schemas/messages.schemas.ts:86-107`). Grid/player counts are bounded (3–20, 2–8) so board allocation cannot overflow. No raw SQL anywhere — all DB access is parameterized via Prisma. No action required beyond F-11.

---

## G. Identity & abuse without auth

### F-13 — Leaderboard farming: solo-room instant win + no game-mode gate on scoring
- **What:** A single authenticated user can mint unlimited leaderboard points. Root causes chain together: (1) `handleMove` has no "game has started / has ≥2 players" gate, so the creator of a private room can move immediately; (2) after one move `turnCount (1) >= players.length (1)`, the elimination check runs, the lone creator is "not eliminated," and `getWinner` returns them as the winner; (3) `endGame` → `persistFinishedMatch` → `scoresRepo.applyMatchResult` apply scoring with **no game-mode check**, so even `casual` and these solo games update the ranked `PlayerScore` (+3 for a win). The documented rule "casual games do not affect the leaderboard" is not implemented.
- **Why it matters:** the leaderboard is the core retention/engagement asset for a chess.com-style game. A scripted `create_room` → `make_move` loop (2 frames/cycle, well under the 60/min cap) farms points indefinitely and also writes a DB row per fake match. Two colluding accounts in a private room achieve the same with a fig leaf of legitimacy. This will be found and ruins the ladder.
- **Current state:** `src/handlers/game.handlers.ts:13-55` (no started/min-players gate), `:138-141` (`getWinner` win-at-1), `:162-209` (`endGame`), `:211-272` (`persistFinishedMatch` — no `mode` check before `recordFinished`/`applyMatchResult`); `src/db/repos/scores.ts:25-70` (`applyMatchResult` unconditional); private rooms are created as `casual` (`src/handlers/room.handlers.ts:45`).
- **Severity:** High
- **Confidence:** High
- **Direction:** Gate `make_move` and win evaluation on an explicit `started` flag set only when the room reaches its required player count (≥2); restrict `applyMatchResult` (leaderboard points) to `ranked` matches with ≥2 distinct authenticated participants; persist casual/solo as history at most, never as score. Model this as a server-side game state machine (lobby → active → finished) with valid transitions (the `business-logic.md` workflow-bypass fix), and add a per-account ranked-completion velocity cap as anti-farming defense-in-depth.

### F-14 — Ranked-queue auth requirement is documented but never enforced
- **What:** `PROTOCOL.md` and the `RANKED_REQUIRES_AUTH` message say ranked queue requires an authenticated identity, but `handleJoinQueue` performs no such check.
- **Why it matters:** guests can join ranked queues. Combined with the persistence rules, a guest *winning* a ranked match means the match is skipped entirely (winner is a guest → no record), so the authenticated *losers* never get their loss recorded — corrupting ranked stats — and ranked buckets get polluted with non-ranked players. `RANKED_REQUIRES_AUTH` is defined but referenced nowhere (confirmed by grep).
- **Current state:** `src/handlers/queue.handlers.ts:40-79` (reads `mode`, never checks `connections.get(playerId)?.isGuest`); message defined unused at `src/constants/app.messages.ts:8`.
- **Severity:** Medium
- **Confidence:** High
- **Direction:** In `handleJoinQueue`, if `mode === ranked` and the identity is a guest, throw `ApiError(NOT_AUTHENTICATED, RANKED_REQUIRES_AUTH)`.

### F-15 — Trivial Sybil/multi-account, name spoofing, and collusion (abuse surface)
- **What:** With guests issued a fresh `randomUUID` per connection and accounts created with only an email + 8-char password, identity is effectively free and unlimited.
- **Why it matters:** this is the inherent cost of an unauthenticated, ads-funded game and cannot be eliminated on the free tier — but it bounds what *any* anti-abuse can achieve and feeds F-13/F-14. Realistic levers: one machine, one IP can spin up unlimited guest identities; win-trading between accounts; queue griefing (join/leave churn); invite-code guessing (F, see below). There is no email verification, no proof-of-work, no per-IP identity throttle.
- **Current state:** `src/realtime/websocket.ts:173-182` (`buildGuestIdentity` → `randomUUID`); `src/services/auth.service.ts:14-29` (signup with no email verification); `src/schemas/auth.schemas.ts:10` (password `min(8)` only).
- **Severity:** Medium
- **Confidence:** Medium
- **Direction (free-tier realistic):** don't chase perfect identity. Constrain *impact* instead: per-IP connection/room/queue caps (F-09), ranked gating (F-13/F-14), and basic anti-collusion heuristics (e.g., refuse ranked scoring when both players share an IP) deferred but noted. Email verification and CAPTCHA/Turnstile (Cloudflare Turnstile is free) are optional later additions if abuse materializes — flag, don't build yet.

---

## H. Auth, sessions & HTTP API

### F-16 — Account enumeration via login timing and signup error
- **What:** `login` returns immediately (no password hash to compare) for unknown emails but runs a ~100 ms bcrypt compare for known ones — a timing oracle. `signup` returns a distinct `409 EMAIL_TAKEN`, directly confirming registration.
- **Why it matters:** lets an attacker enumerate which emails have accounts, feeding targeted credential stuffing/phishing. The login response *message* is already neutral ("Invalid email or password") — good — but the timing difference and the signup error leak the same fact.
- **Current state:** `src/services/auth.service.ts:31-43` (early `throwInvalidCredentials()` before any bcrypt work) and `:14-18` (signup `EMAIL_TAKEN`).
- **Severity:** Medium
- **Confidence:** Medium
- **Direction:** Perform a dummy `bcrypt.compare` against a fixed hash when the user is missing, to equalize timing. Signup enumeration is a UX/security trade-off (users expect "email already registered"); accept it but ensure F-05/F-06 rate limiting throttles probing.

### F-17 — Weak password policy; no maximum length
- **What:** Passwords require only `min(8)` with no complexity and no max length.
- **Why it matters:** weak passwords are easy to stuff/guess; no max length is a minor footgun (bcrypt silently truncates at 72 bytes, so very long inputs aren't a DoS but the truncation is surprising). Low because this is a game account, not a bank.
- **Current state:** `src/schemas/auth.schemas.ts:10`.
- **Severity:** Low
- **Confidence:** High
- **Direction:** Add a max length (e.g., 200) and consider a minimal breach/length check; keep it light — heavy complexity rules hurt signup conversion for a game (a player-experience trade-off worth not over-engineering).

---

## I. Logging & observability

### F-18 — Prisma query logging enabled in production (PII + log volume)
- **What:** The Prisma client is constructed with `log: ["query", "info", "warn", "error"]` unconditionally.
- **Why it matters:** `query` logging emits every SQL statement (and parameters) to stdout, which Fly captures. That includes **email addresses** (PII) on every signup/login lookup — a GDPR concern (see F-27) — plus a large, costly log volume on the free tier that buries real signals.
- **Current state:** `src/lib/prisma.ts:10-13`.
- **Severity:** Medium
- **Confidence:** High
- **Direction:** Use `["warn", "error"]` in production; gate verbose query logging behind `NODE_ENV !== "production"`.

### F-19 — No in-flight attack detection or security signals; no client IP captured
- **What:** Logging is lifecycle-oriented (connect/disconnect/game events). There is no counter or warn-level signal for flood/oversized/malformed-frame patterns, rejected upgrades, or auth-failure spikes, and the client IP is never recorded, so nothing can be correlated to a source.
- **Why it matters:** on the free tier we won't have a paid SIEM, but the app should still emit structured `warn` events that make an attack visible in `fly logs` (and alertable later). Today an attack is invisible until the machine falls over.
- **Current state:** `src/lib/logger.ts` (Winston JSON to console — good base); no security-event logging in `src/realtime/websocket.ts` / `src/router.ts` beyond generic errors; no IP captured (grep).
- **Severity:** Medium
- **Confidence:** Medium
- **Direction:** Emit rate-limited `warn` events for rate-limit trips, oversized/malformed frames, rejected origins, and auth-failure bursts, including a hashed/truncated client IP; document a free-tier alerting path (e.g., `fly logs` + a simple log-based check). **Privacy note:** if we start logging IPs, do it with justification and retention limits (F-27).

---

## J. Process hardening

### F-20 — No graceful shutdown; no `unhandledRejection`/`uncaughtException` handlers
- **What:** `index.ts` only calls `server.listen`. There are no `SIGTERM`/`SIGINT` handlers, no `process.on("unhandledRejection"/"uncaughtException")`, and no `prisma.$disconnect()` on exit.
- **Why it matters:** (1) Fly sends `SIGTERM` on every deploy/restart/scale event; with no draining, in-flight games are killed abruptly and sockets are not closed cleanly. (2) A single unhandled promise rejection or thrown async error can crash the *entire* process — taking down every concurrent game — with no controlled logging. For a single-machine, in-memory game this is the difference between "one game errors" and "everyone is dropped."
- **Current state:** `src/index.ts:1-14` (no handlers); grep confirms no `SIGTERM`/`unhandledRejection`/`uncaughtException`/`$disconnect` in `src/`.
- **Severity:** Medium
- **Confidence:** High
- **Direction:** Add a shutdown routine (stop accepting connections, close the WS server with a going-away code, `prisma.$disconnect()`, then exit) on `SIGTERM`/`SIGINT`; register Winston `exceptionHandlers`/`rejectionHandlers` (or `process.on`) that log and exit cleanly so Fly restarts a known-good process.

---

## K. Transport & headers

### F-21 — Open CORS (`Access-Control-Allow-Origin: *`)
- **What:** `app.use(cors())` enables wildcard CORS for all routes.
- **Why it matters:** any website can call the API from a browser and read responses. Since auth uses an `Authorization` header (not cookies), CSRF/credential-riding is not the concern; the issue is that the API and leaderboard are usable by any origin and the auth endpoints accept cross-origin browser requests (broadening the credential-stuffing surface). Lower impact than for a cookie-auth app, hence Medium.
- **Current state:** `src/app.ts:8`.
- **Severity:** Medium
- **Confidence:** High
- **Direction:** Restrict `origin` to the known frontend origin(s) via env config.

### F-22 — No security headers (no `helmet`)
- **What:** No `helmet` or manual security headers.
- **Why it matters:** the backend serves JSON + WS (no HTML), so the impact is limited — but `Strict-Transport-Security` and `X-Content-Type-Options: nosniff` are essentially free wins, and a restrictive default header set is good hygiene for a public service.
- **Current state:** `src/app.ts` (only `cors` + `express.json`); grep confirms no `helmet`.
- **Severity:** Low
- **Confidence:** High
- **Direction:** Add `helmet` with an API-appropriate config (HSTS on, sensible defaults; CSP largely N/A for a JSON API).

---

## L. Dependency security

### F-23 — `ws` 8.20.0 has a moderate advisory and is a direct production dependency
- **What:** `npm audit` flags `ws@8.20.0` (GHSA-58qx-3vcg-4xpx, uninitialized memory disclosure; affects 8.0.0–8.20.0). `ws` is our core transport.
- **Why it matters:** unlike the other audit hits (which are in Prisma's dev tooling), this one is on the live request path. A patched release is available.
- **Current state:** `package.json:34` (`"ws": "^8.18.0"`), lockfile resolves `8.20.0`.
- **Severity:** Medium
- **Confidence:** High
- **Direction:** Bump `ws` to the patched version and re-run `npm audit`.

### F-24 — Container ships dev dependencies, runs as root, no init process
- **What:** The Dockerfile installs all deps (`npm ci`) in the builder and copies the **entire** `node_modules` into the runner; the runner runs as `root` with `node` as PID 1 and no init.
- **Why it matters:** dev tooling (Prisma CLI → `hono`, `@hono/node-server`, `fast-uri` — the high/moderate `npm audit` hits) ships to production, enlarging the on-disk attack surface even though it isn't loaded at runtime. Running as root maximizes blast radius of any RCE/container escape. Node as PID 1 with no init means signals (F-20's `SIGTERM`) and zombie reaping aren't handled cleanly.
- **Current state:** `backend/Dockerfile:5` (`npm ci`), `:13-15` (copy full `node_modules`/`package*`/`dist`), no `USER`, no `--init`/tini.
- **Severity:** Medium
- **Confidence:** High
- **Direction:** In the runner stage install prod-only deps (`npm ci --omit=dev`) or `npm prune --omit=dev`; add a non-root `USER node`; run with an init (Fly's `[experimental] init`/tini or `node --enable-source-maps` behind tini) so signals are forwarded.

### F-25 — CI has no dependency audit or secret scanning
- **What:** `ci.yml` runs install + Prisma generate + build + lint only; no `npm audit`, no secret scanning, and it triggers only on `main` / PRs to `main`.
- **Why it matters:** vulnerable deps (F-23) and accidentally committed secrets won't be caught automatically. These are free on GitHub.
- **Current state:** `.github/workflows/ci.yml`.
- **Severity:** Low
- **Confidence:** High
- **Direction:** Add a non-blocking `npm audit --audit-level=high` step; enable GitHub secret scanning + Dependabot (free for the repo). `.gitignore` already correctly excludes `.env`/`.env.*` (verified) — good.

---

## M. Fly.io deployment

### F-26 — Fly config gaps: no health check, no VM sizing, scale-to-zero cold start
- **What:** `fly.toml` defines `http_service` with `auto_stop_machines`/`auto_start_machines` but no health check, no `[[vm]]` sizing, no `min_machines_running`, and no concurrency limits; single region `iad`.
- **Why it matters:** (1) no `[[http_service.checks]]` means Fly can't detect a wedged process and restart it (an `/api/health` endpoint exists but is unused by Fly). (2) Default VM is small (≈256 MB shared-cpu-1x) — tight for in-memory rooms under load and easy to OOM (see F-02/F-09). (3) `auto_stop` with no `min_machines_running` lets the machine scale to zero, adding a cold-start delay (and a WS connection failure) for the first player after idle.
- **Current state:** `backend/fly.toml`.
- **Severity:** Medium
- **Confidence:** Medium
- **Direction:** Add `[[http_service.checks]]` hitting `/api/health`; set an explicit `[[vm]]` memory (e.g., 512 MB) sized to expected rooms; set `min_machines_running = 1` for launch; add `[http_service.concurrency]` soft/hard limits. `force_https = true` already enforces TLS (so WSS is enforced at the edge) — good, keep it.

---

## N. Privacy & compliance (GDPR)

### F-27 — GDPR gaps: no erasure/export, no consent record, undefined IP retention
- **What:** The product stores account PII (email) and will serve Google Ads to EU users, but there is no account deletion/export path, no record of ad/cookie consent, and no defined IP-retention policy; meanwhile Prisma logs emails (F-18).
- **Why it matters:** Google Ads implies EU traffic and ad cookies, which trigger GDPR/ePrivacy: lawful basis + consent for ad cookies (a frontend consent banner — out of scope here, but the backend must support the data-subject rights behind it), the right to erasure and access for stored accounts, and data-minimization for any IPs we log (F-19). None of this exists yet.
- **Current state:** `prisma/schema.prisma` (`Player.email` stored; cascade deletes exist for score/match-player, so account deletion is technically feasible); no deletion/export endpoint in `src/routes/`; `src/lib/prisma.ts:12` logs PII.
- **Severity:** Medium
- **Confidence:** High
- **Direction (backend share):** add an authenticated account-deletion endpoint (and optionally data export) leveraging the existing cascade relations; stop logging PII (F-18); if IPs are logged for abuse detection (F-19), document purpose + short retention. Consent UI is a frontend item to coordinate, not build here.

---

## Cross-check against installed skills (find-bugs + security-review + WebSocket Engineer)

After the initial manual audit, the Sentry `find-bugs` and `security-review` skills and the `websocket-engineer` reference set were installed (committed to `main`, merged into this branch) and used to re-walk the findings. **Outcome: strong corroboration, no new Critical/High findings.**

- `websocket-engineer/references/security.md` independently prescribes every WS control flagged here — per-IP connection limiting, `maxPayload`/message-size caps, ping/pong + idle timeout, CORS/Origin allowlisting, and "query-string tokens are *less secure* — upgrade to a token" — matching **F-02, F-03, F-05, F-09, F-19, F-21, F-04**.
- The `security-review` skill's "Always Flag (Secrets)" rule confirms **F-01** as Critical; `api-security.md` confirms the JWT direction (pin `alg`, validate `iss`/`aud`, "API key in URL = logged/cached/visible") and the CORS wildcard finding; `modern-threats.md` confirms the CSWSH (**F-03**) and prototype-pollution positions.

Walking the `find-bugs` checklist also let me explicitly **clear** several items — recorded here so reviewers know they were considered, not missed:

| Checklist item | Result |
|---|---|
| Injection (SQL/command/template) | **Clean.** All DB access is parameterized via Prisma; no `eval`/`child_process`/template execution; no raw SQL anywhere. |
| Deserialization / SSRF | **Clean.** No `unserialize`/`pickle`-style sinks; no outbound requests built from user input. |
| Mass assignment | **Clean.** No user-supplied object is spread into Prisma; every repo writes explicit server-built fields; identity comes from the connection/token, never the payload. |
| Field-level authorization | **Clean.** Public `/players/:id` and `/leaderboard` expose only non-sensitive fields (no `email`/`password_hash`); `email` is returned only via authenticated `/me`. |
| CSRF | **N/A.** Auth is a bearer token (header/subprotocol), not a cookie, so cross-site request / CSWSH riding a session does not apply; Origin pinning (F-03) is still recommended. |
| Race conditions / TOCTOU | **Mitigated.** Node's single-threaded loop serializes each (synchronous) message handler; the async boundaries (identity resolution, post-`game_over` persistence) were reviewed and show no high-confidence TOCTOU. Match persistence is **idempotent** — the match row's primary key is the room UUID, so a duplicate write is rejected, not double-counted. |
| HTTP request size | **Bounded.** `express.json()` caps bodies at its 100 kb default; the unbounded-payload gap is WebSocket-only (F-02). |
| Numeric overflow | **Bounded.** Grid (3–20) and player (2–8) counts are validated; scoring deltas are server-set constants, not client values (F-11 adds coordinate bounds for completeness). |

The skills' reference patterns (connection-limiter, `maxPayload`, ping/pong, IP-keyed audit logging, server-side state machine, business-action rate limiting) are concrete remediation inputs for Phase 2.

## Constraint conflicts & "don't spend money / don't hurt players" notes

- **No paid infra needed for any P0.** Every High/Critical fix (F-01, F-02, F-05, F-08, F-09, F-13) is pure application code on the existing single machine. Do **not** buy Cloudflare Pro/WAF, paid monitoring, or Redis to close these.
- **Cloudflare:** free tier only, and only for what it actually helps (L3/4 + IP hiding + handshake throttling). Its paid WAF/rate-limiting does **not** meaningfully protect WebSocket *frames* (F-07) — paying for it would be wasted money for this workload.
- **Redis / multi-machine:** explicitly out of scope. In-memory rate limiting, caps, and reapers are the right call now; this audit flags exactly where they break at >1 machine (F-05, F-09) so the future migration is known, not surprising.
- **Player-experience trade-offs to *not* over-engineer:** heavy password complexity (F-17) and aggressive anti-Sybil (F-15) hurt a casual game's conversion for little real gain pre-revenue — keep them light. The reconnect grace window and silent-drop protocol behavior are good UX choices and should be preserved.

## Appendix A — `npm audit` (2026-05-20)

```
6 vulnerabilities (5 moderate, 1 high)
- ws            8.20.0           moderate  GHSA-58qx-3vcg-4xpx (uninitialized memory disclosure)  [DIRECT, prod path] → F-23
- fast-uri     <=3.1.1           high      path traversal / host confusion   [transitive via prisma dev tooling] → F-24
- hono         <=4.12.17         moderate  multiple                           [transitive via prisma dev tooling] → F-24
- @hono/node-server <1.19.13     moderate  middleware bypass                  [transitive via prisma dev tooling] → F-24
```
The `fast-uri`/`hono` chain comes from `prisma` (dev/CLI, e.g. Studio) and is not loaded by `node dist/index.js`, but it is shipped to the production image today (F-24). Only `ws` is on the live path.

## Appendix B — Methodology note

The task brief specified Sentry (`find-bugs`, `security-review`), Security-Phoenix (`/security-assessment`, `/threatmodel`), trailofbits, agamm OWASP, and WebSocket-Engineer skills for this phase. At audit time none were installed, so the primary pass used an equivalent manual methodology: full backend code read, OWASP-aligned review, a `ws`-specific hardening checklist, `npm audit`, and a STRIDE/DREAD threat model (`THREAT_MODEL.md`).

The **Sentry `find-bugs` + `security-review`** skills and the **WebSocket Engineer** reference set were subsequently installed (committed to `main`, merged into this branch) and used as a **cross-check pass** — see *Cross-check against installed skills* above. They corroborated the findings and surfaced no new Critical/High issues; their value was confirmation plus concrete remediation patterns for Phase 2. **Phoenix `/threatmodel`/`/security-assessment`, trailofbits, and agamm OWASP remain unavailable** — their absence does not materially weaken this audit (the STRIDE/DREAD model and OWASP coverage were done manually), but installing them later for an independent re-run is still worthwhile. Confidence ratings are provided per finding throughout, in place of the skills' automated scoring.
