package playtest

import kotlinx.serialization.Serializable

/**
 * ElementEngine - Manages element collection, queue, and combo detection.
 *
 * Pure functions, no side effects. Used by GameRoom.
 */
object ElementEngine {

    /**
     * Collect an element on a tile for a player.
     * Handles affinity bonus, multiplier, and queue management.
     */
    fun collectElement(
        player: PlayerState,
        element: ElementType,
        balance: BalanceConfig
    ): PlayerState {
        var updated = player

        // Apply affinity bonus
        val atkBonus = if (element == player.elementAffinity) {
            balance.tileRewardAtk * player.tileGainMultiplier
        } else {
            balance.tileRewardMag * player.tileGainMultiplier
        }

        // Update ATK if affinity match
        if (element == player.elementAffinity) {
            updated = updated.copy(
                // ATK is derived from token base; we store ATK bonus globally? Or apply to all tokens
                // For simplicity, we track atkBonus in player and apply to tokens on attack
                comboCount = updated.comboCount + 1 // increment combo count for milestone
            )
            // Actually: "T1: +150 ATK all horses" — handled in Combo Rewards
            // So just track comboCount; rewards applied when combo triggers
        } else {
            // Add to element queue for combo
            updated = addToQueue(updated, element, balance)
        }

        // Check for combo triggers after adding/updating queue
        val comboResults = processCombos(updated.elementQueue)
        if (comboResults.isNotEmpty()) {
            // Apply first combo's rewards (cascading handled by repeated calls)
            updated = applyComboRewards(updated, comboResults.first(), balance)
        }

        return updated
    }

    /**
     * Add element to queue with size limit.
     */
    private fun addToQueue(
        player: PlayerState,
        element: ElementType,
        balance: BalanceConfig
    ): PlayerState {
        val queue = ArrayDeque(player.elementQueue)
        if (queue.size >= balance.maxElementQueue) {
            queue.removeFirst() // drop oldest
        }
        queue.addLast(element)
        return player.copy(elementQueue = queue)
    }

    /**
     * Process combos on the queue: return list of detected combos.
     * Priority: C3 first, then C4 (all different).
     * Cascading: after removing a combo, rescan from start.
     */
    fun processCombos(queue: ArrayDeque<ElementType>): List<ComboResult> {
        val results = mutableListOf<ComboResult>()
        var cascade = true

        while (cascade && queue.size >= 3) {
            cascade = false

            // C3: three consecutive same elements
            for (i in 0 until queue.size - 2) {
                if (queue[i] == queue[i + 1] && queue[i] == queue[i + 2]) {
                    val removed = listOf(queue.removeAt(i), queue.removeAt(i), queue.removeAt(i))
                    results.add(ComboResult(ComboType.C3, removed))
                    cascade = true
                    break
                }
            }
            if (cascade) continue

            // C4: four consecutive all different
            if (queue.size >= 4) {
                for (i in 0 until queue.size - 3) {
                    val sub = queue.subList(i, i + 4)
                    if (sub.distinct().size == 4) {
                        val removed = sub.toList()
                        repeat(4) { queue.removeAt(i) }
                        results.add(ComboResult(ComboType.C4, removed))
                        cascade = true
                        break
                    }
                }
            }
        }

        return results
    }

    /**
     * Apply a combo's rewards to player state.
     */
    private fun applyComboRewards(
        player: PlayerState,
        combo: ComboResult,
        balance: BalanceConfig
    ): PlayerState {
        // Determine tier based on comboCount (milestone)
        val newComboCount = player.comboCount + 1
        val tier = when {
            newComboCount >= 3 -> 3
            newComboCount >= 2 -> 2
            else -> 1
        }

        val rewards = getRewardsForTier(tier, balance)

        var updated = player.copy(
            comboCount = newComboCount,
            comboTier = tier,
            tileGainMultiplier = if (tier >= 2) 2 else 1
        )

        // If Tier 1 or 3, apply ATK bonus globally; we store in player state
        // Actually Tier 1: +150 ATK all horses — needs to affect tokens' atk during attack
        // We'll handle by storing comboTier; attack calculation uses it.
        // Tier 2: tileGainMultiplier = ×2 (already set)
        // Tier 3: atk = ceil(atk * 1.5) — also handled during attack

        return updated
    }

    private fun getRewardsForTier(tier: Int, balance: BalanceConfig): ComboRewards {
        return when (tier) {
            1 -> ComboRewards(atkBonus = balance.comboT1AtkBonus, magBonus = 0)
            2 -> ComboRewards(atkBonus = 0, magBonus = 0)
            3 -> ComboRewards(atkBonus = 0, magBonus = 0)
            else -> ComboRewards()
        }
    }

    /**
     * Check if player has reached a new milestone (2 or 3 combos) and apply accordingly.
     * This is called after each combo to update state.
     */
    fun checkMilestone(player: PlayerState): PlayerState {
        val newTier = when {
            player.comboCount >= 3 -> 3
            player.comboCount >= 2 -> 2
            else -> 0
        }
        return if (newTier > player.comboTier) {
            player.copy(
                comboTier = newTier,
                tileGainMultiplier = if (newTier >= 2) 2 else 1
            )
        } else {
            player
        }
    }
}

@Serializable
data class ComboResult(
    val type: ComboType,
    val elements: List<ElementType>
)
