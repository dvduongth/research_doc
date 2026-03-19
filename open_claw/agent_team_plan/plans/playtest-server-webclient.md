# Playtest: Standalone Ktor Server + Web Client — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone Ktor WebSocket server + single-file web client that lets 2 players playtest Elemental Hunter in a browser without touching demo-main.

**Architecture:** Standalone Gradle project at `playtest/server/` — no bitzero-kotlin, no private Maven repos. Game logic files repackaged from `ccn2_workspace/src/server/elemental-hunter/`. `GameRoom.kt` and `GameRoomManager.kt` fully rewritten for direct Ktor WebSocket integration. Web client is a single `index.html` with Canvas 2D board and native WebSocket API.

**Tech Stack:** Kotlin 2.3.0, Ktor 3.4.0 (Netty + WebSockets + ContentNegotiation), kotlinx.serialization, kotlinx.coroutines. Client: Vanilla HTML/CSS/JS, Canvas 2D, WebSocket API.

**Spec:** `specs/2026-03-19-playtest-server-webclient.md`

**Source files to repackage from:** `ccn2_workspace/src/server/elemental-hunter/`

**Output root:** `D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\playtest\`

---

## File Map

| File | Action | Notes |
|------|--------|-------|
| `playtest/server/build.gradle.kts` | Create | Minimal Ktor deps, mavenCentral only |
| `playtest/server/settings.gradle.kts` | Create | Project name `elemental-hunter-playtest` |
| `playtest/server/gradlew` | Copy from `demo-main/serverccn2/gradlew` | Unix shell script |
| `playtest/server/gradlew.bat` | Copy from `demo-main/serverccn2/gradlew.bat` | Windows bat |
| `playtest/server/gradle/wrapper/gradle-wrapper.jar` | Copy from `demo-main/serverccn2/gradle/wrapper/` | Required for gradlew |
| `playtest/server/gradle/wrapper/gradle-wrapper.properties` | Copy from `demo-main/serverccn2/gradle/wrapper/` | Required for gradlew |
| `playtest/server/src/main/kotlin/playtest/BoardBuilder.kt` | Repackage | Package only, logic unchanged |
| `playtest/server/src/main/kotlin/playtest/CombatEngine.kt` | Repackage | Package only |
| `playtest/server/src/main/kotlin/playtest/ElementEngine.kt` | Repackage | Package only |
| `playtest/server/src/main/kotlin/playtest/ArtifactHandler.kt` | Repackage | Package only |
| `playtest/server/src/main/kotlin/playtest/MovementValidator.kt` | Repackage | Package only |
| `playtest/server/src/main/kotlin/playtest/RNGService.kt` | Repackage | Package only |
| `playtest/server/src/main/kotlin/playtest/GameConfig.kt` | Repackage | Package only |
| `playtest/server/src/main/kotlin/playtest/BalanceConfig.kt` | Repackage | Package only |
| `playtest/server/src/main/kotlin/playtest/CharacterConfig.kt` | Repackage | Package only |
| `playtest/server/src/main/kotlin/playtest/LevelConfig.kt` | Repackage | Package only |
| `playtest/server/src/main/resources/config/balance.json` | Copy | From `ccn2_workspace/src/server/elemental-hunter/config/` — resources dir, NOT kotlin dir |
| `playtest/server/src/main/resources/config/character.json` | Copy | Same |
| `playtest/server/src/main/resources/config/level.json` | Copy | Same |
| `playtest/server/src/main/kotlin/playtest/Types.kt` | Create new | All shared type definitions (extracted from original GameRoom.kt) |
| `playtest/server/src/main/kotlin/playtest/WsMessage.kt` | Create new | Protocol DTOs (sealed classes) |
| `playtest/server/src/main/kotlin/playtest/GameRoom.kt` | Rewrite | Actor model, no bitzero-kotlin |
| `playtest/server/src/main/kotlin/playtest/GameRoomManager.kt` | Rewrite | ConcurrentHashMap + WS session registry |
| `playtest/server/src/main/kotlin/playtest/Main.kt` | Create new | Ktor app, routing, WS handler |
| `playtest/client/index.html` | Create new | Full web client |

---

## Chunk 1: Project Scaffold + Repackage

### Task 1: Create Directory Structure

**Files:**
- Create: `playtest/server/src/main/kotlin/playtest/` (directory tree)
- Create: `playtest/server/src/main/resources/` (for config JSON)
- Create: `playtest/client/`

- [ ] **Step 1.1: Create all directories**

```bash
mkdir -p "D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\playtest\server\src\main\kotlin\playtest"
mkdir -p "D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\playtest\server\src\main\resources\config"
mkdir -p "D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\playtest\server\gradle\wrapper"
mkdir -p "D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\playtest\client"
```

On Windows PowerShell:
```powershell
$base = "D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\playtest"
New-Item -ItemType Directory -Force -Path "$base\server\src\main\kotlin\playtest"
New-Item -ItemType Directory -Force -Path "$base\server\src\main\resources\config"
New-Item -ItemType Directory -Force -Path "$base\server\gradle\wrapper"
New-Item -ItemType Directory -Force -Path "$base\client"
```

- [ ] **Step 1.2: Verify directories exist**

Expected: all 4 directories created without error.

---

### Task 2: Write build.gradle.kts

**Files:**
- Create: `playtest/server/build.gradle.kts`

- [ ] **Step 2.1: Write build.gradle.kts**

Create `D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\playtest\server\build.gradle.kts`:

```kotlin
plugins {
    kotlin("jvm") version "2.3.0"
    kotlin("plugin.serialization") version "2.3.0"
    application
}

group = "playtest"
version = "1.0.0"

repositories {
    mavenCentral()
}

val ktorVersion = "3.4.0"
val coroutinesVersion = "1.9.0"
val serializationVersion = "1.7.3"

dependencies {
    implementation("io.ktor:ktor-server-core:$ktorVersion")
    implementation("io.ktor:ktor-server-netty:$ktorVersion")
    implementation("io.ktor:ktor-server-websockets:$ktorVersion")
    implementation("io.ktor:ktor-server-content-negotiation:$ktorVersion")
    implementation("io.ktor:ktor-serialization-kotlinx-json:$ktorVersion")
    implementation("io.ktor:ktor-server-cors:$ktorVersion")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:$coroutinesVersion")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:$serializationVersion")
    implementation("ch.qos.logback:logback-classic:1.4.14")
}

