# Graph Report - chain-reaction  (2026-05-21)

## Corpus Check
- 104 files · ~100,278 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 326 nodes · 431 edges · 41 communities detected
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 46 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]

## God Nodes (most connected - your core abstractions)
1. `dispatch()` - 9 edges
2. `handleMove()` - 9 edges
3. `eliminateAndBroadcast()` - 9 edges
4. `Context File Index` - 9 edges
5. `endGame()` - 7 edges
6. `send()` - 7 edges
7. `envelope()` - 7 edges
8. `Production-Grade Node.js Backend Setup Guide` - 7 edges
9. `handleJoinQueue()` - 6 edges
10. `broadcast()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `dispatch()` --calls--> `validateMessage()`  [INFERRED]
  backend\src\router.ts → backend\src\schemas\messages.schemas.ts
- `dispatch()` --calls--> `handleJoinQueue()`  [INFERRED]
  backend\src\router.ts → backend\src\handlers\queue.handlers.ts
- `dispatch()` --calls--> `handleLeaveQueue()`  [INFERRED]
  backend\src\router.ts → backend\src\handlers\queue.handlers.ts
- `createBoard()` --calls--> `handleCreateRoom()`  [INFERRED]
  backend\src\game\gameLogic.ts → backend\src\handlers\room.handlers.ts
- `applyMove()` --calls--> `handleMove()`  [INFERRED]
  backend\src\game\gameLogic.ts → backend\src\handlers\game.handlers.ts

## Hyperedges (group relationships)
- **Client-to-Server Protocol Messages** — protocol_msg_join_queue, protocol_msg_leave_queue, protocol_msg_make_move, protocol_msg_leave_game [EXTRACTED 1.00]
- **Server-to-Client Protocol Messages** — protocol_msg_connected, protocol_msg_queued, protocol_msg_game_start, protocol_msg_game_state, protocol_msg_game_over, protocol_msg_error [EXTRACTED 1.00]
- **Pure gameLogic.ts Five Exports** — gamelogic_create_board, gamelogic_get_critical_mass, gamelogic_get_neighbors, gamelogic_apply_move, gamelogic_is_eliminated [EXTRACTED 1.00]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (7): getBearerToken(), requireAuth(), buildAuthResult(), throwInvalidCredentials(), isAuthTokenPayload(), signAccessToken(), verifyAccessToken()

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (30): Database Boundary (post-M7), Fly.io Deployment Plan, System Overview (Frontend, Backend, DB), Backend File Map, Adding a New Message Type Steps, Production-Grade Node.js Backend Setup Guide, Context File Index, ApiError Throw/Catch in Router Pattern (+22 more)

### Community 2 - "Community 2"
Cohesion: 0.15
Nodes (7): ApiError, getSchemaForType(), validateMessage(), getQueueKey(), handleJoinQueue(), handleLeaveQueue(), removeFromAllQueues()

### Community 3 - "Community 3"
Cohesion: 0.16
Nodes (22): broadcast(), send(), advanceTurn(), broadcastGameState(), computeAuthDeltas(), destroyRoom(), eliminateAndBroadcast(), endGame() (+14 more)

### Community 4 - "Community 4"
Cohesion: 0.13
Nodes (3): buildGuestIdentity(), getTokenFromRequest(), resolveIdentity()

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (20): Backend Responsibilities, game/gameLogic.ts pure module, In-Memory State Maps (players/queues/rooms/playerRooms), Backend Critical Invariants, Connection-to-Game State Flow, Wire (snake_case) vs Internal (camelCase) Format, Repository Pattern Hard Rules, Provider Swap Rule (+12 more)

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (20): Connection-to-Cleanup Lifecycle, Frontend Phase Machine, Chain Reaction Claude Context Overview, Frontend onmessage Error Handling, When to Send error vs Silently Drop, Frontend Component Tree (page.tsx), GameBoard Rendering Contract, useGameWebSocket Hook (state ownership) (+12 more)

### Community 7 - "Community 7"
Cohesion: 0.15
Nodes (7): ApiClientError, apiRequest(), clearStoredAccessToken(), getStoredAccessToken(), setStoredAccessToken(), handleSubmit(), buildWebSocketUrl()

### Community 8 - "Community 8"
Cohesion: 0.23
Nodes (9): applyMove(), createBoard(), getCriticalMass(), getNeighbors(), flashNotice(), onCreateRoom(), onJoinRoom(), onPlay() (+1 more)

### Community 9 - "Community 9"
Cohesion: 0.23
Nodes (9): chainSound(), clickSound(), createSoundEngine(), envelope(), errorSound(), explodeSound(), placeSound(), turnSound() (+1 more)

### Community 11 - "Community 11"
Cohesion: 0.53
Nodes (4): handleConfirm(), handleInput(), handleKeyDown(), setCharAt()

### Community 12 - "Community 12"
Cohesion: 0.5
Nodes (2): cellKey(), diffBoards()

### Community 14 - "Community 14"
Cohesion: 0.67
Nodes (3): Backend Run Commands (npm run dev, smoke:logic), Standalone Smoke Test (process.argv guard), Rule: smoke:logic Testing Path

### Community 15 - "Community 15"
Cohesion: 0.67
Nodes (3): match_players table schema, matches table schema, players table schema

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (2): Planned db/ Directory Layout, Repository Interface (matchesRepo etc)

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (2): Centralized Constants (LIMITS, MESSAGE_TYPES, ERROR_CODES), Error Codes Table

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (2): Critical Mass Rule, Critical Mass term

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (2): Ownership Transfer on Explosion, Explosion term

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (1): graphify query/path/explain CLI

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (1): Frontend Responsibilities

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (1): Non-goals for M1-M7

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (1): Backend Reading Order

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (1): Project Directory Map

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (1): File Naming Conventions

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (1): async/await Style

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (1): Migrations (forward-only SQL files)

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (1): Frontend Common Gotchas

### Community 62 - "Community 62"
Cohesion: 1.0
Nodes (1): Move Rule (click empty/own cell)

### Community 63 - "Community 63"
Cohesion: 1.0
Nodes (1): Win Condition (one survivor)

### Community 64 - "Community 64"
Cohesion: 1.0
Nodes (1): createBoard() function

### Community 65 - "Community 65"
Cohesion: 1.0
Nodes (1): Cell term

### Community 66 - "Community 66"
Cohesion: 1.0
Nodes (1): Board term

### Community 67 - "Community 67"
Cohesion: 1.0
Nodes (1): Orb term

### Community 68 - "Community 68"
Cohesion: 1.0
Nodes (1): Owner term

### Community 69 - "Community 69"
Cohesion: 1.0
Nodes (1): Cascade / Chain Reaction term

### Community 70 - "Community 70"
Cohesion: 1.0
Nodes (1): Player Index vs Player ID

### Community 71 - "Community 71"
Cohesion: 1.0
Nodes (1): Bucket / Queue Key

### Community 72 - "Community 72"
Cohesion: 1.0
Nodes (1): Frame / Broadcast / Send

### Community 73 - "Community 73"
Cohesion: 1.0
Nodes (1): Words We Don't Use (match/lobby/session/game)

### Community 74 - "Community 74"
Cohesion: 1.0
Nodes (1): leave_queue message

### Community 75 - "Community 75"
Cohesion: 1.0
Nodes (1): Rule: Conventional Commits

## Knowledge Gaps
- **61 isolated node(s):** `Graphify Knowledge Graph Instructions`, `graphify query/path/explain CLI`, `Frontend Responsibilities`, `game/gameLogic.ts pure module`, `Database Boundary (post-M7)` (+56 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 12`** (5 nodes): `capacityFor()`, `cellKey()`, `diffBoards()`, `tallyOrbs()`, `board.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (2 nodes): `Planned db/ Directory Layout`, `Repository Interface (matchesRepo etc)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (2 nodes): `Centralized Constants (LIMITS, MESSAGE_TYPES, ERROR_CODES)`, `Error Codes Table`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (2 nodes): `Critical Mass Rule`, `Critical Mass term`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (2 nodes): `Ownership Transfer on Explosion`, `Explosion term`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `graphify query/path/explain CLI`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `Frontend Responsibilities`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `Non-goals for M1-M7`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `Backend Reading Order`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `Project Directory Map`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `File Naming Conventions`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (1 nodes): `async/await Style`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (1 nodes): `Migrations (forward-only SQL files)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (1 nodes): `Frontend Common Gotchas`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (1 nodes): `Move Rule (click empty/own cell)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (1 nodes): `Win Condition (one survivor)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (1 nodes): `createBoard() function`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (1 nodes): `Cell term`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (1 nodes): `Board term`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (1 nodes): `Orb term`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (1 nodes): `Owner term`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 69`** (1 nodes): `Cascade / Chain Reaction term`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 70`** (1 nodes): `Player Index vs Player ID`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 71`** (1 nodes): `Bucket / Queue Key`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 72`** (1 nodes): `Frame / Broadcast / Send`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (1 nodes): `Words We Don't Use (match/lobby/session/game)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (1 nodes): `leave_queue message`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (1 nodes): `Rule: Conventional Commits`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `applyMove() function` connect `Community 5` to `Community 6`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `dispatch()` (e.g. with `validateMessage()` and `handleJoinQueue()`) actually correct?**
  _`dispatch()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `handleMove()` (e.g. with `dispatch()` and `applyMove()`) actually correct?**
  _`handleMove()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Graphify Knowledge Graph Instructions`, `graphify query/path/explain CLI`, `Frontend Responsibilities` to the rest of the system?**
  _61 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._