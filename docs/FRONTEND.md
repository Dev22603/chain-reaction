# FRONTEND.md

## When to read this

You're editing `frontend/`, adding a phase, a component, a hook, or changing how the UI reacts to a server message.

## File map

```
frontend/
├── src/
│   ├── app/
│   │   └── page.tsx              # phase router (client component)
│   ├── hooks/
│   │   └── useGameWebSocket.ts   # single source of WS + phase state
│   ├── components/
│   │   ├── Lobby.tsx             # name + preset + player count form
│   │   ├── QueueScreen.tsx       # "X / Y players", cancel button
│   │   ├── GameBoard.tsx         # grid of cells, click handling
│   │   └── GameOver.tsx          # winner + Play Again
│   └── lib/
│       ├── types.ts              # Cell, Board, Player, Phase, GameState, ClientMessage, ServerMessage
│       └── colors.ts             # PLAYER_COLORS[]
├── next.config.ts
└── package.json
```

`lib/types.ts` mirrors `backend/src/types/protocol.ts`. They must stay in sync (see `RULES.md` and `PROTOCOL.md`).

## Component tree

```
<Page>                             // app/page.tsx
  ├── phase === "lobby"    → <Lobby onSubmit={joinQueue} />
  ├── phase === "queued"   → <QueueScreen info={queuedInfo} onCancel={leaveQueue} />
  ├── phase === "playing"  → <GameBoard ... /> + "Leave Game" button
  └── phase === "gameover" → <GameOver winnerName={...} onPlayAgain={reset} />
```

`page.tsx` owns nothing itself. It's a pure switch over `phase` from the hook.

## State ownership

**All WebSocket state lives in `useGameWebSocket`.** Components receive values and callbacks as props. They don't open their own sockets, parse their own messages, or keep their own copies of server state.

Hook-owned state:

| State          | Type                                              | Set by                          |
|----------------|---------------------------------------------------|---------------------------------|
| `phase`        | `"lobby" \| "queued" \| "playing" \| "gameover"`  | server messages + local actions |
| `playerId`     | `string \| null`                                  | `connected`                     |
| `gameState`    | `GameState \| null`                               | `game_start`, `game_state`      |
| `queuedInfo`   | `{ position, maxPlayers } \| null`                | `queued`                        |
| `winner`       | `Player \| null`                                  | `game_over`                     |

Hook-exposed actions:

- `joinQueue({ gridRows, gridCols, maxPlayers, playerName })`
- `leaveQueue()`
- `makeMove(row, col)`
- `leaveGame()`
- `reset()`: local only, returns to `lobby` and clears `gameState` / `winner`

## Rendering contract

- **`GameBoard` renders whatever `board` it's given.** No local mutations, no optimistic updates.
- **A cell is clickable only if** `currentTurn === myIndex` AND (`cell.owner === null` OR `cell.owner === myIndex`). Every other cell is `disabled`.
- **Color comes from `PLAYER_COLORS[cell.owner]`.** Empty cells are transparent.
- **`myIndex` is computed once per render:** `gameState.players.findIndex(p => p.id === playerId)`. See `GLOSSARY.md`.

## Where to add things

### New phase

1. Extend the `Phase` union in `src/lib/types.ts`.
2. Add a new component in `src/components/` following the existing props pattern (data down, callbacks up).
3. Add a `case` to the switch in `page.tsx`.
4. In `useGameWebSocket`, decide what server message (or local action) transitions into and out of this phase, then update the `onmessage` switch and action functions.

### New server-to-client message

1. Update `PROTOCOL.md`, `backend/src/types/protocol.ts`, AND `frontend/src/lib/types.ts` together.
2. Add a `case` in `useGameWebSocket`'s `onmessage` that updates state.
3. If the UI needs a new prop on an existing component, thread it through from `page.tsx`.

### New client-to-server message

1. Document it in `PROTOCOL.md` and add to both protocol type files.
2. Add a new action function on the hook: `sendJSON({ type: '...', ... })`.
3. Export it from the hook's return object.
4. Wire a UI element to call it.

## Common gotchas

- **Board renders stale.** If you mutate `board` in place (e.g. `board[r][c].count++`) React won't notice. Always replace `gameState` with a new object: `setGameState(g => g && { ...g, board: msg.board, currentTurn: msg.currentTurn, players: msg.players })`.
- **`playerId` is `null` on the first render.** Don't assume it's populated in components; the hook fills it after the first `connected` frame.
- **WebSocket URL hardcoded.** `ws://localhost:8080` is fine for dev. Before Fly deploy, read from `NEXT_PUBLIC_WS_URL` with a fallback.
- **Tab throttling.** Two tabs in the same browser window share a throttled event loop. For multi-player manual testing, use separate windows.

## Run

```bash
cd frontend
npm install
npm run dev
# http://localhost:3000
```

## Testing

No formal framework yet. Use `docs/TODO.md` for the current manual flow checklist until the testing milestone adds automated coverage.
