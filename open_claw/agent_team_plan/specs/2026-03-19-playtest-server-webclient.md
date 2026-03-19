# Spec — Playtest: Standalone Ktor Server + Web Client
**Date**: 2026-03-19
**Status**: APPROVED (v2 — post-reviewer fixes)
**Author**: William Đào 👌

---

## Overview

Tạo môi trường playtest độc lập cho Elemental Hunter:
- **Standalone Ktor server** chứa game logic đã generate (`src/server/elemental-hunter/`)
- **Single-file web client** (`index.html`) kết nối WebSocket, render board, demo basic game loop

Không động đến `demo-main/`. Sau khi verify xong mới integrate chính thức.

---

## Section 1: Project Structure

```
D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\playtest\
├── server/
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   ├── gradlew
│   ├── gradlew.bat
│   └── src/main/kotlin/playtest/
│       ├── Main.kt
│       ├── GameRoomManager.kt
│       ├── GameRoom.kt          ← rewritten (actor model, no bitzero-kotlin)
│       ├── BoardBuilder.kt
│       ├── CombatEngine.kt
│       ├── ElementEngine.kt
│       ├── ArtifactHandler.kt
│       ├── MovementValidator.kt
│       ├── RNGService.kt
│       ├── GameConfig.kt
│       ├── BalanceConfig.kt
│       ├── CharacterConfig.kt
│       ├── LevelConfig.kt
│       └── config/
│           ├── balance.json
│           ├── character.json
│           └── level.json
└── client/
    └── index.html
```

**Server port**: `8181`
**WebSocket endpoint**: `ws://localhost:8181/game/ws/{roomId}/{playerId}`

---

## Section 2: Standalone Ktor Server

### Dependencies (build.gradle.kts)
- `ktor-server-core`, `ktor-server-netty`
- `ktor-server-websockets`
- `ktor-server-content-negotiation`, `ktor-serialization-kotlinx-json`
- `kotlinx-coroutines-core`
- Versions từ demo-main/serverccn2 (Ktor 3.4.0, Kotlin 2.3.0)

### HTTP Routes
```
GET  /health              → 200 "OK"
GET  /game/rooms          → JSON list of active rooms
POST /game/rooms/{roomId} → Create room
WS   /game/ws/{roomId}/{playerId} → WebSocket game session
```

### WebSocket Protocol

**Client → Server** (JSON):
```json
{ "action": "JOIN",         "playerId": "p1" }
{ "action": "ROLL_DICE",    "playerId": "p1" }
{ "action": "SELECT_TOKEN", "playerId": "p1", "tokenId": "tokenA" }
{ "action": "MOVE",         "playerId": "p1", "steps": 4 }
```

> ⚠️ KICK is NOT a client action. Server auto-triggers kick when a moving token lands on a tile occupied by an opponent token. Client receives `KICK` event passively.

**Server → Client** (broadcast JSON):
```json
{ "event": "GAME_STATE",    "room": {...}, "players": [...], "board": [...] }
{ "event": "DICE_RESULT",   "playerId": "p1", "roll": 4 }
{ "event": "TOKEN_SELECTED","playerId": "p1", "tokenId": "tokenA" }
{ "event": "MOVE_RESULT",   "playerId": "p1", "tokenId": "tokenA", "from": 5, "to": 9 }
{ "event": "KICK",          "kickerId": "p1", "kickedId": "p2", "tokenId": "tokenA", "returnedTo": 0 }
{ "event": "TURN_CHANGE",   "currentPlayer": "p2" }
{ "event": "WIN",           "winnerId": "p1" }
{ "event": "ERROR",         "message": "Not your turn" }
```

**Turn Flow (server-side)**:
```
JOIN x2 → StartGame → currentPlayer = p1
p1: ROLL_DICE → DICE_RESULT(roll)
p1: SELECT_TOKEN → TOKEN_SELECTED
p1: MOVE(steps=roll) → MOVE_RESULT → [KICK?] → TURN_CHANGE(p2)
p2: ROLL_DICE → ...
```
Turn ends and rotates to next player after MOVE is processed.

