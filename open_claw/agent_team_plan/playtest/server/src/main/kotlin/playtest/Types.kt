package playtest

import kotlinx.serialization.Serializable

// ========== Enums ==========

@Serializable
enum class GamePhase { LOBBY, PLAYING, ENDED }

@Serializable
enum class TileType {
    ELEMENTAL, EMPTY, SAFE_ZONE, START, NORMAL,
    FINAL_GOAL  // added: referenced by BoardBuilder.kt but missing from original enum
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
// Pair<Int,Int> has no built-in kotlinx.serialization serializer.
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
    val lastDiceResult: Pair<Int, Int>?
)

@Serializable
data class ComboRewards(val atkBonus: Int = 0, val magBonus: Int = 0)

// Lightweight game snapshot passed to engine helpers (ArtifactHandler, CombatEngine).
// Not serialized directly; fields are projected to WS messages by GameRoom.
data class GameState(
    val players: Map<String, PlayerState>,
    val tokens: Map<String, TokenState>,
    val board: List<TileState>,
    val phase: GamePhase,
    val currentTurn: String?
)
