package playtest

import kotlin.random.Random

/**
 * RNGService - Centralized dice rolling with Power Roll support.
 *
 * All functions are pure for testability.
 */
object RNGService {

    /**
     * Roll two dice.
     * @param powerRollRange: optional target range [min, max] for Power Roll.
     * @return Pair(die1, die2) and whether Power Roll hit target.
     */
    fun rollDice(random: Random = Random, powerRollRange: Pair<Int, Int>? = null, balance: BalanceConfig): DiceRollResult {
        val d1 = random.nextInt(1, 7)
        val d2 = random.nextInt(1, 7)
        val sum = d1 + d2
        val isDouble = d1 == d2

        val powerRollHit = if (powerRollRange != null) {
            val (min, max) = powerRollRange
            sum in min..max && random.nextDouble() < balance.powerRollAccuracy
        } else {
            false
        }

        return DiceRollResult(d1, d2, sum, isDouble, powerRollHit)
    }

    /**
     * Roll a single die.
     */
    fun rollSingle(random: Random = Random): Int {
        return random.nextInt(1, 7)
    }
}

data class DiceRollResult(
    val die1: Int,
    val die2: Int,
    val sum: Int,
    val isDouble: Boolean,
    val powerRollHit: Boolean
)