application {
    mainClass.set("playtest.MainKt")
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(17))
    }
}
```

---

### Task 3: Write settings.gradle.kts

**Files:**
- Create: `playtest/server/settings.gradle.kts`

- [ ] **Step 3.1: Write settings.gradle.kts**

```kotlin
rootProject.name = "elemental-hunter-playtest"
```

---

### Task 4: Copy Gradle Wrapper

**Files:**
- Copy: `demo-main/serverccn2/gradlew` → `playtest/server/gradlew`
- Copy: `demo-main/serverccn2/gradlew.bat` → `playtest/server/gradlew.bat`
- Copy: `demo-main/serverccn2/gradle/wrapper/gradle-wrapper.jar` → `playtest/server/gradle/wrapper/gradle-wrapper.jar`
- Copy: `demo-main/serverccn2/gradle/wrapper/gradle-wrapper.properties` → `playtest/server/gradle/wrapper/gradle-wrapper.properties`

- [ ] **Step 4.1: Copy gradlew files**

Source root: `D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\demo-main\serverccn2\`
Dest root: `D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\playtest\server\`

PowerShell:
```powershell
$src = "D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\demo-main\serverccn2"
$dst = "D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\playtest\server"
Copy-Item "$src\gradlew" "$dst\gradlew"
Copy-Item "$src\gradlew.bat" "$dst\gradlew.bat"
Copy-Item "$src\gradle\wrapper\gradle-wrapper.jar" "$dst\gradle\wrapper\gradle-wrapper.jar"
Copy-Item "$src\gradle\wrapper\gradle-wrapper.properties" "$dst\gradle\wrapper\gradle-wrapper.properties"
```

- [ ] **Step 4.2: Verify files exist**

```powershell
ls "D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\playtest\server\gradle\wrapper\"
```

Expected: `gradle-wrapper.jar`, `gradle-wrapper.properties` listed.

- [ ] **Step 4.3: Check Gradle wrapper is compatible with Kotlin 2.3.0**

```powershell
Get-Content "D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\playtest\server\gradle\wrapper\gradle-wrapper.properties"
```

Check the `distributionUrl` line. Kotlin 2.3.0 requires **Gradle 8.6+**. If the wrapper uses Gradle < 8.6, update the line:
```
distributionUrl=https\://services.gradle.org/distributions/gradle-8.10.2-bin.zip
```

---

### Task 5: Repackage 10 Game Logic Files

Source dir: `D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\ccn2_workspace\src\server\elemental-hunter\`
Dest dir: `D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\playtest\server\src\main\kotlin\playtest\`

Files to repackage (10 files — logic unchanged, package declaration only):
- `BoardBuilder.kt`, `CombatEngine.kt`, `ElementEngine.kt`, `ArtifactHandler.kt`
- `MovementValidator.kt`, `RNGService.kt`
- `GameConfig.kt`, `BalanceConfig.kt`, `CharacterConfig.kt`, `LevelConfig.kt`

**Files:**
- Create: `playtest/server/src/main/kotlin/playtest/BoardBuilder.kt` (repackaged)
- Create: `playtest/server/src/main/kotlin/playtest/CombatEngine.kt` (repackaged)
- ... (all 10)

- [ ] **Step 5.1: Copy + repackage each file**

For each file, the changes are:
- Line 1: `package com.ccn2.server.elementalhunter` → `package playtest`
- Remove ALL imports from `com.ccn2.server.elementalhunter` (both wildcard `.*` and named `import com.ccn2...ClassName`)
- All other code stays identical

PowerShell script to handle both wildcard and named imports:
```powershell
$srcDir = "D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\ccn2_workspace\src\server\elemental-hunter"
$dstDir = "D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\playtest\server\src\main\kotlin\playtest"

$files = @(
    "BoardBuilder.kt", "CombatEngine.kt", "ElementEngine.kt", "ArtifactHandler.kt",
    "MovementValidator.kt", "RNGService.kt",
    "GameConfig.kt", "BalanceConfig.kt", "CharacterConfig.kt", "LevelConfig.kt"
)

foreach ($f in $files) {
    $content = Get-Content "$srcDir\$f" -Raw
    # Fix package declaration
    $content = $content -replace 'package com\.ccn2\.server\.elementalhunter', 'package playtest'
    # Remove ALL imports from the old package (wildcard and named)
    $content = $content -replace 'import com\.ccn2\.server\.elementalhunter[^\n]*\n', ''
    Set-Content "$dstDir\$f" $content -NoNewline
    Write-Host "Repackaged: $f"
}
```

> **After running**: manually inspect each file for any remaining `com.ccn2` references:
```powershell
Select-String -Path "$dstDir\*.kt" -Pattern "com\.ccn2"
```
Expected: no matches.

> ⚠️ Do NOT copy: `GameRoom.kt`, `GameRoomManager.kt`, `ElementalHunterModule.kt`, `ElementalHunterRequestHandler.kt`, `ElementalHunterEventListener.kt` — these will be rewritten or not used.

- [ ] **Step 5.2: Verify package declaration in each file**

```powershell
Select-String -Path "$dstDir\*.kt" -Pattern "^package"
```

Expected: all 10 files show `package playtest`.

---

### Task 5.5: Create Types.kt (Shared Type Definitions)

**Files:**
- Create: `playtest/server/src/main/kotlin/playtest/Types.kt`

> **Why**: The original `GameRoom.kt` (which we are REWRITING, not repackaging) contained all shared enums and data classes at the bottom. The repackaged files (`BoardBuilder.kt`, `CombatEngine.kt`, etc.) reference these types. They must be available in `package playtest`.
>
> **Critical**: The original `TileType` enum is `ELEMENTAL, EMPTY, SAFE_ZONE, START, NORMAL` — but `BoardBuilder.kt` uses `TileType.FINAL_GOAL` which does NOT exist in the original. Add `FINAL_GOAL` to fix this generated-code bug.

- [ ] **Step 5.5.1: Write Types.kt**

```kotlin
package playtest

import kotlinx.serialization.Serializable

// ========== Enums ==========

@Serializable
enum class GamePhase { LOBBY, PLAYING, ENDED }

@Serializable
enum class TileType {
    ELEMENTAL, EMPTY, SAFE_ZONE, START, NORMAL,
    FINAL_GOAL  // ← added: referenced by BoardBuilder.kt but missing from original enum
}

@Serializable
enum class ElementType { FIRE, ICE, GRASS, ROCK }

@Serializable
enum class ArtifactType { SWAP, CHANGE, CHARGE }

@Serializable
enum class ComboType { C3, C4 }

@Serializable
enum class EndReason { KO, ROUND_LIMIT }

// ========== Core Data Models ==========

@Serializable
data class TileState(
    val tileId: Int,
    val tileType: TileType,
    val baseElement: ElementType?,
    val currentElement: ElementType?
)

@Serializable
data class TokenState(
    val tokenId: String,
    val owner: String,
    val tileId: Int,
    val atk: Int,
    val frozenRounds: Int
)

// NOTE: NOT @Serializable — PlayerState is never sent directly over WS.
// Pair<Int,Int> has no built-in kotlinx.serialization serializer; adding @Serializable would cause compile error.
data class PlayerState(
    val playerId: String,
    val hp: Int,
    val mag: Int,
    val magCap: Int,
    val elementQueue: ArrayDeque<ElementType>,
    val elementAffinity: ElementType,
    val comboCount: Int,
    val comboTier: Int,
    val tileGainMultiplier: Int,
    val doubleRollCooldown: Int,
    val consecutiveRollsThisTurn: Int,
    val ultimateExtraRolls: Int,
    val emptyTileVisits: Int,
    val kickCount: Int,
    val finishedHorseCount: Int,
    val selectedTokenId: String?,
    val lastDiceResult: Pair<Int, Int>?  // kotlin.Pair not serializable — keep as is, not serialized directly
)

