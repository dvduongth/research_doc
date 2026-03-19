package playtest

import kotlinx.serialization.Serializable

/**
 * Character configuration: base stats for each pillow/character.
 */
@Serializable
data class CharacterConfig(
    val affinity: ElementType,
    val atk: Int,
    val mag: Int,
    val hp: Int,
    val ultimateType: String,
    val ultimateCost: Int
)
