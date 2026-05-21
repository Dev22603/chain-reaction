# T13 — Fly config + Cloudflare edge (health check, VM sizing; document Cloudflare)

**Priority:** P2 · **Effort:** S (code) + your dashboard actions · **Findings:** F-26 (Medium), F-07 (Medium) · **Depends on:** none

**Files:** `backend/fly.toml`, a short note in `docs/` (deployment/ops)

> Read `docs/plans/tasks/README.md` and findings F-26/F-07. This task is mostly config + a checklist for the human operator. Coordinate with T10 if it set `[experimental] init`.

## Context
`fly.toml` has `http_service` with `force_https`, `auto_stop_machines`, `auto_start_machines`, but **no** health check, no VM sizing, no `min_machines_running`, and no concurrency limits. Single region `iad`. There is no edge/CDN; the origin is reachable directly.

## Problem
- **F-26:** Fly can't detect a wedged process (no health check) even though `/api/health` exists; the default VM (~256 MB) is tight for in-memory rooms and can OOM; `auto_stop` with no `min_machines_running` lets it scale to zero → cold-start failures for the first player.
- **F-07:** no edge DDoS protection; origin IP is exposed; a single machine absorbs any L7 flood directly.

## Do this (code)
1. **Health check (F-26):** add an HTTP check hitting `/api/health`:
   ```toml
   [[http_service.checks]]
     interval = "15s"
     timeout = "2s"
     method = "GET"
     path = "/api/health"
   ```
2. **VM sizing + min machine (F-26):**
   ```toml
   [[vm]]
     memory = "512mb"
     cpu_kind = "shared"
     cpus = 1
   # under [http_service]:
   min_machines_running = 1
   ```
   Optionally add `[http_service.concurrency]` soft/hard limits sized to expected load. If T10 chose the Fly init route, add `[experimental]\n  init = true` here.
3. **Docs:** add a short ops note in `docs/` covering health check, sizing rationale, and the Cloudflare checklist below.

## Do this (your dashboard action — no code, F-07)
Add the domain to **Cloudflare (free plan)**, proxy DNS at Fly, and **lock Fly to accept only Cloudflare** (so attackers can't bypass to the origin IP). Enable Bot Fight Mode and a single handshake rate-limit rule. **Do not buy Pro/WAF** — Cloudflare free does **not** inspect WebSocket frames (that's what T03/T05 cover), so paid WS protection isn't cost-justified here. A step-by-step belongs in the ops note.

## Out of scope
No app-code changes. No paid services.

## Acceptance criteria
- `fly.toml` defines a working `/api/health` check, explicit VM memory, and `min_machines_running = 1`.
- The deployment stays warm (no scale-to-zero) and Fly restarts the machine if the health check fails.
- An ops note documents the Cloudflare-free setup and its WebSocket limitation.

## Verify
`fly deploy` (operator), then confirm the health check is green in the Fly dashboard and the app is reachable; confirm a normal game works through the (optional) Cloudflare proxy.

## Commit message
```
chore(fly): add health check and VM sizing; document Cloudflare edge
```