@Serializable
data class ComboRewards(val atkBonus: Int = 0, val magBonus: Int = 0)
```

> **Note on duplicates**: `GameConfig.kt`, `BalanceConfig.kt`, `CharacterConfig.kt`, `LevelConfig.kt` also define some of these — the repackaged files will be the authoritative source for config classes. `Types.kt` only defines game-state types. If the repackaged config files re-declare `ElementType` etc., remove the duplicate from Types.kt (keep Types.kt as the single source).

- [ ] **Step 5.5.2: Verify no duplicate class definitions**

```powershell
Select-String -Path "$dstDir\*.kt" -Pattern "^enum class ElementType" | Select-Object -Property Path,Line
```

Expected: exactly ONE file defines each enum. If duplicates appear, remove from the config `.kt` files and keep only `Types.kt`.

---

### Task 6: Copy Config JSON Files

**Files:**
- Copy: `ccn2_workspace/src/server/elemental-hunter/config/balance.json` → `playtest/server/src/main/resources/config/balance.json`
- Copy: `character.json`, `level.json` similarly

- [ ] **Step 6.1: Copy JSON configs**

```powershell
$srcConfig = "D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\ccn2_workspace\src\server\elemental-hunter\config"
$dstConfig = "D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\playtest\server\src\main\resources\config"

Copy-Item "$srcConfig\balance.json"   "$dstConfig\balance.json"
Copy-Item "$srcConfig\character.json" "$dstConfig\character.json"
Copy-Item "$srcConfig\level.json"     "$dstConfig\level.json"
```

- [ ] **Step 6.2: Update GameConfig.kt to load from classpath**

Open `playtest/server/src/main/kotlin/playtest/GameConfig.kt`. Find the file loading path — if it uses a hardcoded path like `File("config/balance.json")`, update it to load from classpath:

```kotlin
// Replace file-based loading with:
private fun loadFromClasspath(name: String): String {
    return object {}.javaClass.classLoader
        .getResourceAsStream("config/$name")
        ?.bufferedReader()?.readText()
        ?: error("Config not found: config/$name")
}
```

> If `GameConfig.kt` already loads from classpath or the path is relative, no change needed. Verify by reading the file first.

---

### Task 7: First Compile Check

- [ ] **Step 7.1: Run gradle compileKotlin**

```bash
cd D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\playtest\server
gradlew.bat compileKotlin
```

- [ ] **Step 7.2: Fix any compile errors**

Common issues:
- Missing imports in repackaged files: add `import playtest.*` if needed
- `logger` reference in GameRoom: it's not included (GameRoom.kt is rewritten, not repackaged)
- Type mismatches between repackaged files: check if any file imports `com.ccn2.*` that wasn't cleaned

- [ ] **Step 7.3: Commit scaffold**

```bash
cd D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan
git add playtest/server/build.gradle.kts playtest/server/settings.gradle.kts
git add playtest/server/gradle/ playtest/server/gradlew playtest/server/gradlew.bat
git add playtest/server/src/main/kotlin/playtest/*.kt
git add playtest/server/src/main/resources/config/
git commit -m "feat: playtest server scaffold + repackaged game logic"
```

---

## Chunk 2: Server Implementation

### Task 8: Write WsMessage.kt (Protocol DTOs)

**Files:**
- Create: `playtest/server/src/main/kotlin/playtest/WsMessage.kt`

This file defines the JSON protocol between client and server.

- [ ] **Step 8.1: Write WsMessage.kt**

```kotlin
package playtest

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*

// ===== Client → Server =====

@Serializable
data class ClientMessage(
    val action: String,
    val playerId: String,
    val tokenId: String? = null,
    val steps: Int? = null
)

// ===== Server → Client =====

@Serializable
data class ServerMessage(
    val event: String,
    val data: JsonObject
)

// Helper builders for each event type

object ServerEvents {
    private val json = Json { encodeDefaults = true }

    fun gameState(room: Map<String, Any?>, players: List<Map<String, Any?>>, board: List<Map<String, Any?>>): String =
        json.encodeToString(ServerMessage.serializer(), ServerMessage(
            event = "GAME_STATE",
            data = buildJsonObject {
                put("room", Json.encodeToJsonElement(room.toJsonObject()))
                put("players", JsonArray(players.map { it.toJsonObject() }))
                put("board", JsonArray(board.map { it.toJsonObject() }))
            }
        ))

    fun diceResult(playerId: String, dice: List<Int>, sum: Int, isDouble: Boolean): String =
        Json.encodeToString(ServerMessage.serializer(), ServerMessage(
            event = "DICE_RESULT",
            data = buildJsonObject {
                put("playerId", playerId)
                put("dice", JsonArray(dice.map { JsonPrimitive(it) }))
                put("sum", sum)
                put("isDouble", isDouble)
            }
        ))

    fun tokenSelected(playerId: String, tokenId: String): String =
        Json.encodeToString(ServerMessage.serializer(), ServerMessage(
            event = "TOKEN_SELECTED",
            data = buildJsonObject {
                put("playerId", playerId)
                put("tokenId", tokenId)
            }
        ))

    fun moveResult(playerId: String, tokenId: String, from: Int, to: Int): String =
        Json.encodeToString(ServerMessage.serializer(), ServerMessage(
            event = "MOVE_RESULT",
            data = buildJsonObject {
                put("playerId", playerId)
                put("tokenId", tokenId)
                put("from", from)
                put("to", to)
            }
        ))

    fun kick(kickerId: String, kickedId: String, tokenId: String, returnedTo: Int): String =
        Json.encodeToString(ServerMessage.serializer(), ServerMessage(
            event = "KICK",
            data = buildJsonObject {
                put("kickerId", kickerId)
                put("kickedId", kickedId)
                put("tokenId", tokenId)
                put("returnedTo", returnedTo)
            }
        ))

    fun turnChange(currentPlayer: String): String =
        Json.encodeToString(ServerMessage.serializer(), ServerMessage(
            event = "TURN_CHANGE",
            data = buildJsonObject { put("currentPlayer", currentPlayer) }
        ))

    fun win(winnerId: String): String =
        Json.encodeToString(ServerMessage.serializer(), ServerMessage(
            event = "WIN",
            data = buildJsonObject { put("winnerId", winnerId) }
        ))

    fun error(message: String): String =
        Json.encodeToString(ServerMessage.serializer(), ServerMessage(
            event = "ERROR",
            data = buildJsonObject { put("message", message) }
        ))
}

// Extension to convert Map<String, Any?> → JsonObject (shallow)
private fun Map<String, Any?>.toJsonObject(): JsonObject = buildJsonObject {
    this@toJsonObject.forEach { (k, v) ->
        when (v) {
            null -> put(k, JsonNull)
            is String -> put(k, v)
            is Int -> put(k, v)
            is Long -> put(k, v)
            is Double -> put(k, v)
            is Boolean -> put(k, v)
            else -> put(k, v.toString())
        }
    }
}
```

---

### Task 9: Write GameRoom.kt (Rewritten Actor)

**Files:**
- Create: `playtest/server/src/main/kotlin/playtest/GameRoom.kt`

This is a full rewrite — no bitzero-kotlin. Uses coroutine Channel actor pattern with direct WS broadcast via callback.

- [ ] **Step 9.1: Write GameRoom.kt**

```kotlin
package playtest

import io.ktor.websocket.*
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*
import kotlin.random.Random

/**
 * GameRoom - Standalone actor for one Elemental Hunter match.
 * Processes commands serially via Channel. Broadcasts to WS sessions via broadcastFn.
 */
