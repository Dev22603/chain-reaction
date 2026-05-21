# T03 — WebSocket transport hardening (payload cap, heartbeat, idle timeout, connection caps, origin check)

**Priority:** P0 · **Effort:** M · **Findings:** F-02 (High), F-03 (Medium) · **Depends on:** T02

**Files:** `backend/src/realtime/websocket.ts`, `backend/src/constants/app.constants.ts`

> Read `backend/RULES.md`, `docs/plans/tasks/README.md`, and findings F-02/F-03 in the audit. Reference patterns: `.claude/skills/websocket-engineer/references/security.md`. Backend only.

## Context
`src/realtime/websocket.ts` creates `new WebSocketServer({ server })` and wires per-socket `message`/`close` handlers. There is no payload cap, no liveness check, no idle timeout, no connection limit, and no origin validation. The single Fly machine holds all game state in memory.

## Problem (F-02, F-03)
- `ws` defaults `maxPayload` to 100 MiB → memory-exhaustion via large frames.
- No ping/pong → dead (half-open) sockets accumulate forever.
- No idle timeout → idle-but-open sockets hold resources indefinitely.
- No per-IP/global connection cap → connection-exhaustion DoS.
- No `Origin` check → any website can open connections.

## Do this
1. **Payload cap:** `new WebSocketServer({ server, maxPayload: WS_MAX_PAYLOAD_BYTES, verifyClient })` with `WS_MAX_PAYLOAD_BYTES = 16 * 1024` (16 KB; the largest legit client frame is tiny).
2. **Origin + connection caps in `verifyClient`** (runs at upgrade, before connection):
   ```ts
   function verifyClient(info, done) {
     const { ALLOWED_ORIGINS } = config;
     const origin = info.origin;
     const originOk = ALLOWED_ORIGINS.length === 0 || (origin && ALLOWED_ORIGINS.includes(origin));
     if (!originOk) return done(false, 1008, "origin not allowed");
     const ip = getClientIp(info.req);
     if (totalConnections >= LIMITS.MAX_CONNECTIONS) return done(false, 1013, "server full");
     if ((perIp.get(ip) ?? 0) >= LIMITS.MAX_CONNECTIONS_PER_IP) return done(false, 1013, "too many connections");
     return done(true);
   }
   ```
   Maintain `perIp` counts and a total: increment on `connection`, decrement on `close` (clean up zero entries). Use `getClientIp` from T02.
3. **Heartbeat:** mark `isAlive = true` on connect and on `pong`; a `setInterval(WS_PING_INTERVAL_MS)` sweep pings each client and `terminate()`s any that didn't pong since the last sweep. `clearInterval` on `wss.close` (the graceful-shutdown wiring lands in T07 — leave a hook/comment).
4. **Idle timeout:** per-socket timer reset on each `message`; if it fires (`WS_IDLE_TIMEOUT_MS`, e.g. 10 min), `terminate()`. Clear it on `close`.
5. **Constants** in `app.constants.ts`: `WS_MAX_PAYLOAD_BYTES`, `WS_PING_INTERVAL_MS` (30_000), `WS_IDLE_TIMEOUT_MS`, `MAX_CONNECTIONS`, `MAX_CONNECTIONS_PER_IP`.

Preserve the existing reconnect-grace and rate-limit logic already in this file.

## Out of scope
Do not change the message-rate limiting counter semantics (that's T05). No protocol/wire changes. No frontend.

## Acceptance criteria
- Frames larger than the cap are rejected by `ws` (connection closes with 1009).
- Dead sockets are reaped within ~one ping interval; idle sockets are closed after the idle timeout.
- Connections beyond the global or per-IP cap are refused at upgrade.
- When `ALLOWED_ORIGINS` is set, connections from other origins are refused; when empty, all origins are allowed (per T02 contract).

## Verify
`cd backend && npm run build && npm run lint`. Manual: connect with `npx wscat`; confirm a normal game still works end-to-end (connect → join_queue → make_move). Confirm an oversized frame disconnects, and that opening more than `MAX_CONNECTIONS_PER_IP` sockets from one host is refused.

## Commit message
```
feat(ws): add payload cap, heartbeat, idle timeout, connection caps, and origin check
```
