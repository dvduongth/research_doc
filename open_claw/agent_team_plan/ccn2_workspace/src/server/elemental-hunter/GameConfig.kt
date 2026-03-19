package com.ccn2.server.elementalhunter

import kotlinx.serialization.Serializable

/**
 * GameConfig aggregates all configuration for a match.
 * Loaded from JSON files in config/ directory.
 */
@Serializable
data class GameConfig(
    val character: CharacterConfig,
    val level: LevelConfig,
    val balance: BalanceConfig
) {
    companion object {
        // Load from resources or default
        fun default(): GameConfig = GameConfig(
            character = CharacterConfig(
                affinity = ElementType.FIRE,
                atk = 30,
                mag = 10,
                hp = 1000,
                ultimateType = "Extra Roll",
                ultimateCost = 50
            ),
            level = LevelConfig(
                level = 1,
                maxRounds = 10,
                comboTierMax = 3,
                artifactSlots = 3
            ),
            balance = BalanceConfig()
        )
    }
}
