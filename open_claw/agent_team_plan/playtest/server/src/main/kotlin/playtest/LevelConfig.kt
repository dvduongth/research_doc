package playtest

import kotlinx.serialization.Serializable

/**
 * Level configuration: varies by level/difficulty.
 */
@Serializable
data class LevelConfig(
    val level: Int,
    val maxRounds: Int,
    val comboTierMax: Int,
    val artifactSlots: Int
)
