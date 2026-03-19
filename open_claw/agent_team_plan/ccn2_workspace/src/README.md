# src/ — Implementation Code

## Status theo sub-folder

| Folder | Status | Owner | Ghi chú |
|--------|--------|-------|---------|
| `src/server/` | ⚠️ DEPRECATED | — | Agents nay ghi thang vao `playtest/server/src/main/kotlin/playtest/` |
| `src/client/` | ⚠️ DEPRECATED | — | Agents nay ghi thang vao `playtest/client/src/` |
| `src/admin/` | ✅ ACTIVE | agent_dev_admin (Panel) | Java + React staging cho admintool |
| `src/tests/` | ✅ ACTIVE | agent_qc (Verita) | Jest + Kotlin test files |
| `src/rules.js` | ✅ ACTIVE | agent_dev (Codera) | CCN2 board game rules constants |
| `src/elemental-hunter.js` | ✅ ACTIVE | agent_dev (Codera) | CCN2 board game logic |

---

## Single Source of Truth (sau migration Option B)

```
Server features → playtest/server/src/main/kotlin/playtest/
                  package playtest
                  Protected: Types.kt, WsMessage.kt, Main.kt, GameRoom.kt, GameRoomManager.kt
                  Agent-owned: ArtifactHandler.kt, BalanceConfig.kt, BoardBuilder.kt,
                               CharacterConfig.kt, CombatEngine.kt, ElementEngine.kt,
                               GameConfig.kt, LevelConfig.kt, MovementValidator.kt, RNGService.kt

Client features → playtest/client/src/<feature>.js
                  Vanilla JS, global object literal var FeatureName = { ... }
                  Protected: core/ws-client.js, core/board-renderer.js, core/game-ui.js
                  index.html: add <script src="src/<feature>.js"> sau core scripts

Admin features  → src/admin/<feature>/   (unchanged — no playtest equivalent)
                  Java Bean + Service + Controller + React TSX
```

---

## CCN2 Board Game Rules (src/rules.js, src/elemental-hunter.js)

Cac file nay la cho CCN2 board game (round 1 workflow), KHONG phai playtest Elemental Hunter:
- `rules.js` — CCN2 game constants (CONFIG object)
- `elemental-hunter.js` — CCN2 board game logic (var ElementalHunter = { ... })

## Running Tests
```bash
cd D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\ccn2_workspace\ && npm test
```