class GameRoom(
    val roomId: String,
    private val config: GameConfig,
    private val broadcastFn: suspend (String) -> Unit,
    private val rng: Random = Random.Default
) : CoroutineScope by CoroutineScope(Dispatchers.Default + SupervisorJob()) {

    // Command sealed class (simplified for playtest)
    sealed class Cmd {
        data class Join(val playerId: String) : Cmd()
        data class RollDice(val playerId: String) : Cmd()
        data class SelectToken(val playerId: String, val tokenId: String) : Cmd()
        data class Move(val playerId: String) : Cmd()
    }

    private val cmdChannel = Channel<Cmd>(Channel.UNLIMITED)
    val playerIds = mutableListOf<String>()

    // Simple in-memory game state for playtest
    private var phase = "LOBBY"
    private var currentTurn: String? = null
    private var lastRoll: Int = 0
    private val tokens = mutableMapOf<String, MutableMap<String, Int>>() // playerId → {tokenId → tileId}
    private val playerHp = mutableMapOf<String, Int>()
    private val selectedToken = mutableMapOf<String, String?>() // playerId → selected tokenId

    init {
        launch { processCommands() }
    }

    fun submit(cmd: Cmd) { cmdChannel.trySend(cmd) }

    private suspend fun processCommands() {
        for (cmd in cmdChannel) {
            try {
                when (cmd) {
                    is Cmd.Join          -> handleJoin(cmd.playerId)
                    is Cmd.RollDice      -> handleRollDice(cmd.playerId)
                    is Cmd.SelectToken   -> handleSelectToken(cmd.playerId, cmd.tokenId)
                    is Cmd.Move          -> handleMove(cmd.playerId)
                }
            } catch (e: Exception) {
                broadcastFn(ServerEvents.error(e.message ?: "Unknown error"))
            }
        }
    }

    private suspend fun handleJoin(playerId: String) {
        if (playerIds.contains(playerId)) return // reconnect OK
        if (playerIds.size >= 2) {
            broadcastFn(ServerEvents.error("Room full"))
            return
        }
        playerIds.add(playerId)
        // Init tokens at start positions
        val startTile = if (playerIds.size == 1) 51 else 0
        tokens[playerId] = mutableMapOf("tokenA" to startTile, "tokenB" to startTile + 1)
        playerHp[playerId] = 100
        selectedToken[playerId] = null

        broadcastGameState()

        if (playerIds.size == 2) {
            phase = "PLAYING"
            currentTurn = playerIds[0]
            broadcastGameState()
        }
    }

    private suspend fun handleRollDice(playerId: String) {
        require(phase == "PLAYING") { "Game not started" }
        require(currentTurn == playerId) { "Not your turn" }

        val d1 = rng.nextInt(1, 7)
        val d2 = rng.nextInt(1, 7)
        lastRoll = d1 + d2
        val isDouble = d1 == d2

        broadcastFn(ServerEvents.diceResult(playerId, listOf(d1, d2), lastRoll, isDouble))
    }

    private suspend fun handleSelectToken(playerId: String, tokenId: String) {
        require(phase == "PLAYING") { "Game not started" }
        require(currentTurn == playerId) { "Not your turn" }

        val playerTokens = tokens[playerId] ?: throw IllegalStateException("Player not found")
        require(playerTokens.containsKey(tokenId)) { "Invalid token: $tokenId" }

        selectedToken[playerId] = tokenId
        broadcastFn(ServerEvents.tokenSelected(playerId, tokenId))
    }

    private suspend fun handleMove(playerId: String) {
        require(phase == "PLAYING") { "Game not started" }
        require(currentTurn == playerId) { "Not your turn" }
        require(lastRoll > 0) { "Must roll dice first" }

        val tokenId = selectedToken[playerId] ?: throw IllegalStateException("No token selected")
        val playerTokens = tokens[playerId] ?: throw IllegalStateException("Player not found")
        val fromTile = playerTokens[tokenId] ?: throw IllegalStateException("Token not found")

        // Simple linear movement (wrap at 60)
        val toTile = (fromTile + lastRoll) % 61
        playerTokens[tokenId] = toTile

        broadcastFn(ServerEvents.moveResult(playerId, tokenId, fromTile, toTile))

        // Check kick: opponent token on same tile?
        val opponentId = playerIds.first { it != playerId }
        val opponentTokens = tokens[opponentId] ?: emptyMap()
        val board = BoardBuilder.buildBoard()
        val isSafe = board.find { it.tileId == toTile }?.tileType == TileType.SAFE_ZONE

        if (!isSafe) {
            opponentTokens.forEach { (opTokId, opTile) ->
                if (opTile == toTile) {
                    // Kick: return opponent token to start
                    val returnTo = if (opponentId == playerIds[0]) 51 else 0
                    (tokens[opponentId] as MutableMap)[opTokId] = returnTo
                    broadcastFn(ServerEvents.kick(playerId, opponentId, opTokId, returnTo))
                }
            }
        }

        // Check win: reached FINAL_GOAL tile
        val tileType = board.find { it.tileId == toTile }?.tileType
        if (tileType == TileType.FINAL_GOAL) {
            phase = "DONE"
            broadcastFn(ServerEvents.win(playerId))
            return
        }

        // Advance turn
        selectedToken[playerId] = null
        lastRoll = 0
        currentTurn = opponentId
        broadcastFn(ServerEvents.turnChange(opponentId))
    }

    private suspend fun broadcastGameState() {
        val boardTiles = BoardBuilder.buildBoard().map { tile ->
            mapOf(
                "tileId" to tile.tileId,
                "tileType" to tile.tileType.name,
                "element" to (tile.baseElement?.name ?: "NONE")
            )
        }

        val playersData = playerIds.map { pid ->
            val toks = tokens[pid] ?: emptyMap()
            mapOf(
                "playerId" to pid,
                "hp" to (playerHp[pid] ?: 100),
                "tokens" to toks.entries.joinToString(";") { "${it.key}:${it.value}" }
            )
        }

        val roomData = mapOf(
            "roomId" to roomId,
            "phase" to phase,
            "currentTurn" to (currentTurn ?: ""),
            "playerCount" to playerIds.size
        )

        broadcastFn(ServerEvents.gameState(roomData, playersData, boardTiles))
    }

    fun close() {
        cmdChannel.close()
        cancel()
    }
}
```

> **Note on simplification**: `handleMove` uses linear wrap-around movement instead of the full `MovementValidator.computePath()`. This is intentional for playtest — the complex path logic (branch points, goal paths) is preserved in repackaged files and can be wired in after initial verification.

---

### Task 10: Write GameRoomManager.kt

**Files:**
- Create: `playtest/server/src/main/kotlin/playtest/GameRoomManager.kt`

- [ ] **Step 10.1: Write GameRoomManager.kt**

```kotlin
package playtest

