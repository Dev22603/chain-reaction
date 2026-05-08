# GLOSSARY.md

## When to read this

You're unsure what a term means in this codebase, or about to introduce a synonym for a concept that already has a name. Use the existing word.

These are the canonical names for things. If a doc, comment, or commit message uses a different term, fix it.

## Game terms

**Cell.** One square on the board. Has `{ owner: number | null, count: number }`.

**Board.** 2D array of cells, dimensions `gridRows × gridCols`.

**Orb.** A unit inside a cell. `cell.count` is the number of orbs.

**Owner.** The player index who placed the orbs in a cell. `null` for empty cells. Note: ownership transfers on explosion, even if the cell already had another owner's orbs.

**Critical mass.** The number of orthogonal neighbors a cell has. `2` for corners, `3` for edges, `4` for interior. A cell explodes when its `count >= criticalMass`.

**Explosion.** When a cell hits critical mass: subtract critical mass from its count, distribute one orb to each neighbor, transfer ownership to the exploding player.

**Cascade / chain reaction.** Sequential explosions triggered by a single move. Modeled as a loop in `applyMove` until the board is stable.

**Stable.** No cell has `count >= criticalMass`. The end state of a cascade.

**Safety break.** The 2000-iteration cap on the cascade loop. A correct implementation never hits it; we log if it does.

**Eliminated.** A player who owns zero cells. Recorded as `player.eliminated = true`.

**Grace period.** The first round of moves, during which elimination is not checked. Implemented as `if (room.turnCount >= room.players.length)` before running `isEliminated`. Without this, every player is "eliminated" before their first move on an empty board.

**Move.** A single click. The server runs `applyMove`, increments `turnCount`, and broadcasts `game_state`.

**Turn.** Whose move it is. Tracked as `room.currentTurn`, an index into `room.players`. Advances forward, skipping eliminated players.

**Turn count.** Total number of moves made in the room since `game_start`. `room.turnCount`. Distinct from `currentTurn`.

## Server state terms

**Player.** An identity tied to a socket. `{ id: uuid, name: string, eliminated?: boolean }`.

**Player ID.** A UUID. Authenticated sockets use the stable account player ID from JWT. Guest sockets receive a temporary UUID for the duration of the connection.

**Player index.** The position of a player in `room.players`. `0`, `1`, `2`, `3`. Determines color and turn order. Distinct from `playerId` (which is a UUID).

**`myIndex` (frontend).** The current user's player index, computed as `gameState.players.findIndex(p => p.id === playerId)`. Used to gate cell clickability.

**Bucket.** An array of waiting players inside `queues`. One bucket per `(rows, cols, maxPlayers)` combination.

**Queue key.** The string `${gridRows}x${gridCols}x${maxPlayers}`, e.g. `"6x9x2"`. Identifies a bucket.

**Room.** An active game. Holds `{ id, players, gridRows, gridCols, board, currentTurn, turnCount }`. Created when a bucket fills, deleted when the game ends.

**Room ID.** A UUID assigned at room creation.

## Protocol terms

**Frame.** One JSON message sent over the WebSocket. Always has a `type` field.

**Broadcast.** Sending the same frame to every player in a room. Implemented in `utils/broadcast.ts`.

**Send.** Sending a frame to a single socket. Used for per-player responses (`connected`, `queued`, `error`).

**Phase (frontend).** Which screen the user sees: `lobby`, `queued`, `playing`, `gameover`. Drives the switch in `page.tsx`.

**Phase machine.** The legal transitions between phases. See `ARCHITECTURE.md`.

## Process terms

**Handler.** A function in `handlers/` that processes one message type. Examples: `handleJoinQueue`, `handleMove`.

**Router.** `router.ts`. Parses, validates, and dispatches incoming frames.

**Schema.** A Zod definition in `schemas/`. Validates a message at the boundary.

**Repository.** A module under `db/repos/` that owns Prisma operations for one entity. Handlers, controllers, and services call repo methods, never Prisma directly.

**Mapper.** A function that translates between DB column names (`snake_case`) and internal property names (`camelCase`). In `utils/mappers.ts`.

## Words we deliberately don't use

- **"Match"** for an in-progress game. Use **room**. "Match" is reserved for the persisted record after game over.
- **"Lobby"** for the queue. Use **queue** or **bucket**. "Lobby" is the frontend phase, not a server-side concept.
- **"Session"** for a player's connection. Use **socket** or **connection**. We don't have sessions yet.
- **"Game"** as a noun for the running state. Use **room**. ("Game logic" is fine because it's an adjective.)
