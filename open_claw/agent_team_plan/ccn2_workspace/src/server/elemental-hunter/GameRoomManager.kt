package com.ccn2.server.elementalhunter

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString
import java.io.File

/**
 * GameRoomManager - Singleton managing active Elemental Hunter game rooms.
 *
 * Creates rooms on demand, routes commands, and persists active state.
 * Each room is an isolated actor with its own CoroutineScope.
 */
object GameRoomManager {

    private val rooms = mutableMapOf<String, GameRoom>()
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private val json = Json { prettyPrint = true; ignoreUnknownKeys = true }

    /**
     * Get or create a game room.
     */
    fun getOrCreateRoom(
        matchId: String,
        config: GameConfig = GameConfig.default()
    ): GameRoom {
        return rooms[matchId] ?: createRoom(matchId, config)
    }

    private fun createRoom(matchId: String, config: GameConfig): GameRoom {
        val room = GameRoom(matchId, config)
        rooms[matchId] = room
        scope.launch {
            // Auto-cleanup when room ends (after some delay)
            room.state.collect { state ->
                if (state.phase == GamePhase.ENDED) {
                    // Keep room for a while for stats then remove
                    delay(60_000) // 1 minute
                    rooms.remove(matchId)
                    room.coroutineContext[Job]?.cancel()
                }
            }
        }
        return room
    }

    /**
     * Dispatch a command to a room.
     */
    suspend fun dispatch(matchId: String, command: GameCommand) {
        val room = getOrCreateRoom(matchId)
        room.dispatch(command)
    }

    /**
     * Get active room count (for metrics).
     */
    fun getActiveRoomCount(): Int = rooms.size

    /**
     * Load config from JSON file in config/ directory.
     */
    fun loadConfigFromDir(configDir: File): GameConfig {
        val charFile = File(configDir, "character.json")
        val levelFile = File(configDir, "level.json")
        val balanceFile = File(configDir, "balance.json")

        val character = if (charFile.exists()) {
            json.decodeFromString<CharacterConfig>(charFile.readText())
        } else {
            CharacterConfig.default()
        }

        val level = if (levelFile.exists()) {
            json.decodeFromString<LevelConfig>(levelFile.readText())
        } else {
            LevelConfig.default()
        }

        val balance = if (balanceFile.exists()) {
            json.decodeFromString<BalanceConfig>(balanceFile.readText())
        } else {
            BalanceConfig()
        }

        return GameConfig(character, level, balance)
    }

    /**
     * Save default configs to config/ directory if not present.
     */
    fun saveDefaultConfigs(configDir: File) {
        configDir.mkdirs()

        val charFile = File(configDir, "character.json")
        if (!charFile.exists()) {
            charFile.writeText(json.encodeToString(CharacterConfig.default()))
        }

        val levelFile = File(configDir, "level.json")
        if (!levelFile.exists()) {
            levelFile.writeText(json.encodeToString(LevelConfig.default()))
        }

        val balanceFile = File(configDir, "balance.json")
        if (!balanceFile.exists()) {
            balanceFile.writeText(json.encodeToString(BalanceConfig()))
        }
    }
}

// Extension default factories
fun CharacterConfig.Companion.default(): CharacterConfig = CharacterConfig(
    affinity = ElementType.FIRE,
    atk = 30,
    mag = 10,
    hp = 1000,
    ultimateType = "Extra Roll",
    ultimateCost = 50
)

fun LevelConfig.Companion.default(): LevelConfig = LevelConfig(
    level = 1,
    maxRounds = 10,
    comboTierMax = 3,
    artifactSlots = 3
)