import io.ktor.websocket.*
import java.util.concurrent.ConcurrentHashMap

/**
 * GameRoomManager - Thread-safe room registry + WebSocket session registry.
 */
object GameRoomManager {

    // Room registry
    private val rooms = ConcurrentHashMap<String, GameRoom>()

    // Session registry: roomId → list of active WebSocket sessions
    private val sessions = ConcurrentHashMap<String, MutableList<DefaultWebSocketSession>>()

    // Player → session mapping per room: "roomId:playerId" → session
    private val playerSessions = ConcurrentHashMap<String, DefaultWebSocketSession>()

    fun getOrCreateRoom(roomId: String, config: GameConfig): GameRoom {
        return rooms.getOrPut(roomId) {
            GameRoom(
                roomId = roomId,
                config = config,
                broadcastFn = { message -> broadcast(roomId, message) }
            )
        }
    }

    fun getRoom(roomId: String): GameRoom? = rooms[roomId]

    fun getRoomList(): List<Map<String, Any>> = rooms.map { (id, room) ->
        mapOf("roomId" to id, "playerCount" to room.playerIds.size)
    }

    fun registerSession(roomId: String, playerId: String, session: DefaultWebSocketSession) {
        sessions.getOrPut(roomId) { java.util.Collections.synchronizedList(mutableListOf()) }
            .add(session)
        playerSessions["$roomId:$playerId"] = session
    }

    fun unregisterSession(roomId: String, playerId: String, session: DefaultWebSocketSession) {
        sessions[roomId]?.remove(session)
        playerSessions.remove("$roomId:$playerId")

        // Cleanup empty rooms
        if (sessions[roomId]?.isEmpty() == true) {
            sessions.remove(roomId)
            rooms.remove(roomId)?.close()
            println("[GameRoomManager] Room $roomId cleaned up")
        }
    }

    private suspend fun broadcast(roomId: String, message: String) {
        val roomSessions = sessions[roomId] ?: return
        val deadSessions = mutableListOf<DefaultWebSocketSession>()

        for (session in roomSessions.toList()) {
            try {
                session.send(Frame.Text(message))
            } catch (e: Exception) {
                println("[GameRoomManager] Failed to send to session in $roomId: ${e.message}")
                deadSessions.add(session)
            }
        }
        roomSessions.removeAll(deadSessions)
    }
}
```

---

### Task 11: Write Main.kt

**Files:**
- Create: `playtest/server/src/main/kotlin/playtest/Main.kt`

- [ ] **Step 11.1: Write Main.kt**

```kotlin
package playtest

import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.websocket.*
import kotlinx.serialization.json.*
import java.time.Duration

fun main() {
    embeddedServer(Netty, port = 8181, host = "0.0.0.0") {
        configureCors()
        install(WebSockets) {
            pingPeriod = Duration.ofSeconds(15)
            timeout = Duration.ofSeconds(15)
            maxFrameSize = Long.MAX_VALUE
            masking = false
        }
        install(ContentNegotiation) {
            json(Json { prettyPrint = true; isLenient = true })
        }
        configureRouting()
    }.start(wait = true)
}

private fun Application.configureCors() {
    // Allow all origins for local playtest
    install(io.ktor.server.plugins.cors.routing.CORS) {
        anyHost()
        allowHeader(io.ktor.http.HttpHeaders.ContentType)
    }
}

private fun Application.configureRouting() {
    val config = GameConfig.default()  // GameConfig.kt only has default(), not load()

    routing {

        // Health check
        get("/health") {
            call.respondText("OK")
        }

        // List rooms
        get("/game/rooms") {
            val rooms = GameRoomManager.getRoomList()
            call.respond(rooms)
        }

        // Create room
        post("/game/rooms/{roomId}") {
            val roomId = call.parameters["roomId"] ?: return@post call.respondText("Missing roomId", status = io.ktor.http.HttpStatusCode.BadRequest)
            GameRoomManager.getOrCreateRoom(roomId, config)
            call.respondText("Room $roomId created", status = io.ktor.http.HttpStatusCode.Created)
        }

        // WebSocket game session
        webSocket("/game/ws/{roomId}/{playerId}") {
            val roomId = call.parameters["roomId"] ?: return@webSocket close(CloseReason(CloseReason.Codes.VIOLATED_POLICY, "Missing roomId"))
            val playerId = call.parameters["playerId"] ?: return@webSocket close(CloseReason(CloseReason.Codes.VIOLATED_POLICY, "Missing playerId"))

            println("[WS] $playerId joined room $roomId")

            val room = GameRoomManager.getOrCreateRoom(roomId, config)
            GameRoomManager.registerSession(roomId, playerId, this)

            // Auto-join
            room.submit(GameRoom.Cmd.Join(playerId))

            try {
                for (frame in incoming) {
                    if (frame is Frame.Text) {
                        val text = frame.readText()
                        handleClientMessage(room, playerId, text)
                    }
                }
            } catch (e: Exception) {
                println("[WS] Error in session $playerId@$roomId: ${e.message}")
            } finally {
                println("[WS] $playerId left room $roomId")
                GameRoomManager.unregisterSession(roomId, playerId, this)
            }
        }
    }
}

private suspend fun handleClientMessage(room: GameRoom, playerId: String, text: String) {
    try {
        val json = Json.parseToJsonElement(text).jsonObject
        val action = json["action"]?.jsonPrimitive?.content ?: return

        when (action) {
            // JOIN is handled automatically on WS connect via handleJoin in the WS block.
            // Ignore explicit JOIN messages to avoid double-join race condition.
            "JOIN"         -> { /* no-op: server auto-joins on WS connect */ }
            "ROLL_DICE"    -> room.submit(GameRoom.Cmd.RollDice(playerId))
            "SELECT_TOKEN" -> {
                val tokenId = json["tokenId"]?.jsonPrimitive?.content ?: return
                room.submit(GameRoom.Cmd.SelectToken(playerId, tokenId))
            }
            "MOVE"         -> room.submit(GameRoom.Cmd.Move(playerId))
            else           -> println("[WS] Unknown action: $action from $playerId")
        }
    } catch (e: Exception) {
        println("[WS] Failed to parse message from $playerId: ${e.message} — raw: $text")
    }
}
```

---

### Task 12: Run Server + Smoke Test

- [ ] **Step 12.1: Build and run**

```bash
cd D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\playtest\server
gradlew.bat run
```

Expected output:
```
[main] INFO  ktor.application - Responding at http://0.0.0.0:8181
```

- [ ] **Step 12.2: Test health endpoint**

Open browser: `http://localhost:8181/health`
Expected: `OK`

