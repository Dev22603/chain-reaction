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

The default. The player picks a name, grid size, and max players, then joins a queue.

- Defaults: 6×9, 2 players.
- Submit is disabled for an empty/invalid name.
- Grid size is validated against the same bounds the server enforces (3–20).

### Queued

Shows the player's current position in the bucket and the bucket's max size. A "Cancel" button returns to lobby.

### Playing

Shows the board, the current-player indicator, the player list with elimination state, and a "Leave Game" button.

- A cell is clickable only if it's the user's turn AND the cell is empty or already owned by the user.
- Every other cell is disabled.
- Cell color comes from `PLAYER_COLORS[cell.owner]`. Empty cells are transparent.
- The board renders whatever the server broadcasts. No optimistic updates.

### Gameover

Shows the winner's name and a "Play Again" button. "Play Again" resets local state and returns to the lobby. The WebSocket connection stays open across the reset.

## Errors

The server may send an `error` frame at any time (see [PROTOCOL.md](./PROTOCOL.md)). The UI surfaces the message to the user but does **not** change phase based on errors alone — phase transitions come from `queued`, `game_start`, `game_state`, `game_over`. The error clears on the next successful state transition.

## Multi-window manual testing

For local manual multiplayer, use separate **browser windows** rather than tabs. Tabs in the same window share a throttled event loop, which can make turn-taking misleading.