### GameRoomManager
- In-memory `ConcurrentHashMap<String, GameRoom>`
- Session registry: `ConcurrentHashMap<String, MutableList<DefaultWebSocketSession>>` — maps `roomId` → list of active WS sessions for broadcast
- Player-to-session map per room: `playerId → DefaultWebSocketSession` for targeted messaging
- Max 2 players per room
- Broadcast to all sessions in room on state change
- Auto-cleanup khi room empty (remove room when last session closes)

### Package Rewrite — Scope

Files repackaged (logic unchanged, `package com.ccn2.server.elementalhunter` → `package playtest`):
- `BoardBuilder.kt`, `CombatEngine.kt`, `ElementEngine.kt`, `ArtifactHandler.kt`
- `MovementValidator.kt`, `RNGService.kt`
- `GameConfig.kt`, `BalanceConfig.kt`, `CharacterConfig.kt`, `LevelConfig.kt`

Files **fully rewritten** (cannot repackage — depend on bitzero-kotlin or need WS integration):
- `GameRoom.kt` — rewritten as standalone actor (coroutine Channel, no bitzero-kotlin KtorServerPlugin)
- `GameRoomManager.kt` — rewritten with `ConcurrentHashMap` + `DefaultWebSocketSession` registry
- `Main.kt` — new file, Ktor app entry point
- `ElementalHunterModule.kt` — **NOT used** (extends bitzero-kotlin `KtorServerPlugin`; incompatible with standalone)
- `ElementalHunterRequestHandler.kt` — **NOT used** (bitzero-kotlin specific)
- `ElementalHunterEventListener.kt` — **NOT used** (bitzero-kotlin specific)

### Board Layout (from BoardBuilder.kt)
- **61 tiles**, IDs 0–60, cross (chữ thập) shape
- `ARM_P2`: tiles 0–9 (P2 start zone, safe at 0–2)
- `ARM_P1`: tiles 51–60 (P1 start zone, safe at 51–53)
- `MAIN_LOOP`: tiles 10–50 connecting arms
- `ELEMENTAL` tiles: 10, 11, 12, 20, 21, 22, 30, 31, 32, 40, 41, 42, 51, 52, 53, 0, 1, 2
- `FINAL_GOAL` tiles: P1=24, P2=44
- `SAFE_ZONE` tiles: 51, 52, 53 (P1 start), 0, 1, 2 (P2 start)

### Build & Run
```bash
cd playtest/server
./gradlew run
# Server starts at http://localhost:8181
```

---

## Section 3: Web Client (index.html)

### Layout

```
┌─────────────────────────────────────────────────────┐
│  🎮 Elemental Hunter Playtest      [●] Connected     │
├───────────────────────┬─────────────────────────────┤
│                       │  Player 1 (p1)               │
│   BOARD (61 tiles)    │  HP: ██████ 100             │
│   cross shape         │  Element: 🔥 Fire            │
│                       │  Token A: tile 51           │
│   P1 tokens: 🔴🔴     │  Token B: tile 52           │
│   P2 tokens: 🔵🔵     ├─────────────────────────────┤
│                       │  Player 2 (p2)               │
│   Safe zones: ★       │  HP: ██████ 100             │
│   Elemental: ⚡       │  Element: 💧 Water           │
│   Final goal: 🏁      │  Token A: tile 0            │
├───────────────────────┤  Token B: tile 1            │
│  Event Log            ├─────────────────────────────┤
│  [12:30] p1 rolled 4  │  Turn: P1 🔴                 │
│  [12:30] p1 → tile 55 │  [🎲 Roll Dice]              │
│  [12:31] p2 joined    │  [Select Token A] [Select Token B]│
│                       │  [▶ Move]                    │
└───────────────────────┴─────────────────────────────┘
```

> No "Kick" button — kick is automatic server-side when landing on opponent's tile.

### Tech
- Vanilla HTML/CSS/JS — no build step
- Canvas 2D: cross-shaped board 61 tiles (IDs 0–60), numbered, color-coded by tile type
- WebSocket native API
- Dark theme `#0f172a`, Indigo primary `#6366f1`

### Connection Setup
1. Page load: prompt for `roomId` + `playerId` (p1 hoặc p2)
2. Connect WS: `ws://localhost:8181/game/ws/{roomId}/{playerId}`
3. Send `JOIN` → receive `GAME_STATE` → render board