Or curl:
```bash
curl http://localhost:8181/health
```

- [ ] **Step 12.3: Test room creation**

```bash
curl -X POST http://localhost:8181/game/rooms/room1
# Expected: Room room1 created

curl http://localhost:8181/game/rooms
# Expected: [{"roomId":"room1","playerCount":0}]
```

- [ ] **Step 12.4: Fix compile errors if any**

Common issues:
- `GameConfig.load()` — check if `GameConfig.kt` has a `load()` companion method; if not, use `GameConfig()` or `GameConfig.default()`
- CORS plugin import: may need `implementation("io.ktor:ktor-server-cors:$ktorVersion")` in build.gradle.kts
- `logger` in repackaged files: replace `logger.error(...)` with `println(...)` for playtest

- [ ] **Step 12.5: Commit server**

```bash
git add playtest/server/src/main/kotlin/playtest/
git commit -m "feat: playtest Ktor server (Main, GameRoom, GameRoomManager, WsMessage)"
```

---

## Chunk 3: Web Client

### Task 13: Write index.html

**Files:**
- Create: `playtest/client/index.html`

This is a single self-contained file: HTML + CSS + JS, no build step.

- [ ] **Step 13.1: Write index.html**

Create `D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\playtest\client\index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>🎮 Elemental Hunter Playtest</title>
<style>
  :root {
    --bg: #0f172a; --surface: #1e293b; --border: #334155;
    --primary: #6366f1; --success: #22c55e; --warn: #f59e0b;
    --danger: #ef4444; --text: #f1f5f9; --muted: #94a3b8;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--text); font-family: monospace; height: 100vh; display: flex; flex-direction: column; }

  header { background: var(--surface); padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); }
  header h1 { font-size: 16px; }
  #status { font-size: 13px; display: flex; align-items: center; gap: 6px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--danger); }
  .dot.connected { background: var(--success); }

  main { flex: 1; display: grid; grid-template-columns: 1fr 320px; grid-template-rows: 1fr 160px; gap: 0; overflow: hidden; }

  #board-container { grid-row: 1/3; background: var(--bg); display: flex; align-items: center; justify-content: center; border-right: 1px solid var(--border); padding: 10px; }
  canvas { border: 1px solid var(--border); border-radius: 4px; }

  #info-panel { background: var(--surface); border-bottom: 1px solid var(--border); padding: 12px; overflow-y: auto; }
  #log-panel { background: var(--bg); padding: 12px; overflow-y: auto; border-top: 1px solid var(--border); }

  .player-card { background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 8px; margin-bottom: 8px; font-size: 12px; }
  .player-card.active { border-color: var(--primary); }
  .player-card h3 { font-size: 13px; margin-bottom: 4px; }
  .player-card .row { display: flex; justify-content: space-between; margin-top: 2px; }

  #controls { padding: 10px 12px; border-top: 1px solid var(--border); background: var(--surface); display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  button { background: var(--primary); color: white; border: none; border-radius: 4px; padding: 6px 12px; font-family: monospace; font-size: 12px; cursor: pointer; transition: opacity 0.2s; }
  button:hover { opacity: 0.85; }
  button:disabled { opacity: 0.3; cursor: not-allowed; }
  button.secondary { background: var(--surface); border: 1px solid var(--border); }

  .log-entry { font-size: 11px; color: var(--muted); margin-bottom: 2px; }
  .log-entry .time { color: var(--primary); margin-right: 6px; }
  .log-entry.event { color: var(--text); }
  .log-entry.error { color: var(--danger); }
  .log-entry.win { color: var(--warn); font-weight: bold; }

  #connect-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 100; }
  #connect-box { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 24px; width: 320px; }
  #connect-box h2 { margin-bottom: 16px; font-size: 16px; }
  #connect-box label { display: block; font-size: 12px; color: var(--muted); margin-bottom: 4px; }
  #connect-box input { width: 100%; background: var(--bg); border: 1px solid var(--border); color: var(--text); padding: 7px 10px; border-radius: 4px; font-family: monospace; margin-bottom: 12px; }
  #connect-box button { width: 100%; padding: 10px; font-size: 14px; }
</style>
</head>
<body>

<!-- Connection modal -->
<div id="connect-overlay">
  <div id="connect-box">
    <h2>🎮 Elemental Hunter</h2>
    <label>Room ID</label>
    <input id="inp-room" type="text" value="room1" placeholder="room1">
    <label>Player ID</label>
    <input id="inp-player" type="text" value="p1" placeholder="p1 or p2">
    <button onclick="connect()">Connect</button>
  </div>
</div>

<header>
  <h1>🎮 Elemental Hunter Playtest</h1>
  <div id="status">
    <div class="dot" id="dot"></div>
    <span id="status-text">Disconnected</span>
  </div>
</header>

<main>
  <div id="board-container">
    <canvas id="board" width="540" height="540"></canvas>
  </div>

  <div id="info-panel">
    <div id="players-area"></div>
    <div id="turn-indicator" style="font-size:13px; margin-top:8px; color: var(--warn);"></div>
  </div>

  <div id="log-panel">
    <div id="log"></div>
  </div>
</main>

<div id="controls" style="display:none">
  <button id="btn-roll" onclick="sendRoll()" disabled>🎲 Roll Dice</button>
  <button id="btn-tokenA" onclick="sendSelect('tokenA')" disabled>Select Token A</button>
  <button id="btn-tokenB" onclick="sendSelect('tokenB')" disabled>Select Token B</button>
  <button id="btn-move" onclick="sendMove()" disabled>▶ Move</button>
  <span id="roll-display" style="color:var(--warn); font-size:13px;"></span>
</div>

<script>
// ===== State =====
let ws = null;
let myPlayerId = '';
let gameState = { phase: 'LOBBY', currentTurn: '', players: [], board: [] };
let lastRoll = 0;
let selectedToken = null;

// ===== Connection =====
function connect() {
  const roomId = document.getElementById('inp-room').value.trim() || 'room1';
  myPlayerId = document.getElementById('inp-player').value.trim() || 'p1';

  ws = new WebSocket(`ws://localhost:8181/game/ws/${roomId}/${myPlayerId}`);

  ws.onopen = () => {
    setStatus(true);
    log('Connected to ' + roomId + ' as ' + myPlayerId, 'event');
    document.getElementById('connect-overlay').style.display = 'none';
    document.getElementById('controls').style.display = 'flex';
    // NOTE: Server auto-triggers JOIN on WS connect. Do NOT send explicit JOIN here
    // to avoid double-JOIN race condition corrupting playerIds list.
    // The server's handleJoin() is idempotent for same playerId but not for duplicate slot filling.
  };

  ws.onclose = () => { setStatus(false); log('Disconnected', 'error'); };
  ws.onerror = (e) => { log('WS Error: ' + e.message, 'error'); };

  ws.onmessage = (evt) => {
    try {
      const msg = JSON.parse(evt.data);
      handleEvent(msg);
    } catch(e) { log('Parse error: ' + e, 'error'); }
  };
}

