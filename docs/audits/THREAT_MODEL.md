# Chain Reaction — Threat Model (STRIDE + DREAD)

- **Date:** 2026-05-20
- **Scope:** The abuse surface of an **unauthenticated, public, real-time multiplayer game**, plus the live account/ranked layer that already exists in the backend. Single Fly.io machine, free-tier services, in-memory game state, Postgres for finished-match persistence only.
- **Companion:** Findings (`F-xx`) are detailed in `PRODUCTION_HARDENING_AUDIT.md`. This document frames *why* they matter via attacker goals and prioritizes them with DREAD.
- **Method:** Manual STRIDE per element + DREAD scoring (the Phoenix `/threatmodel` skill named in the brief was unavailable; this is the equivalent manual model).

## 1. System overview & trust boundaries

```
                          ┌──────────── TRUST BOUNDARY: public internet ────────────┐
   Anonymous client  ───► │  Fly edge proxy (TLS terminate, force_https)             │
   (browser / bot)        │      │                                                   │
                          │      ▼   single Fly machine (iad), Node process          │
                          │  ┌─────────────────────────────────────────────────┐    │
                          │  │ Express (HTTP /api)   ws WebSocketServer           │    │
                          │  │   auth/leaderboard/    router → handlers           │    │
                          │  │   players              in-memory state Maps        │    │
                          │  └───────────────┬──────────────────┬────────────────┘    │
                          │                  │                  │                      │
                          └──────────────────┼──────────────────┼──────────────────────┘
                                             ▼                  ▼
                                   ┌──────────────────┐   in-memory: players,
                                   │ Postgres (Prisma)│   queues, rooms, playerRooms,
                                   │ accounts, scores │   connections, pendingReconnects,
                                   │ match history    │   roomCodes  (volatile, single node)
                                   └──────────────────┘
```

**Trust boundaries crossed:**
1. **Internet → app.** Every WS frame and HTTP body is attacker-controlled. Validated by Zod at the boundary; *not* rate/size/origin-limited adequately (F-02, F-03, F-05, F-06).
2. **Unauthenticated → authenticated.** A JWT in the WS URL or `Authorization` header elevates a connection to an account identity. Integrity of this boundary rests entirely on the JWT secret (F-01) and token handling (F-04).
3. **App → Postgres.** Parameterized via Prisma (no SQLi). The boundary leaks *outward* via query logging (F-18).
4. **App ↔ in-memory state.** The authority for live games. Volatile and unbounded — the primary DoS target (F-08, F-09).

## 2. Assets (what an attacker wants to harm)

| Asset | Why it matters here | Primary threats |
|-------|--------------------|-----------------|
| **Service availability** | Ads revenue ∝ players online; one machine = one failure domain | DoS (F-02, F-08, F-09, F-07, F-20) |
| **Leaderboard / ranked integrity** | The core "chess.com-for-Chain-Reaction" engagement loop | Farming/collusion (F-13, F-14, F-15) |
| **Account credentials & PII (email)** | GDPR exposure; user trust | Token forgery (F-01), enumeration (F-16), PII logging (F-18, F-27) |
| **Server resources (mem/CPU/FDs/DB)** | 256 MB shared VM + free Postgres are easily exhausted | Resource exhaustion (F-02, F-06, F-08, F-09) |

## 3. Threat actors

- **A1 — Anonymous flooder / script kiddie.** No account. Goal: take the game down or grief. Cheapest, most likely on a public launch. Needs only a WS client.
- **A2 — Competitive cheater.** Casual or authenticated player. Goal: top the leaderboard via farming/collusion. Highly motivated once a ladder exists.
- **A3 — Credential attacker.** Goal: take over accounts / enumerate users for stuffing or phishing.
- **A4 — Targeted DoS / competitor.** Goal: sustained outage during peak. Limited by single-machine economics on *our* side; aided by exposed origin IP (F-07).
- **A5 — Curious/abusive player.** Goal: impersonation, offensive names, queue griefing. Low skill, high nuisance.

## 4. Entry points (attack surface)

| # | Entry point | Auth | Notes |
|---|-------------|------|-------|
| E1 | WS `connect` (`?token=`) | optional | Identity resolution; no origin/conn cap (F-02, F-03) |
| E2 | WS messages: `join_queue`, `leave_queue`, `make_move`, `leave_game`, `create_room`, `join_room_by_code` | none/guest | Per-socket rate limit only (F-05); business logic gaps (F-13, F-14) |
| E3 | `POST /api/auth/signup`, `/login` | none | `authLimiter` present but mis-keyed (F-05); enumeration (F-16) |
| E4 | `GET /api/auth/me`, `/me/matches` | JWT | Token boundary (F-01, F-04) |
| E5 | `GET /api/leaderboard`, `/players/:id`, `/players/:id/matches` | none | No rate limit; DB load (F-06) |

