package playtest

import kotlinx.serialization.Serializable

/**
 * Balance configuration: gameplay constants.
 * May be loaded from JSON to allow tweaking without recompiling.
 */
@Serializable
data class BalanceConfig(
    val maxConsecutiveRolls: Int = 3,
    val doubleRollCooldownRounds: Int = 2,
    val comboT1AtkBonus: Int = 150,
    val comboT3AtkMultiplier: Double = 1.5,
    val ultimateCostExtraRoll: Int = 50,
    val powerRollAccuracy: Double = 0.20,
    val tileRewardAtk: Int = 30,
    val tileRewardMag: Int = 10,
    val tokenCount: Int = 3,
    val magCap: Int = 100,
    val maxElementQueue: Int = 8
) {
    companion object {
        const val DEFAULT_MAG_CAP = 100
    }
}