function send(obj) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}

// ===== Event Handling =====
function handleEvent(msg) {
  const { event, data } = msg;
  switch (event) {
    case 'GAME_STATE':
      gameState = { ...data };
      renderPlayers(data.players, data.room);
      renderBoard(data.board, data.players);
      updateControls(data.room);
      log(`Game state updated — phase: ${data.room?.phase}, turn: ${data.room?.currentTurn}`, 'event');
      break;
    case 'DICE_RESULT':
      lastRoll = data.sum;
      document.getElementById('roll-display').textContent = `🎲 Rolled: ${data.dice?.join('+')} = ${data.sum}${data.isDouble ? ' (Double!)' : ''}`;
      log(`${data.playerId} rolled ${data.sum}${data.isDouble ? ' (double)' : ''}`, 'event');
      if (data.playerId === myPlayerId) {
        document.getElementById('btn-tokenA').disabled = false;
        document.getElementById('btn-tokenB').disabled = false;
      }
      break;
    case 'TOKEN_SELECTED':
      selectedToken = data.tokenId;
      log(`${data.playerId} selected ${data.tokenId}`, 'event');
      if (data.playerId === myPlayerId) {
        document.getElementById('btn-move').disabled = false;
      }
      break;
    case 'MOVE_RESULT':
      log(`${data.playerId} moved ${data.tokenId}: tile ${data.from} → ${data.to}`, 'event');
      break;
    case 'KICK':
      log(`⚔️ ${data.kickerId} kicked ${data.kickedId}'s ${data.tokenId} → back to tile ${data.returnedTo}`, 'event');
      break;
    case 'TURN_CHANGE':
      gameState.currentTurn = data.currentPlayer;
      document.getElementById('turn-indicator').textContent = `Turn: ${data.currentPlayer} ${data.currentPlayer === myPlayerId ? '← YOU' : ''}`;
      updateControls({ currentTurn: data.currentPlayer, phase: 'PLAYING' });
      lastRoll = 0;
      selectedToken = null;
      document.getElementById('roll-display').textContent = '';
      break;
    case 'WIN':
      log(`🏆 ${data.winnerId} WINS!`, 'win');
      disableAllControls();
      break;
    case 'ERROR':
      log(`Error: ${data.message}`, 'error');
      break;
  }
}

// ===== Controls =====
function sendRoll() { send({ action: 'ROLL_DICE', playerId: myPlayerId }); }
function sendSelect(tokenId) { send({ action: 'SELECT_TOKEN', playerId: myPlayerId, tokenId }); }
function sendMove() { send({ action: 'MOVE', playerId: myPlayerId }); }

function updateControls(room) {
  const isMyTurn = room?.currentTurn === myPlayerId && room?.phase === 'PLAYING';
  document.getElementById('btn-roll').disabled = !isMyTurn;
  document.getElementById('btn-tokenA').disabled = !isMyTurn || lastRoll === 0;
  document.getElementById('btn-tokenB').disabled = !isMyTurn || lastRoll === 0;
  document.getElementById('btn-move').disabled = !isMyTurn || selectedToken === null;
  document.getElementById('turn-indicator').textContent =
    room?.phase === 'PLAYING'
      ? `Turn: ${room.currentTurn} ${room.currentTurn === myPlayerId ? '← YOU' : ''}`
      : `Phase: ${room?.phase || '?'}`;
}

function disableAllControls() {
  ['btn-roll','btn-tokenA','btn-tokenB','btn-move'].forEach(id =>
    document.getElementById(id).disabled = true
  );
}

// ===== Players Panel =====
function renderPlayers(players, room) {
  const area = document.getElementById('players-area');
  if (!players?.length) { area.innerHTML = '<div style="color:var(--muted);font-size:12px">Waiting for players...</div>'; return; }

  area.innerHTML = players.map(p => {
    const isActive = room?.currentTurn === p.playerId;
    const tokens = p.tokens ? p.tokens.split(';').map(t => {
      const [tid, tile] = t.split(':');
      return `${tid}@tile${tile}`;
    }).join(' | ') : '?';
    return `
      <div class="player-card ${isActive ? 'active' : ''}">
        <h3>${p.playerId === myPlayerId ? '👤' : '🤖'} ${p.playerId} ${isActive ? '◀' : ''}</h3>
        <div class="row"><span>HP:</span><span>${p.hp}</span></div>
        <div class="row"><span>Tokens:</span><span>${tokens}</span></div>
      </div>`;
  }).join('');
}

// ===== Board Render (Canvas) =====
// 61 tiles (0-60) laid out in a 9x7 grid (cross shape approximation)
// Row  0 (y=0): blank, blank, tiles 20-24, blank, blank
// Row  1 (y=1): blank, blank, tiles 30-34, blank, blank
// Row  2 (y=2): tiles 0-9 | tiles 10-15 (center row) | tiles 51-60
// Row  3 (y=3): blank, blank, tiles 40-44, blank, blank
// Row  4 (y=4): blank, blank, tiles 50,51,52,53,54, blank
// (Simplified cross layout — visual approximation of BoardBuilder structure)

const TILE_GRID = buildTileGrid();

function buildTileGrid() {
  // Map tileId → {col, row} for canvas rendering
  const grid = {};
  // Top vertical arm: tiles 20-24 (col 4-8, row 0)
  [20,21,22,23,24].forEach((t,i) => grid[t] = {col: 4+i, row: 0});
  // Second vertical section: tiles 30-35 (col 3-8, row 1)
  [30,31,32,33,34,35].forEach((t,i) => grid[t] = {col: 3+i, row: 1});
  // Main horizontal: tiles 0-9 left arm (col 0-9, row 2)
  for (let t=0; t<=9; t++) grid[t] = {col: t, row: 2};
  // Main horizontal center: tiles 10-19 (col 0-9, row 3) -- actually row 2 continuation
  [10,11,12,13,14,15].forEach((t,i) => grid[t] = {col: i, row: 3});
  // Right arm tiles 51-60 (col 5-14... but keep to 12 cols)
  for (let t=51; t<=60; t++) grid[t] = {col: (t-51)+5, row: 2};
  // Lower: tiles 40-44 (col 4-8, row 4)
  [40,41,42,43,44].forEach((t,i) => grid[t] = {col: 4+i, row: 4});
  // Lower arm: tiles 50-54 area (col 3-7, row 5)
  [50].forEach((t,i) => grid[t] = {col: 3+i, row: 5});
  // Fill any remaining tiles in row 3 with sequential cols
  for (let t=0; t<=60; t++) {
    if (!grid[t]) grid[t] = {col: t % 12, row: Math.floor(t / 12) + 6};
  }
  return grid;
}

