# Frontend Experience

What the user sees and does. Code-level rules (component-tree shape, hook state ownership, rendering contract) live in [../backend/RULES.md](../backend/RULES.md).

The user moves through four phases:

```
              joinQueue                  game_start
   ┌─────────┐ ───────▶ ┌────────┐ ────────────▶ ┌─────────┐
   │  lobby  │          │ queued │               │ playing │
   └─────────┘ ◀─────── └────────┘               └─────────┘
        ▲     leaveQueue                               │
        │                                              │ game_over
        │ reset / "Play Again"                         ▼
        │                                        ┌──────────┐
        └────────────────────────────────────────│ gameover │
                                                 └──────────┘
```

## Phases

### Lobby

The default. The player picks how many players, then chooses one of three entry points:

- **PLAY** — joins a public matchmaking queue. When enough players queue with the same settings, a room is created automatically.
- **CREATE** — opens a private room and receives a 6-char alphanumeric invite code. Share the code with friends to play together.
- **JOIN** — enters a 6-char code to join a specific private room.

Defaults: 6×9 grid, 2 players. The WebSocket connection must be open before any action is available.

### Queued

Shows the player's current position in the bucket and the bucket's max size. A "Cancel" button returns to lobby.

### Playing

Shows the board, the current-player indicator, the player list with elimination state, and a "Leave Game" button.

- A cell is clickable only if it's the user's turn AND the cell is empty or already owned by the user.
- Every other cell is disabled.
- Cell color comes from `PLAYER_COLORS[cell.owner]`. Empty cells are transparent.
- The board renders whatever the server broadcasts. No optimistic updates.

### Gameover

Shows the winner's name, a "Play Again" button, and a "Leaderboard" link. For authenticated players, shows their XP earned this match (+3 for winner, +1 for others). Guests see the result but no XP. "Play Again" resets local state and returns to the lobby. The WebSocket connection stays open across the reset.

## Errors

The server may send an `error` frame at any time (see [PROTOCOL.md](./PROTOCOL.md)). The UI surfaces the message to the user but does **not** change phase based on errors alone — phase transitions come from `queued`, `game_start`, `game_state`, `game_over`. The error clears on the next successful state transition.

## Multi-window manual testing

For local manual multiplayer, use separate **browser windows** rather than tabs. Tabs in the same window share a throttled event loop, which can make turn-taking misleading.