### Board Render (Canvas)
- 61 tiles arranged in cross shape (chữ thập)
- Safe zones (0-2, 51-53): gold star icon ★
- Elemental tiles (18 tiles per ELEMENTAL_TILE_IDS): lightning icon ⚡, color-coded by element (Fire=red, Ice=blue, Grass=green, Rock=gray)
- Final goal tiles (24=P1, 44=P2): flag icon 🏁
- Tokens: colored circles on tile (P1=red, P2=blue)
- Current turn highlight: pulsing border on current player's tokens
- Tile IDs displayed as small numbers

### Turn Flow (client-side)
1. Receive `GAME_STATE` or `TURN_CHANGE` → enable controls only if `currentPlayer == myPlayerId`
2. Click [🎲 Roll Dice] → send `ROLL_DICE` → wait for `DICE_RESULT`
3. Click [Select Token A/B] → send `SELECT_TOKEN` → wait for `TOKEN_SELECTED`
4. Click [▶ Move] → send `MOVE(steps=lastRoll)` → wait for `MOVE_RESULT`
5. Receive `KICK` (if kicked) → animate token returning to start
6. Receive `TURN_CHANGE` → disable controls, update UI

### 2-Player Support
- Single tab: buttons active only when `currentPlayer == myPlayerId`
- Hoặc: 2 tabs — tab 1 dùng playerId=p1, tab 2 dùng playerId=p2

---

## Basic Game Loop Flow

```
p1 opens tab → enters roomId="room1", playerId="p1" → WS connect → send JOIN
p2 opens tab → enters roomId="room1", playerId="p2" → WS connect → send JOIN
Server: 2 players joined → StartGame → broadcasts GAME_STATE (phase=PLAYING, turn=p1)

p1 clicks [Roll Dice]     → ROLL_DICE → server rolls 4 → DICE_RESULT(roll=4) broadcast
p1 clicks [Select Token A]→ SELECT_TOKEN(tokenId=tokenA) → TOKEN_SELECTED
p1 clicks [Move]          → MOVE(steps=4) → server validates via MovementValidator
  → MOVE_RESULT(tokenA, from=51, to=55)
  → If tile 55 is ELEMENTAL → ElementEngine triggers elemental effect
  → If p2 token on tile 55 → server auto-triggers KICK (p2 token → tile 0)
→ TURN_CHANGE(currentPlayer=p2)

... repeat until player reaches FINAL_GOAL tile
Server sends WIN event
```

---

## Deliverables

| # | Artifact | Notes |
|---|----------|-------|
| D1 | `playtest/server/build.gradle.kts` | Minimal Ktor deps |
| D2 | `playtest/server/settings.gradle.kts` | Project name |
| D3 | `playtest/server/gradlew` + `gradlew.bat` | Copy từ demo-main |
| D4 | `playtest/server/src/main/kotlin/playtest/Main.kt` | Ktor app + routes + WS handler |
| D5 | `playtest/server/src/main/kotlin/playtest/GameRoomManager.kt` | ConcurrentHashMap + WS session registry |
| D6 | `playtest/server/src/main/kotlin/playtest/GameRoom.kt` | Rewritten actor: Channel + turn rotation logic |
| D7 | `playtest/server/src/main/kotlin/playtest/*.kt` | Repackaged game logic (10 files — no bitzero files) |
| D8 | `playtest/server/src/main/kotlin/playtest/config/*.json` | Balance/character/level configs |
| D9 | `playtest/client/index.html` | Full web client (Canvas 61-tile board, turn-aware controls) |

---

## Non-Goals

- **NOT**: Integrate vào demo-main (đó là bước sau)
- **NOT**: Admin panel (không cần để playtest)
- **NOT**: Persistent database (in-memory only)
- **NOT**: Authentication (roomId + playerId là đủ)
- **NOT**: Mobile responsive (desktop browser only)
- **NOT**: Multiplayer > 2 players (chỉ test 2-player flow)
- **NOT**: ElementalHunterModule/RequestHandler/EventListener (bitzero-kotlin specific, không dùng)