const TILE_COLORS = {
  'SAFE_ZONE':   '#854d0e',  // amber-800
  'ELEMENTAL':   '#1d4ed8',  // blue-700
  'FINAL_GOAL':  '#15803d',  // green-700
  'EMPTY':       '#374151',  // gray-700
  'NORMAL':      '#1e293b',  // slate-800
};

const ELEMENT_COLORS = {
  'FIRE': '#ef4444', 'ICE': '#60a5fa', 'GRASS': '#4ade80', 'ROCK': '#a8a29e', 'NONE': '#1d4ed8'
};

const PLAYER_COLORS = { p1: '#ef4444', p2: '#3b82f6' };

function renderBoard(board, players) {
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, W, H);

  if (!board?.length) { ctx.fillStyle = '#94a3b8'; ctx.font = '14px monospace'; ctx.fillText('Waiting for game state...', 20, H/2); return; }

  const COLS = 12, ROWS = 8;
  const TW = Math.floor(W / COLS), TH = Math.floor(H / ROWS);

  // Build token position map: tileId → [playerId tokens]
  const tokenMap = {};
  if (players) {
    players.forEach(p => {
      if (!p.tokens) return;
      p.tokens.split(';').forEach(t => {
        const [tid, tile] = t.split(':');
        const tileNum = parseInt(tile);
        if (!tokenMap[tileNum]) tokenMap[tileNum] = [];
        tokenMap[tileNum].push({ playerId: p.playerId, tokenId: tid });
      });
    });
  }

  board.forEach(tile => {
    const pos = TILE_GRID[tile.tileId];
    if (!pos) return;
    const x = pos.col * TW, y = pos.row * TH;

    // Tile background — SAFE_ZONE takes priority over ELEMENTAL color
    // (tiles 0-2 and 51-53 are both SAFE_ZONE and ELEMENTAL; show safe zone color)
    let tileColor;
    if (tile.tileType === 'SAFE_ZONE' || tile.tileType === 'FINAL_GOAL' || tile.tileType === 'EMPTY') {
      tileColor = TILE_COLORS[tile.tileType];
    } else {
      tileColor = (tile.element !== 'NONE' ? ELEMENT_COLORS[tile.element] : null) || TILE_COLORS[tile.tileType] || TILE_COLORS['NORMAL'];
    }
    ctx.fillStyle = tileColor;
    ctx.fillRect(x+1, y+1, TW-2, TH-2);

    // Tile border
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(x+1, y+1, TW-2, TH-2);

    // Tile ID
    ctx.fillStyle = '#94a3b8';
    ctx.font = `9px monospace`;
    ctx.fillText(tile.tileId, x+3, y+11);

    // Type icon
    if (tile.tileType === 'SAFE_ZONE') { ctx.fillStyle = '#fbbf24'; ctx.font = '10px monospace'; ctx.fillText('★', x+TW-14, y+12); }
    if (tile.tileType === 'FINAL_GOAL') { ctx.fillStyle = '#4ade80'; ctx.font = '10px monospace'; ctx.fillText('🏁', x+TW-16, y+12); }

    // Tokens on tile
    const toks = tokenMap[tile.tileId] || [];
    toks.forEach((tok, i) => {
      const cx = x + 8 + i * 12, cy = y + TH - 8;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI*2);
      ctx.fillStyle = PLAYER_COLORS[tok.playerId] || '#fff';
      ctx.fill();
    });
  });
}

// ===== Log =====
function log(msg, type='') {
  const el = document.getElementById('log');
  const time = new Date().toLocaleTimeString('en', {hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});
  const div = document.createElement('div');
  div.className = `log-entry ${type}`;
  div.innerHTML = `<span class="time">${time}</span>${msg}`;
  el.prepend(div);
  if (el.children.length > 100) el.removeChild(el.lastChild);
}

// ===== Status =====
function setStatus(connected) {
  document.getElementById('dot').className = 'dot' + (connected ? ' connected' : '');
  document.getElementById('status-text').textContent = connected ? 'Connected' : 'Disconnected';
}
</script>
</body>
</html>
```

---

### Task 14: End-to-End Playtest

- [ ] **Step 14.1: Start server**

```bash
cd D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\playtest\server
gradlew.bat run
```

Verify: `Responding at http://0.0.0.0:8181`

- [ ] **Step 14.2: Open Tab 1 (Player p1)**

Open `D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\playtest\client\index.html` in browser.
- Room ID: `room1`, Player ID: `p1`
- Click Connect
- Expected: "Connected" indicator, log shows "Connected to room1 as p1"

- [ ] **Step 14.3: Open Tab 2 (Player p2)**

Open same file in a new tab (or second browser).
- Room ID: `room1`, Player ID: `p2`
- Click Connect
- Expected: Both tabs receive `GAME_STATE` event, board renders with tiles

- [ ] **Step 14.4: Test Roll → Select → Move flow**

In p1's tab (it should be p1's turn):
1. Click [🎲 Roll Dice] → both tabs see dice result in log
2. Click [Select Token A] → both tabs see TOKEN_SELECTED
3. Click [▶ Move] → both tabs see MOVE_RESULT; p1 controls disable; p2 controls enable

- [ ] **Step 14.5: Verify kick**

Manually move tokens to same tile to trigger kick:
- p1 token A at tile 5, p2 token A at tile 5 → p2 token returns to start
- Both tabs should see KICK event in log

- [ ] **Step 14.6: Verify win condition**

Play until a token reaches tile 24 (P1 FINAL_GOAL) or tile 44 (P2 FINAL_GOAL).
Expected: WIN event, all buttons disabled.

- [ ] **Step 14.7: Commit client**

```bash
cd D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan
git add playtest/client/index.html
git commit -m "feat: playtest web client (Canvas 61-tile board, WebSocket controls)"
```

---

## Known Limitations (Post-Playtest Upgrade Path)

| Limitation | Upgrade Path |
|-----------|--------------|
| Linear wrap-around movement (not actual branch paths) | Wire `MovementValidator.computePath()` into `GameRoom.handleMove()` |
| No elemental effects shown on client | Parse ElementEngine events, add visual feedback |
| No HP damage from FINAL_GOAL combat | Connect `processTileLanding(FINAL_GOAL)` logic |
| Board is approximate cross layout | Compute exact (col,row) from BoardBuilder ARM/LOOP coordinates |
| No disconnect recovery | Add session reconnect logic in GameRoomManager |
| index.html served from filesystem | Move to Ktor static file serving: `staticFiles("/", File("client"))` |
