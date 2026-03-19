package com.ccn2.server.elementalhunter

import kotlinx.serialization.Serializable

/**
 * CombatEngine - Handles combat mechanics: Kick and Final Goal attack.
 *
 * All functions are pure and side-effect free; modify state in GameRoom.
 */
object CombatEngine {

    /**
     * Execute a kick: attacker lands on defender's tile (non-safe zone).
     * Reduces defender HP by attacker's ATK (including combo bonuses),
     * then moves defender to nearest Safe Zone behind their position.
     */
    fun executeKick(
        state: GameState,
        attacker: TokenState,
        defender: TokenState
    ): Pair<PlayerState, TokenState> {
        val attackerOwner = state.players[attacker.owner]!!
        val defenderOwner = state.players[defender.owner]!!

        // Calculate damage: base ATK + combo tier bonus
        val atkBonus = when (attackerOwner.comboTier) {
            1 -> BalanceConfig.COMBO_T1_ATK_BONUS
            2 -> (BalanceConfig.COMBO_T1_ATK_BONUS * 1.5).toInt()
            3 -> BalanceConfig.COMBO_T1_ATK_BONUS * 2
            else -> 0
        }
        val damage = attacker.atk + atkBonus

        // Reduce defender HP
        val newDefenderHp = (defenderOwner.hp - damage).coerceAtLeast(0)
        val updatedDefenderOwner = defenderOwner.copy(hp = newDefenderHp)

        // Push defender to nearest Safe Zone backward
        val safeZoneTile = MovementValidator.getNearestSafeZone(
            tileId = defender.tileId,
            owner = defender.owner,
            board = state.board
        )
        val updatedDefenderToken = defender.copy(tileId = safeZoneTile)

        // Update attacker kick count
        val updatedAttackerOwner = attackerOwner.copy(
            kickCount = attackerOwner.kickCount + 1
        )

        return Pair(updatedDefenderOwner, updatedDefenderToken)
        // Caller must update state.players and state.tokens
    }

    /**
     * Process Final Goal: player adds chosen element to queue, then attacks opponent.
     * - Adds affinity element (or chosen element) to queue
     * - Triggers combo check
     * - Deals damage = token.atk + combo bonuses
     * - Returns token to owner's Safe Zone
     */
    fun processFinalGoal(
        state: GameState,
        token: TokenState,
        chosenElement: ElementType,
        attackerOwner: PlayerState,
        opponentOwner: PlayerState
    ): Pair<PlayerState, PlayerState> {
        // Add chosen element to attacker's queue (handled in collectElement)
        // Damage calculation
        val atkBonus = when (attackerOwner.comboTier) {
            1 -> BalanceConfig.COMBO_T1_ATK_BONUS
            2 -> (BalanceConfig.COMBO_T1_ATK_BONUS * 1.5).toInt()
            3 -> BalanceConfig.COMBO_T1_ATK_BONUS * 2
            else -> 0
        }
        // Optional Tier3 multiplier
        val multiplier = if (attackerOwner.comboTier == 3) BalanceConfig.COMBO_T3_ATK_MULTIPLIER else 1.0
        val damage = ((token.atk + atkBonus) * multiplier).toInt()

        val newOpponentHp = (opponentOwner.hp - damage).coerceAtLeast(0)
        val updatedOpponent = opponentOwner.copy(hp = newOpponentHp)

        // Tokens returned to Safe Zone in handleMove flow
        return Pair(attackerOwner, updatedOpponent)
    }
}
