# Graph Report - .  (2026-04-28)

## Corpus Check
- Corpus is ~24,887 words - fits in a single context window. You may not need a graph.

## Summary
- 107 nodes · 86 edges · 35 communities detected
- Extraction: 80% EXTRACTED · 20% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Architecture & Doc Index|Architecture & Doc Index]]
- [[_COMMUNITY_Connection Lifecycle & Protocol Messages|Connection Lifecycle & Protocol Messages]]
- [[_COMMUNITY_Game Logic Core & State Flow|Game Logic Core & State Flow]]
- [[_COMMUNITY_Backend State & Persistence Boundary|Backend State & Persistence Boundary]]
- [[_COMMUNITY_Backend Setup & Code Quality|Backend Setup & Code Quality]]
- [[_COMMUNITY_Message Validation Pipeline|Message Validation Pipeline]]
- [[_COMMUNITY_Testing & Run Commands|Testing & Run Commands]]
- [[_COMMUNITY_Database Schema|Database Schema]]
- [[_COMMUNITY_Constants & Error Codes|Constants & Error Codes]]
- [[_COMMUNITY_Database Module Structure|Database Module Structure]]
- [[_COMMUNITY_Critical Mass Concept|Critical Mass Concept]]
- [[_COMMUNITY_Explosion & Ownership Transfer|Explosion & Ownership Transfer]]
- [[_COMMUNITY_Graphify Query Tool|Graphify Query Tool]]
- [[_COMMUNITY_Frontend Responsibilities|Frontend Responsibilities]]
- [[_COMMUNITY_Non-Goals|Non-Goals]]
- [[_COMMUNITY_Backend Reading Order|Backend Reading Order]]
- [[_COMMUNITY_Project Directory Map|Project Directory Map]]
- [[_COMMUNITY_File Naming Convention|File Naming Convention]]
- [[_COMMUNITY_Async Style Convention|Async Style Convention]]
- [[_COMMUNITY_Database Migrations|Database Migrations]]
- [[_COMMUNITY_Frontend Gotchas|Frontend Gotchas]]
- [[_COMMUNITY_Move Rules|Move Rules]]
- [[_COMMUNITY_Win Condition|Win Condition]]
- [[_COMMUNITY_Board Creation|Board Creation]]
- [[_COMMUNITY_Cell Term|Cell Term]]
- [[_COMMUNITY_Board Term|Board Term]]
- [[_COMMUNITY_Orb Term|Orb Term]]
- [[_COMMUNITY_Owner Term|Owner Term]]
- [[_COMMUNITY_Cascade Term|Cascade Term]]
- [[_COMMUNITY_Player Index Term|Player Index Term]]
- [[_COMMUNITY_Bucket Term|Bucket Term]]
- [[_COMMUNITY_SendBroadcast Terms|Send/Broadcast Terms]]
- [[_COMMUNITY_Forbidden Words|Forbidden Words]]
- [[_COMMUNITY_leaveQueue Message|leaveQueue Message]]
- [[_COMMUNITY_Commit Rules|Commit Rules]]