## 5. STRIDE analysis

### Spoofing (identity)
- **JWT forgery via default secret** — if `JWT_SECRET` is the committed default, any identity is forgeable → full takeover. → **F-01 (Critical).**
- **Token theft via URL** — tokens in query strings leak through logs/proxies/history; 7-day TTL, no revocation. → **F-04.**
- **Guest/name spoofing** — unlimited guest UUIDs; names can mimic the `Guest …` convention or other players. → **F-12, F-15.**
- **Algorithm not pinned** in `jwt.verify` (latent). → **F-04.**

### Tampering (integrity)
- **Leaderboard farming** — solo private room → one move → "win" → score written; casual/solo games update ranked score (no mode gate). → **F-13 (High).**
- **Ranked pollution** — guests join ranked unchecked; guest wins skip persistence, corrupting authenticated players' recorded results. → **F-14.**
- **Move tampering** — mitigated: server is authoritative, `make_move` re-validates turn/bounds/ownership; client board is never trusted. (No finding — working as intended.)
- **SQL injection** — not present: all DB access is parameterized via Prisma. (Verified, no finding.)
- **Prototype pollution** — not reachable: Zod strips unknown keys before handlers. (Verified, see audit §E note.)

### Repudiation
- **Low relevance** for a casual game, but: no client IP is captured anywhere, so abuse cannot be attributed to a source for blocking or evidence. → **F-19.** Match history (`matches`/`match_players`) gives reasonable game-result auditability already.

### Information disclosure
- **PII in logs** — Prisma `query` logging emits emails to stdout/Fly logs in production. → **F-18, F-27.**
- **Account enumeration** — login timing oracle + signup `409`. → **F-16.**
- **`ws` uninitialized-memory advisory** — potential cross-frame memory disclosure on the live path. → **F-23.**
- **Error hygiene** — good: error middleware and the WS router return generic messages and never leak stack traces. (No finding.)

### Denial of service (the dominant category for this product)
- **Connection/payload flood** — no `maxPayload` (100 MiB default), no heartbeat (half-open buildup), no connection cap. → **F-02 (High).**
- **Abandoned-room leak** — `create_room` + disconnect leaks rooms/codes/mappings forever → OOM. → **F-08 (High).**
- **No room/queue/connection ceilings.** → **F-09 (High).**
- **Unauthenticated DB-load flood** on public read endpoints. → **F-06.**
- **L7 flood on a single exposed origin**; no edge absorption. → **F-07.**
- **Whole-process crash** from one unhandled rejection; no `SIGTERM` draining. → **F-20.**
- **Event-loop block** on pathological cascades (minor). → **F-10.**

### Elevation of privilege
- **Guest → authenticated** via forged token. → **F-01.**
- **Player → leaderboard authority** (writing ranked points without a legitimate ranked game). → **F-13, F-14.**
- No OS/container privilege separation — app runs as **root** in-container, maximizing post-exploit blast radius. → **F-24.**

## 6. DREAD prioritization

Scoring 1–10 per dimension (Damage, Reproducibility, Exploitability, Affected users, Discoverability); rating = mean. Sorted high→low.

| Threat (→ findings) | D | R | E | A | Di | Score | Band |
|---------------------|---|---|---|---|----|-------|------|
| T2 WS connection/payload flood → outage (F-02, F-09) | 7 | 9 | 9 | 10 | 8 | **8.6** | Critical |
| T3 Abandoned-room leak → OOM outage (F-08) | 7 | 9 | 9 | 10 | 5 | **8.0** | Critical |
| T6 Public-endpoint DB-load flood (F-06, F-07) | 6 | 9 | 9 | 9 | 7 | **8.0** | Critical |
| T1 Forged JWT via default secret (F-01) | 10 | 7 | 8 | 9 | 5 | **7.8** | Critical |
| T4 Leaderboard farming (F-13) | 6 | 10 | 9 | 7 | 7 | **7.8** | High |
| T5 Broken rate limit → stuffing / login DoS (F-05) | 6 | 8 | 7 | 8 | 6 | **7.0** | High |
| T10 Ranked pollution by guests (F-14) | 4 | 9 | 9 | 6 | 6 | **6.8** | High |
| T9 Process crash, no draining (F-20) | 7 | 4 | 4 | 10 | 3 | **5.6** | Medium |
| T8 Account enumeration (F-16) | 3 | 7 | 6 | 5 | 6 | **5.4** | Medium |
| T7 Token leakage via URL (F-04) | 7 | 5 | 4 | 4 | 5 | **5.0** | Medium |

