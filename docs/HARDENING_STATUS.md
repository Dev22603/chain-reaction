# Chain Reaction — Hardening & Roadmap Status

This document tracks the production readiness of the Chain Reaction backend. The initial security audit and hardening plan (May 2026) have been consolidated here.

## Completed Hardening (Pre-Launch)

The following P0/P1 tasks are implemented and verified in the codebase.

### Core Security & Stability
- **T01: Fail-closed Configuration** — App refuses to boot in production if `JWT_SECRET` is missing, weak, or set to default.
- **T02: Edge Foundation** — Correctly identifies client IPs behind Fly.io proxy; enabled `trust proxy`.
- **T03: WebSocket Hardening** — Implemented `maxPayload` limits, heartbeat (ping/pong) liveness checks, idle timeouts, and connection caps.
- **T04: Resource Lifecycle** — Added room reaper to prevent memory leaks from abandoned/idle rooms. Global and per-IP room caps enforced.
- **T05: Rate Limiting** — Global and per-IP rate limiting on both HTTP (Express) and WebSocket message velocity.
- **T08: HTTP Edge Hygiene** — Integrated `helmet` for security headers and configured CORS with allowlist support.

### Game Integrity
- **T06: Game & Leaderboard Integrity** — XP only persists for authenticated players, with an anti-farm velocity cap. Implemented room state machine (`lobby` -> `active` -> `finished`) to prevent scoring exploits.
- **T09: Auth Hygiene** — Fixed login timing attacks (dummy hashes for missing users), implemented JWT hardening (HS256 pinning), and added password length limits.

### Observability
- **T07: Process Resilience** — Added graceful shutdown handlers (SIGTERM/SIGINT) and structured security event logging for abuse detection.

---

## Remaining Roadmap (Post-Launch)

These are P1/P2 items that are beneficial for long-term maintenance and compliance but are not "launch blockers."

### [P1] T10: Dependencies & Container
- [ ] **Bump `ws`**: Ensure `ws` library is on the latest patched version (beyond recent advisories).
- [ ] **Non-Root Docker**: Update `Dockerfile` to use a slim image and run as a non-privileged user (`node`).
- [ ] **CI Audit**: Add `npm audit` and secret scanning to GitHub Actions.

### [P1] T11: Input & Abuse Polish
- [ ] **Schema Bounds**: Add strict Zod bounds for grid coordinates as defense-in-depth.
- [ ] **Name Policy**: Restrict character sets for player names and reserve the `Guest ` prefix.

### [P2] T12: Privacy & GDPR
- [ ] **Account Deletion**: Add `DELETE /api/me` endpoint to allow users to wipe their data/scores.
- [ ] **IP Policy**: Document and automate IP truncation/retention periods.

### [P2] T13: Ops & Infrastructure
- [ ] **Health Checks**: Add `fly.toml` HTTP health checks for automated recovery.
- [ ] **Cloudflare**: (Manual) Configure Cloudflare in front of Fly.io for volumetric DDoS protection.
- [ ] **Scaling**: Revisit in-memory state if moving beyond a single Fly machine.

---

## Archive Note
The following legacy files were replaced by this document:
- `docs/audits/PRODUCTION_HARDENING_AUDIT.md`
- `docs/audits/THREAT_MODEL.md`
- `docs/plans/PRODUCTION_HARDENING_PLAN.md`
- `docs/plans/tasks/*.md`
