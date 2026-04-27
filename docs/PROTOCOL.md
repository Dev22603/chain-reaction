# PROTOCOL.md

## When to read this

You're adding, renaming, or changing any WebSocket message in either direction. You must update this file in the same commit as `backend/src/types/protocol.ts` and `frontend/src/lib/types.ts` (RULES.md: "no silent protocol changes").

## Single source of truth

Three files describe the protocol; they must agree:

- **This file:** human-readable spec, examples, constraints.
- **`backend/src/types/protocol.ts`:** TS unions for `ClientMessage` and `ServerMessage`.
- **`frontend/src/lib/types.ts`:** mirrored TS unions on the client side.

If they drift, this file wins as the spec, but commit a fix to whichever is wrong.

## Transport

- WebSocket. Plain `ws://` locally, `wss://` in production.
- Every frame is JSON, one object per frame.
- Every frame has a `type` field; the rest of the object is type-specific.
- Malformed frames are dropped silently on the server (wrapped in try/catch).
- All message-type strings are snake_case. All field names are snake_case (see `CONVENTIONS.md` on wire format).

## Client to server

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
- `playerName`: non-empty string, trimmed.
- Server responds with `queued`, then eventually `game_start` when the bucket fills.

### `leave_queue`

```json
{ "type": "leave_queue" }
```

- Removes the player from whichever queue bucket they're in. No-op if not queued.

### `make_move`

```json
{ "type": "make_move", "row": 3, "col": 4 }
```

- Valid only during a game and only on the player's turn.
- Server ignores silently if: wrong turn, out of bounds, or cell owned by another player. (See `ERRORS.md` for when an `error` frame is sent vs silent drop.)
- On success, server broadcasts `game_state` to the whole room.

### `leave_game`

```json
{ "type": "leave_game" }
```

- Forfeits the current game. Player is marked eliminated, turn advances, win check reruns.
- Same effect as disconnecting mid-game.

## Server to client

### `connected`

```json
{ "type": "connected", "playerId": "b3c1..." }
```

- Sent once, immediately on connection. The client stores `playerId` for the session.

### `queued`

```json
{ "type": "queued", "position": 2, "maxPlayers": 2 }
```

- Acknowledgement of `join_queue`. `position` is 1-indexed within the bucket.

### `game_start`

```json
{
  "type": "game_start",
  "roomId": "a1b2...",
  "players": [
    { "id": "b3c1...", "name": "Alice", "eliminated": false },
    { "id": "d4e5...", "name": "Bob",   "eliminated": false }
  ],
  "gridRows": 6,
  "gridCols": 9
}
```

- Sent to every player in the room. The `players` array order defines player index (`0`, `1`, ...) which determines color and turn order.

### `game_state`

```json
{
  "type": "game_state",
  "board": [[{ "owner": 0, "count": 1 }, {"owner": null, "count": 0}]],
  "currentTurn": 1,
  "players": [
    { "id": "b3c1...", "name": "Alice", "eliminated": false },
    { "id": "d4e5...", "name": "Bob",   "eliminated": false }
  ]
}
```

- Broadcast after every accepted `make_move` or `leave_game` that doesn't end the match.
- `currentTurn` is already advanced past eliminated players.
- `board[row][col].owner` is `null` for empty cells, otherwise a player index.

### `game_over`

```json
{
  "type": "game_over",
  "winner": { "id": "b3c1...", "name": "Alice" }
}
```

- Sent once. Room is deleted immediately after broadcast; no more frames arrive for that `roomId`.

### `error`

```json
{ "type": "error", "code": "validation_failed", "message": "gridRows must be between 3 and 20" }
```

- Sent when a request explicitly fails in a way the user should see (bad input, unauthorized action). See `ERRORS.md` for codes and rules on when this is sent vs silently dropped.

## Adding a new message type

1. Append it to this file with a JSON example and field constraints.
2. Add a Zod schema in `backend/src/schemas/messages.schemas.ts`.
3. Add the type to the union in `backend/src/types/protocol.ts` and `frontend/src/lib/types.ts`.
4. Add a `case` to the dispatch in `backend/src/router.ts` delegating to a handler.
5. Add handling to `useGameWebSocket.onmessage` on the frontend if it's server-to-client.
6. Update `BACKEND.md` or `FRONTEND.md` if the state shape changes.
7. Commit everything together: `feat(protocol): add <message_type>`.

## Versioning

Not versioned during M1 to M7. If a breaking change is needed post-M7, bump a `protocolVersion` field on `connected` and gate behavior on it. Don't stealth-break.