## God Nodes (most connected - your core abstractions)
1. `Context File Index` - 9 edges
2. `Production-Grade Node.js Backend Setup Guide` - 7 edges
3. `useGameWebSocket Hook (state ownership)` - 6 edges
4. `applyMove() function` - 6 edges
5. `In-Memory State Maps (players/queues/rooms/playerRooms)` - 5 edges
6. `Backend Layering Convention` - 5 edges
7. `Connection-to-Cleanup Lifecycle` - 4 edges
8. `Repository Pattern Hard Rules` - 4 edges
9. `Rule: Server Authority` - 4 edges
10. `System Overview (Frontend, Backend, DB)` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Graphify Knowledge Graph Instructions` --conceptually_related_to--> `Chain Reaction Claude Context Overview`  [INFERRED]
  GEMINI.md → docs/CLAUDE.md
- `Routes/Controllers/Services/Repositories Layering` --semantically_similar_to--> `Backend Layering Convention`  [INFERRED] [semantically similar]
  docs/BACKEND_SETUP_GUIDE.md → docs/CONVENTIONS.md
- `Connection-to-Game State Flow` --shares_data_with--> `In-Memory State Maps (players/queues/rooms/playerRooms)`  [INFERRED]
  docs/BACKEND.md → docs/ARCHITECTURE.md
- `In-Memory State Maps (players/queues/rooms/playerRooms)` --rationale_for--> `Rule: State Boundary (memory vs DB)`  [INFERRED]
  docs/ARCHITECTURE.md → docs/RULES.md
- `TypeScript & tsconfig.json Setup` --semantically_similar_to--> `TypeScript Strictness Convention`  [INFERRED] [semantically similar]
  docs/BACKEND_SETUP_GUIDE.md → docs/CONVENTIONS.md

## Hyperedges (group relationships)
- **Client-to-Server Protocol Messages** — protocol_msg_join_queue, protocol_msg_leave_queue, protocol_msg_make_move, protocol_msg_leave_game [EXTRACTED 1.00]
- **Server-to-Client Protocol Messages** — protocol_msg_connected, protocol_msg_queued, protocol_msg_game_start, protocol_msg_game_state, protocol_msg_game_over, protocol_msg_error [EXTRACTED 1.00]
- **Pure gameLogic.ts Five Exports** — gamelogic_create_board, gamelogic_get_critical_mass, gamelogic_get_neighbors, gamelogic_apply_move, gamelogic_is_eliminated [EXTRACTED 1.00]

## Communities

### Community 0 - "Architecture & Doc Index"
Cohesion: 0.15
Nodes (15): Database Boundary (post-M7), Fly.io Deployment Plan, System Overview (Frontend, Backend, DB), Backend File Map, Context File Index, Backend Layering Convention, DB Status: post-M7 only, error WebSocket Frame Shape (+7 more)

### Community 1 - "Connection Lifecycle & Protocol Messages"
Cohesion: 0.16
Nodes (15): Connection-to-Cleanup Lifecycle, Frontend Phase Machine, Frontend onmessage Error Handling, When to Send error vs Silently Drop, Frontend Component Tree (page.tsx), useGameWebSocket Hook (state ownership), connected message, game_over message (+7 more)

### Community 2 - "Game Logic Core & State Flow"
Cohesion: 0.15
Nodes (13): Connection-to-Game State Flow, Chain Reaction Claude Context Overview, GameBoard Rendering Contract, applyMove() function, getCriticalMass() function, getNeighbors() function, Game Logic Invariants, isEliminated() function (+5 more)

### Community 3 - "Backend State & Persistence Boundary"
Cohesion: 0.18
Nodes (12): Backend Responsibilities, game/gameLogic.ts pure module, In-Memory State Maps (players/queues/rooms/playerRooms), Backend Critical Invariants, Wire (snake_case) vs Internal (camelCase) Format, Repository Pattern Hard Rules, Provider Swap Rule, Elimination Rule with Grace Period (+4 more)

### Community 4 - "Backend Setup & Code Quality"
Cohesion: 0.2
Nodes (10): Production-Grade Node.js Backend Setup Guide, ApiError Throw/Catch in Router Pattern, Winston Named Child Loggers, TypeScript Strictness Convention, Server-Side ApiError Dispatch Pattern, Rule: Code Quality Baseline (strict TS, no any, lint), ApiError and ApiResponse Pattern, tsx watch Dev Runner (+2 more)

### Community 5 - "Message Validation Pipeline"
Cohesion: 0.5
Nodes (5): Adding a New Message Type Steps, Zod Validation at Boundary, Protocol Single Source of Truth Rule, Rule: Message Validation via Zod, Zod Input Validation

### Community 6 - "Testing & Run Commands"
Cohesion: 0.67
Nodes (3): Backend Run Commands (npm run dev, smoke:logic), Standalone Smoke Test (process.argv guard), Rule: smoke:logic Testing Path

### Community 7 - "Database Schema"
Cohesion: 0.67
Nodes (3): match_players table schema, matches table schema, players table schema

### Community 8 - "Constants & Error Codes"
Cohesion: 1.0
Nodes (2): Centralized Constants (LIMITS, MESSAGE_TYPES, ERROR_CODES), Error Codes Table

### Community 9 - "Database Module Structure"
Cohesion: 1.0
Nodes (2): Planned db/ Directory Layout, Repository Interface (matchesRepo etc)

### Community 10 - "Critical Mass Concept"
Cohesion: 1.0
Nodes (2): Critical Mass Rule, Critical Mass term

### Community 11 - "Explosion & Ownership Transfer"
Cohesion: 1.0
Nodes (2): Ownership Transfer on Explosion, Explosion term

### Community 12 - "Graphify Query Tool"
Cohesion: 1.0
Nodes (1): graphify query/path/explain CLI

### Community 13 - "Frontend Responsibilities"
Cohesion: 1.0
Nodes (1): Frontend Responsibilities

### Community 14 - "Non-Goals"
Cohesion: 1.0
Nodes (1): Non-goals for M1-M7

### Community 15 - "Backend Reading Order"
Cohesion: 1.0
Nodes (1): Backend Reading Order

### Community 16 - "Project Directory Map"
Cohesion: 1.0
Nodes (1): Project Directory Map

### Community 17 - "File Naming Convention"
Cohesion: 1.0
Nodes (1): File Naming Conventions

### Community 18 - "Async Style Convention"
Cohesion: 1.0
Nodes (1): async/await Style

### Community 19 - "Database Migrations"
Cohesion: 1.0
Nodes (1): Migrations (forward-only SQL files)

### Community 20 - "Frontend Gotchas"
Cohesion: 1.0
Nodes (1): Frontend Common Gotchas

### Community 21 - "Move Rules"
Cohesion: 1.0
Nodes (1): Move Rule (click empty/own cell)

### Community 22 - "Win Condition"
Cohesion: 1.0
Nodes (1): Win Condition (one survivor)

### Community 23 - "Board Creation"
Cohesion: 1.0
Nodes (1): createBoard() function

### Community 24 - "Cell Term"
Cohesion: 1.0
Nodes (1): Cell term

### Community 25 - "Board Term"
Cohesion: 1.0
Nodes (1): Board term

### Community 26 - "Orb Term"
Cohesion: 1.0
Nodes (1): Orb term

### Community 27 - "Owner Term"
Cohesion: 1.0
Nodes (1): Owner term

### Community 28 - "Cascade Term"
Cohesion: 1.0
Nodes (1): Cascade / Chain Reaction term

### Community 29 - "Player Index Term"
Cohesion: 1.0
Nodes (1): Player Index vs Player ID

### Community 30 - "Bucket Term"
Cohesion: 1.0
Nodes (1): Bucket / Queue Key

### Community 31 - "Send/Broadcast Terms"
Cohesion: 1.0
Nodes (1): Frame / Broadcast / Send

### Community 32 - "Forbidden Words"
Cohesion: 1.0
Nodes (1): Words We Don't Use (match/lobby/session/game)

### Community 33 - "leaveQueue Message"
Cohesion: 1.0
Nodes (1): leave_queue message

### Community 34 - "Commit Rules"
Cohesion: 1.0
Nodes (1): Rule: Conventional Commits

## Knowledge Gaps
- **61 isolated node(s):** `Graphify Knowledge Graph Instructions`, `graphify query/path/explain CLI`, `Frontend Responsibilities`, `game/gameLogic.ts pure module`, `Database Boundary (post-M7)` (+56 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Constants & Error Codes`** (2 nodes): `Centralized Constants (LIMITS, MESSAGE_TYPES, ERROR_CODES)`, `Error Codes Table`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Database Module Structure`** (2 nodes): `Planned db/ Directory Layout`, `Repository Interface (matchesRepo etc)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Critical Mass Concept`** (2 nodes): `Critical Mass Rule`, `Critical Mass term`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Explosion & Ownership Transfer`** (2 nodes): `Ownership Transfer on Explosion`, `Explosion term`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Graphify Query Tool`** (1 nodes): `graphify query/path/explain CLI`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Responsibilities`** (1 nodes): `Frontend Responsibilities`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Non-Goals`** (1 nodes): `Non-goals for M1-M7`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Backend Reading Order`** (1 nodes): `Backend Reading Order`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Project Directory Map`** (1 nodes): `Project Directory Map`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `File Naming Convention`** (1 nodes): `File Naming Conventions`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Async Style Convention`** (1 nodes): `async/await Style`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Database Migrations`** (1 nodes): `Migrations (forward-only SQL files)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Gotchas`** (1 nodes): `Frontend Common Gotchas`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Move Rules`** (1 nodes): `Move Rule (click empty/own cell)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Win Condition`** (1 nodes): `Win Condition (one survivor)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Board Creation`** (1 nodes): `createBoard() function`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cell Term`** (1 nodes): `Cell term`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Board Term`** (1 nodes): `Board term`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Orb Term`** (1 nodes): `Orb term`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Owner Term`** (1 nodes): `Owner term`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cascade Term`** (1 nodes): `Cascade / Chain Reaction term`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Player Index Term`** (1 nodes): `Player Index vs Player ID`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Bucket Term`** (1 nodes): `Bucket / Queue Key`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Send/Broadcast Terms`** (1 nodes): `Frame / Broadcast / Send`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Forbidden Words`** (1 nodes): `Words We Don't Use (match/lobby/session/game)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `leaveQueue Message`** (1 nodes): `leave_queue message`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Commit Rules`** (1 nodes): `Rule: Conventional Commits`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `In-Memory State Maps (players/queues/rooms/playerRooms)` connect `Backend State & Persistence Boundary` to `Game Logic Core & State Flow`?**
  _High betweenness centrality (0.250) - this node is a cross-community bridge._
- **Why does `Connection-to-Game State Flow` connect `Game Logic Core & State Flow` to `Backend State & Persistence Boundary`?**
  _High betweenness centrality (0.208) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `In-Memory State Maps (players/queues/rooms/playerRooms)` (e.g. with `Connection-to-Game State Flow` and `Rule: State Boundary (memory vs DB)`) actually correct?**
  _`In-Memory State Maps (players/queues/rooms/playerRooms)` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Graphify Knowledge Graph Instructions`, `graphify query/path/explain CLI`, `Frontend Responsibilities` to the rest of the system?**
  _61 weakly-connected nodes found - possible documentation gaps or missing edges._