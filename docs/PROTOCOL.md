# Protocol

The WebSocket message contract between client and server.

> When you add or rename any frame, update this file, `backend/src/types/protocol.ts`, and `frontend/src/lib/types.ts` in the same commit. See [../backend/RULES.md](../backend/RULES.md).

## Transport

- WebSocket. `ws://` locally, `wss://` in production.
- Every frame is a single JSON object.
- Every frame has a `type` field; the rest is type-specific.
- Malformed frames are dropped silently on the server.
- All new field names are `snake_case` to align with the database. Existing camelCase fields (`gridRows`, `playerName`) remain as-is.

## Client → server

### `join_queue`

```json
{
  "type": "join_queue",
  "gridRows": 6,
  "gridCols": 9,
  "maxPlayers": 2,
  "playerName": "Alice"
}
```

- `gridRows`, `gridCols`: integers 3 to 20.
- `maxPlayers`: integer 2 to 4.
- `playerName`: non-empty string, trimmed server-side.
- Server responds with `queued`, then `game_start` once the bucket fills.

### `leave_queue`

```json
{ "type": "leave_queue" }
```

Removes the player from their current bucket. No-op if not queued.

### `make_move`

```json
{ "type": "make_move", "row": 3, "col": 4 }
```

- Valid only during a game and only on the player's turn.
- Server ignores silently if: wrong turn, out of bounds, or cell owned by another player.
- On success, server broadcasts `game_state` to the whole room.

### `leave_game`

```json
{ "type": "leave_game" }
```

Forfeits the current game. Player is marked eliminated, turn advances, win check reruns. Same effect as disconnecting mid-game.

## Server → client

### `connected`

```json
{ "type": "connected", "playerId": "b3c1..." }
```

Sent once on connection. Client stores `playerId` for the session.

### `queued`

```json
{ "type": "queued", "position": 2, "maxPlayers": 2 }
```

Acknowledgement of `join_queue`. `position` is 1-indexed within the bucket.

### `game_start`

```json
{
  "type": "game_start",
  "roomId": "a1b2...",
  "players": [
    { "id": "b3c1...", "name": "Alice", "eliminated": false, "eliminatedTurn": null },
    { "id": "d4e5...", "name": "Bob",   "eliminated": false, "eliminatedTurn": null }
  ],
  "gridRows": 6,
  "gridCols": 9
}
```

The `players` array order defines player index (0, 1, ...), which determines color and turn order.

### `game_state`

```json
{
  "type": "game_state",
  "board": [[{ "owner": 0, "count": 1 }, { "owner": null, "count": 0 }]],
  "currentTurn": 1,
  "players": [
    { "id": "b3c1...", "name": "Alice", "eliminated": false, "eliminatedTurn": null },
    { "id": "d4e5...", "name": "Bob",   "eliminated": false, "eliminatedTurn": null }
  ]
}
```

- Broadcast after every accepted `make_move` or `leave_game` that doesn't end the match.
- `currentTurn` is already advanced past eliminated players.
- `board[row][col].owner` is `null` for empty cells, otherwise a player index.
- `players[].eliminatedTurn` is the server turn count when that player was eliminated, or `null` for active players and the winner.

### `game_over`

```json
{
  "type": "game_over",
  "winner": { "id": "b3c1...", "name": "Alice" }
}
```

Sent once. Room is deleted immediately after broadcast; no more frames arrive for that `roomId`.

### `error`

```json
{
  "type": "error",
  "code": "validation_failed",
  "message": "gridRows must be between 3 and 20",
  "errors": ["gridRows must be between 3 and 20"]
}
```

- `code`: machine-readable string from the table below.
- `message`: human-readable, safe to display.
- `errors`: optional array. Used for multi-issue validation failures (Zod issue list).
- An `error` frame is **per-socket**, never broadcast. Only the offending client receives it.

## Error codes

| Code | When | Notes |
|------|------|-------|
| `validation_failed` | Zod schema rejected the payload | Populate `errors` with issue messages |
| `not_authenticated` | (post-M7) No token / expired | Frontend should redirect to login |
| `not_authorized` | (post-M7) Token fine but action is forbidden | |
| `room_not_found` | Player references a room that no longer exists | Usually a race after `game_over` |
| `not_in_game` | `make_move` or `leave_game` when the player has no `playerRooms` entry | Send only if the client clearly thinks it's playing |
| `not_your_turn` | Reserved; we usually drop silently | Send only if a future feature needs explicit feedback |
| `internal_error` | Anything thrown that wasn't an `ApiError` | Log full error server-side; never leak details |

Codes are defined in `backend/src/constants/app.constants.ts` as `ERROR_CODES`.

## Send `error` vs silently drop

The default is **drop silently**. Send `error` only when the client genuinely needs feedback.

### Send `error`

- Validation failure on a user-initiated action (lobby form). The user typed something invalid.
- Authorization failure (post-M7).
- Internal error during a user-initiated action. Generic `internal_error` so the UI can show "something went wrong".

### Drop silently

- Wrong turn / bad coordinates / cell owned by another player on `make_move`. The UI already disables those cells; if the server still receives the click it's either a race or tampering.
- Unknown message types. Could be a future protocol version or a malicious client.
- Malformed JSON. Already wrapped in try/catch in the router.
- `leave_queue` when not queued, `leave_game` when not in a game. Idempotent no-ops.

## Frontend handling

```ts
case "error": {
  setLastError({ code: msg.code, message: msg.message });
  break;
}
```

- Don't transition phase based on errors. Phase comes from `queued` / `game_start` / `game_state` / `game_over`.
- Display `message` to the user. Use `code` for special-case handling.
- Clear `lastError` on the next successful state transition.

## Versioning

Not versioned in M1–M7. If a breaking change is needed post-M7, bump a `protocolVersion` field on `connected` and gate behavior on it. Don't stealth-break.
