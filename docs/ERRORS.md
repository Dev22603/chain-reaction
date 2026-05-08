# ERRORS.md

## When to read this

You're handling a failure case in a handler, deciding whether to send something back to the client, or adding a new error condition.

## Why this file exists

WebSockets have no HTTP status codes. The protocol needs its own error contract so the frontend knows what went wrong without parsing prose. This file defines the `error` frame, the codes it can carry, and the rules for when to send one vs silently drop.

## The `error` frame

```json
{
  "type": "error",
  "code": "validation_failed",
  "message": "gridRows must be between 3 and 20",
  "errors": ["gridRows must be between 3 and 20", "playerName is required"]
}
```

- `code`: machine-readable string from the table below.
- `message`: human-readable, safe to display.
- `errors`: optional array. Used for multi-issue validation failures (Zod issue list).
- An `error` frame is **per-socket**, not broadcast. Only the offending client receives it.

## When to send `error` vs silently drop

The default is **drop silently**. We send `error` only when the client genuinely needs feedback.

### Send `error`:

- **Validation failure on a user-initiated action.** The user typed something invalid (lobby form, etc.). They need to know.
- **Authorization failure.** The user tried something they're not allowed to do, such as joining ranked queue as a guest.
- **Internal error** during a user-initiated action. Generic `internal_error` so the UI can show "something went wrong".

### Drop silently (no `error` frame):

- **Wrong turn / bad coordinates / cell owned by another player on `make_move`.** The UI already disables those cells; if the server still receives the click it's either a race or tampering. Don't waste a roundtrip.
- **Unknown message types.** Could be a future protocol version or a malicious client.
- **Malformed JSON.** Already wrapped in try/catch in the router.
- **`leave_queue` when not queued, `leave_game` when not in a game.** Idempotent no-ops.

## Error codes

| Code                  | When                                                                         | Notes                                       |
|-----------------------|------------------------------------------------------------------------------|---------------------------------------------|
| `validation_failed`   | Zod schema rejected the payload                                              | Populate `errors` with issue messages       |
| `not_authenticated`   | No token / expired / guest tried ranked                                      | Frontend should prompt login                |
| `not_authorized`      | Token is fine but action is forbidden                                        |                                             |
| `player_not_found`    | Requested player profile does not exist                                      | Show a not-found state                      |
| `room_not_found`      | Player references a room that no longer exists                               | Usually a race after `game_over`            |
| `not_in_game`         | `make_move` or `leave_game` when player has no `playerRooms` entry           | Send only if the client clearly thinks it's playing |
| `not_your_turn`       | Reserved; usually we drop silently                                           | Send if a future feature needs explicit feedback |
| `internal_error`      | Anything thrown that wasn't an `ApiError`                                    | Log full error server-side; never leak details |

Codes are defined in `backend/src/constants/app.constants.ts` as `ERROR_CODES`.

## Server-side handling pattern

```ts
// router.ts (sketch)
import { ApiError } from "./utils/api_error";
import { send } from "./utils/broadcast";
import { getLogger } from "./lib/logger";

const logger = getLogger("router");

export function dispatch(socket: WebSocket, playerId: string, raw: string) {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return; }   // drop malformed

  try {
    const validated = validateMessage(parsed);          // throws ApiError("validation_failed", ...)
    routeByType(playerId, validated);
  } catch (err) {
    if (err instanceof ApiError) {
      send(socket, {
        type: "error",
        code: err.code,
        message: err.message,
        ...(err.errors.length ? { errors: err.errors } : {}),
      });
      return;
    }
    logger.error("unhandled error in dispatch", { error: (err as Error).message });
    send(socket, { type: "error", code: "internal_error", message: "Something went wrong." });
  }
}
```

Handlers throw `ApiError` for known failures; the router translates to a frame. Unknown errors become `internal_error` and are logged.

## Frontend handling pattern

```ts
// useGameWebSocket.ts onmessage:
case "error": {
  // user-visible toast or inline message; do not change phase based on errors alone
  setLastError({ code: msg.code, message: msg.message });
  break;
}
```

- Don't transition phase based on errors. The server's separate `game_over` / `queued` frames drive phase. Errors are advisory.
- Display the `message` to the user. Use `code` for special-case handling (e.g. redirect on `not_authenticated`).
- Clear `lastError` on the next successful state transition.

## Adding a new error code

1. Add it to `ERROR_CODES` in `backend/src/constants/app.constants.ts`.
2. Add a row to the table above with when it's sent.
3. If it's user-visible in a special way (e.g. triggers a redirect), document the frontend handling here too.
4. Update `frontend/src/lib/types.ts` if you've narrowed the `code` union.

## Things to avoid

- **Don't throw raw `Error`** from handlers. Wrap as `ApiError` so the code path is consistent.
- **Don't echo internal stack traces** in the `message` field. The router sends a generic `internal_error` for these.
- **Don't broadcast errors.** They're always per-socket. If a whole room is affected, end the game with `game_over` instead.
- **Don't use the `error` frame for game outcomes.** Losing or being eliminated is `game_state` / `game_over` flow, not an error.
