# Spec — Playtest: Standalone Ktor Server + Web Client
**Date**: 2026-03-19
**Status**: APPROVED
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
│       ├── GameRoom.kt          ← repackaged từ src/server/
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
{ "action": "JOIN",       "playerId": "p1" }
{ "action": "ROLL_DICE",  "playerId": "p1" }
{ "action": "MOVE",       "playerId": "p1", "tokenIndex": 0 }
{ "action": "KICK",       "playerId": "p1", "targetId": "p2", "tokenIndex": 0 }
```

**Server → Client** (broadcast JSON):
```json
{ "event": "GAME_STATE",   "room": {...}, "players": [...], "board": [...] }
{ "event": "DICE_RESULT",  "playerId": "p1", "roll": 4 }
{ "event": "MOVE_RESULT",  "playerId": "p1", "tokenIndex": 0, "from": 5, "to": 9 }
{ "event": "KICK",         "kickerId": "p1", "kickedId": "p2", "tokenIndex": 0, "to": 1 }
{ "event": "TURN_CHANGE",  "currentPlayer": "p2" }
{ "event": "WIN",          "winnerId": "p1" }
{ "event": "ERROR",        "message": "Not your turn" }
```

### GameRoomManager
- In-memory `ConcurrentHashMap<String, GameRoom>`
- Max 2 players per room
- Broadcast to all sessions in room on state change
- Auto-cleanup khi room empty

### Package Rewrite
Generated files dùng `com.ccn2.server.elementalhunter` → rewrite thành `playtest` flat package. Giữ nguyên logic, chỉ đổi package declaration.

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
│   BOARD (40 tiles)    │  HP: ██████ 100             │
│   circular, numbered  │  Element: 🔥 Fire            │
│                       │  KC: 0 / 600                │
│   P1 tokens: 🔴🔴     │  Token A: tile 5            │
│   P2 tokens: 🔵🔵     │  Token B: tile 12           │
│                       ├─────────────────────────────┤
│   Safe zones: ★       │  Player 2 (p2)               │
│   KC tiles: ◆         │  HP: ██████ 100             │
│                       │  Element: 💧 Water           │
├───────────────────────┤  KC: 0 / 600                │
│  Event Log            │  Token A: tile 1            │
│  [12:30] p1 rolled 4  │  Token B: tile 1            │
│  [12:30] p1 → tile 5  ├─────────────────────────────┤
│  [12:31] p2 joined    │  Turn: P1 🔴                 │
│                       │  [🎲 Roll Dice]              │
│                       │  [Move Token A] [Move Token B]│
│                       │  [⚔️ Kick p2]               │
└───────────────────────┴─────────────────────────────┘
```

### Tech
- Vanilla HTML/CSS/JS — no build step
- Canvas 2D: circular board 40 tiles, numbered, color-coded
- WebSocket native API
- Dark theme `#0f172a`, Indigo primary `#6366f1`

### Connection Setup
1. Page load: prompt for `roomId` + `playerId` (p1 hoặc p2)
2. Connect WS: `ws://localhost:8181/game/ws/{roomId}/{playerId}`
3. Send `JOIN` → receive `GAME_STATE` → render board

### Board Render (Canvas)
- 40 tiles arranged in circle
- Safe zones (1, 11, 21, 31): gold star icon
- KC tiles (5, 10, 15, 20, 25, 30, 35, 40): diamond icon
- Tokens: colored circles on tile
- Current turn highlight: pulsing border

### 2-Player Support
- Single tab: buttons switch theo `currentPlayer` từ `TURN_CHANGE` event
- Hoặc: 2 tabs — tab 1 dùng playerId=p1, tab 2 dùng playerId=p2

---

## Basic Game Loop Flow

```
p1 opens tab → enters roomId="room1", playerId="p1" → WS connect
p2 opens tab → enters roomId="room1", playerId="p2" → WS connect
Server broadcasts GAME_STATE (2 players joined)

p1 clicks [Roll Dice] → server rolls 4 → DICE_RESULT broadcast
p1 clicks [Move Token A] → server validates → MOVE_RESULT (tile 1→5)
  → If tile 5 is KC tile → KC event (+50 KC)
  → If p2 token on tile 5 → KICK event (p2 token back to start)
Server sends TURN_CHANGE (currentPlayer: p2)

... repeat until player reaches 600 KC + lands on KC tile
Server sends WIN event
```

---

## Deliverables

| # | Artifact | Notes |
|---|----------|-------|
| D1 | `playtest/server/build.gradle.kts` | Minimal Ktor deps |
| D2 | `playtest/server/settings.gradle.kts` | Project name |
| D3 | `playtest/server/gradlew` + `gradlew.bat` | Copy từ demo-main |
| D4 | `playtest/server/src/main/kotlin/playtest/Main.kt` | Ktor app + routes |
| D5 | `playtest/server/src/main/kotlin/playtest/GameRoomManager.kt` | Room lifecycle |
| D6 | `playtest/server/src/main/kotlin/playtest/*.kt` | Repackaged game logic (12 files) |
| D7 | `playtest/server/src/main/kotlin/playtest/config/*.json` | Balance/character/level configs |
| D8 | `playtest/client/index.html` | Full web client |

---

## Non-Goals

- **NOT**: Integrate vào demo-main (đó là bước sau)
- **NOT**: Admin panel (không cần để playtest)
- **NOT**: Persistent database (in-memory only)
- **NOT**: Authentication (roomId + playerId là đủ)
- **NOT**: Mobile responsive (desktop browser only)
- **NOT**: Multiplayer > 2 players (chỉ test 2-player flow)
