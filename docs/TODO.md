# Chain Reaction — Consolidated TODO

Status legend: `[x]` done · `[~]` in progress · `[ ]` not started.

This file is the single source of truth for what's left to ship. Historical
per-milestone checklists live in `backend/TODO.md` (M0–M7 buildout).

## Frontend — UX & Navigation Bugs

- [x] Extract `TopBar` into `frontend/src/components/TopBar.tsx` and render from `app/layout.tsx`.
- [x] Remove per-page mini-headers from `/leaderboard` and `/players/[id]`.
- [x] Add "Cancel / back to home" link inside `AuthPanel.tsx` footer.
- [x] Add themed `frontend/src/app/not-found.tsx`.
- [x] Themed "player not found" card on `/players/[id]` with home + leaderboard links.
- [x] Hide `CREATE` and `JOIN` buttons in `LandingHub.tsx` until private-room backend ships.
- [x] Remove dead `onCreate` / `onJoin` flash-notice code in `app/page.tsx`.
- [x] Add ranked/casual selector in `LandingHub.tsx`; lock ranked for guests with inline prompt.
- [x] Read `auth.loading` in `TopBar` and render skeleton chip while loading.
- [x] Soft-confirm logout via `window.confirm`; replace `window.location.reload()` with `router.refresh()`.
- [x] Add `connectionState` to `useGameWebSocket`; disable `PLAY` and show banner when not `open`.
- [x] Clear `noticeTimeout` on unmount in `app/page.tsx`.
- [x] Delete dead `frontend/src/components/Lobby.tsx`.
- [x] Add "Leaderboard" link to `GameOver.tsx` next to "New Round".
- [x] `QueueScreen.tsx`: drive headline copy from `info?.mode`.
- [x] "My Profile" wired via user chip → `/players/<id>`; "My Matches" deferred until a dedicated matches route exists (profile page already surfaces match history).
- [ ] Run `/web-design-guidelines` against every file changed and apply findings.

## Backend — Remaining Features

- [x] Reconnection grace period (30s) on WS close while in a room.
- [x] Include `scoreDelta` per player in the `game_over` payload.
- [ ] Typed `auth_token_expired` error code; frontend handler to clear token + reconnect as guest.
- [x] `express-rate-limit` on `/api/auth/*`.
- [ ] Per-socket message rate cap in the WS router.
- [ ] Private-room schema (`rooms` table with `code`, `host_id`, `mode`, `max_players`, `expires_at`).
- [ ] Protocol additions: `create_room`, `join_room_by_code`, `room_created`.
- [ ] Re-enable `CREATE` / `JOIN` on the landing hub once private rooms land.
- [ ] Spectator support: read-only socket joins, `game_state` on join, no `make_move`.
- [x] Emit typed `error` frame after `game_over` when persistence fails.
- [x] Score recomputation script (`backend/scripts/recompute-scores.ts`).
- [ ] Auth service + scoring repo + queue handler tests (Vitest).
- [ ] Frontend `AuthPanel`, `LandingHub`, `QueueScreen`, `useGameWebSocket` tests.
- [ ] GitHub Actions CI (install → generate → build/lint/test for both workspaces).
- [ ] Dockerfile or Fly.io config for deploy.
- [ ] Elo / proper rating model (deferred until simple scoring is stable).