**Reading:** the top three are all **availability** threats from unauthenticated clients — they are the most reproducible, most discoverable, and affect every player. T1 (forged JWT) scores slightly lower only because it's *conditional* on a deploy misconfiguration; its **damage is maximal**, so it remains a must-fix-before-launch (fail-closed boot check). T4 (farming) has the highest reproducibility of all and directly attacks the product's core asset.

> DREAD is subjective by design; these scores are a sequencing aid, not a metric. Where DREAD and the audit's severity disagree (e.g., F-01 Critical-severity but 7.8 DREAD), treat the higher of the two as the planning priority.

## 7. Abuse-surface deep dive (unauthenticated public game)

| Abuse | Feasibility today | Constrained by | Realistic free-tier countermeasure |
|-------|-------------------|----------------|-------------------------------------|
| **Sybil / multi-account** | Trivial — a fresh guest UUID per connection; accounts need only email+8-char pw, no verification | Nothing | Can't prevent identity; constrain *impact* via per-IP caps (F-09) + ranked gating (F-13/F-14). Email verification / Cloudflare Turnstile (free) only if abuse appears |
| **Room flooding** | Trivial — unlimited `create_room`, plus the F-08 leak | Nothing | Reap empty/abandoned rooms (F-08); `MAX_ROOMS` + per-IP room cap (F-09) |
| **Queue griefing** | Easy — rapid join/leave churn; unlimited queue entries | 60 msg/min per socket (bypassable, F-05) | Per-IP WS rate limit + `MAX_QUEUE_SIZE` (F-05, F-09) |
| **Name spoofing / impersonation** | Easy — no charset rules; can mimic `Guest …` or other players | Length cap only | Charset policy + reserve `Guest ` prefix (F-12) |
| **Collusion / win-trading** | Easy once ladder exists — two accounts throw ranked games | None | Restrict scoring to ranked w/ ≥2 authenticated players (F-13); defer same-IP/heuristic anti-collusion (flag) |
| **Invite-code brute force** | Hard — 32^6 ≈ 1.07e9 space, only active codes match | 6-char code + msg cap | Per-IP limit on `join_room_by_code` (F-05); already low risk |

## 8. Free-tier mitigation reality

- **In-app (where the real defense lives):** payload/connection caps, heartbeat, per-IP rate limiting keyed on `Fly-Client-IP`, room/queue ceilings, abandoned-room reaping, fail-closed secret check, graceful shutdown. All zero-cost, single-machine, no Redis.
- **Cloudflare free (worth adding):** L3/4 volumetric absorption, **origin IP hiding** (lock Fly to Cloudflare ranges so attackers can't bypass to the origin), free TLS, Bot Fight Mode, one coarse rate-limit rule on the HTTP handshake, free Turnstile if we ever need a challenge. **Does not** inspect or rate-limit WebSocket frames — so it complements, never replaces, the in-app work (F-07).
- **Fly free/low tier:** health checks + `min_machines_running=1` + a right-sized `[[vm]]` are the availability levers we *do* control (F-26). Autoscaling is **not** a DoS defense (and costs money / breaks the single-node in-memory model) — do not rely on it for that.
- **Explicitly not worth money now:** paid WAF, paid monitoring/SIEM, Redis, multi-region. Each is flagged in the audit where it would only become necessary at a scale we haven't reached.

## 9. Residual risk & acceptance

After the planned hardening, the following residual risks remain **accepted** for a free-tier, pre-revenue, ads-funded game (revisit when scale/revenue justifies spend):

- **Determined Sybil abuse** is reducible but not eliminable without accounts-for-all or paid anti-bot — accepted; impact bounded by caps + ranked gating.
- **Distributed L7 DoS** beyond what Cloudflare free + a single machine can absorb — accepted; mitigation is "raise cost to attacker," not "guarantee uptime." Documented escape hatch: enable Cloudflare challenge / scale Fly *reactively* during an incident.
- **In-memory rate limiting / caps are per-machine** — accepted while single-machine; the migration point to shared state (Redis or Fly-native) is explicitly flagged in F-05 and F-09.
- **Signup email enumeration** — accepted as a UX trade-off, throttled by rate limiting.
- **No token revocation** — accepted short-term; mitigated by shortening TTL and moving the token out of the URL (F-04).
