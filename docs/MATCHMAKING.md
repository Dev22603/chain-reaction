# Matchmaking

How players get into a game and how the match progresses at the lifecycle level. Frame-level details are in [PROTOCOL.md](./PROTOCOL.md).

Players in the lobby pick a board size and player count, then join a queue. When a queue bucket fills, a room is created and the match begins.

## Queue bucket

A bucket is identified by `gridRows × gridCols × maxPlayers` (e.g. `6x9x2`). Players with the same three values share a bucket. Different combinations don't merge.

## Joining the queue

A player joining a bucket gets a `queued` acknowledgement with their 1-indexed position and the bucket's max size. Cancelling removes them from the bucket. Joining a different bucket while already queued moves them.

## Room creation

When a bucket reaches `maxPlayers`, the server:

1. Creates a room with a fresh UUID and an empty `gridRows × gridCols` board.
2. Slices exactly `maxPlayers` players out of the bucket into the room. Any overflow stays queued.
3. Initializes `currentTurn = 0`, `turnCount = 0`.
4. Maps every player's id to the room id.
5. Broadcasts `game_start` to all room members.

Player order in the room is the order in which they joined the bucket. That order determines player index (0, 1, 2, 3), which determines color and turn order.

## Match lifecycle

1. Players alternate moves. Each `make_move` is validated server-side: it must be the player's turn, in bounds, and on a cell that is empty or already owned by them.
2. On a valid move, the server runs the chain-reaction simulation (see [GAMEPLAY.md](./GAMEPLAY.md)) and broadcasts the new `game_state`.
3. Eliminated players are skipped on subsequent turns.
4. When only one player remains alive, the server broadcasts `game_over` and deletes the room.

## Forfeit and disconnect

Leaving a game (`leave_game`) or disconnecting mid-match marks the player eliminated. Turn advances, win check reruns. If only one player remains, the match ends.

## Cleanup

After `game_over`, the room is deleted and every `playerRooms` entry pointing at it is removed. Player WebSocket connections stay alive — players return to the lobby phase locally and can queue again.
