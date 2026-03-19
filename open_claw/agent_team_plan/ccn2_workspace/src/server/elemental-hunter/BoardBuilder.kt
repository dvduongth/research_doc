package com.ccn2.server.elementalhunter

import kotlinx.serialization.Serializable

/**
 * BoardBuilder - Constructs the 61-tile board for Elemental Hunter.
 *
 * Board layout: cross (chữ thập) with isometric coordinate system.
 * Tile IDs 0–60 arranged with:
 * - Two Arm Paths (10 tiles each) starting at opposite ends
 * - Main Loop connecting arms
 * - Branch Points that lead to Goal Paths
 * - Final Goals (end zones)
 * - Safe Zones (start tiles and maybe others)
 * - Elemental and Empty tiles placed along path.
 */
object BoardBuilder {

    private val ARM_P1 = (51..60).toList()  // P1 start at 51-53
    private val ARM_P2 = (0..9).toList()    // P2 start at 0-2

    // Main loop connecting the two arms
    private val MAIN_LOOP = listOf(
        10, 11, 12, 13, 14, 15, 20, 21, 22, 23, 24,
        30, 31, 32, 33, 34, 35, 40, 41, 42, 43, 44,
        50, 51, 60, 50, 40, 30, 20, 10, 0 // circular with repeats for looping
    )

    // Branch tiles: owners and their goal paths
    private val BRANCH_RULES = mapOf(
        19 to BranchInfo(owner = "P1", goalStart = 20, goalPath = listOf(20, 21, 22, 23, 24)),
        29 to BranchInfo(owner = "P1", goalStart = 30, goalPath = listOf(30, 31, 32, 33, 34)),
        39 to BranchInfo(owner = "P2", goalStart = 40, goalPath = listOf(40, 41, 42, 43, 44)),
        49 to BranchInfo(owner = "P2", goalStart = 50, goalPath = listOf(50, 51, 52, 53, 54))
    )

    private val FINAL_GOALS = mapOf(
        "P1" to 24,
        "P2" to 44
    )

    // Elemental tile distribution (example: 18 elemental tiles)
    private val ELEMENTAL_TILE_IDS = setOf(
        10, 11, 12, 20, 21, 22, 30, 31, 32, 40, 41, 42,
        51, 52, 53, 0, 1, 2
    )

    // Empty tile positions
    private val EMPTY_TILE_IDS = setOf(
        13, 14, 15, 23, 24, 33, 34, 35, 43, 44
    )

    // All tile IDs in the board (0–60 cross shape)
    private val ALL_TILE_IDS = (0..60).toList()

    fun buildBoard(): List<TileState> {
        return ALL_TILE_IDS.map { tileId ->
            val type = when {
                FINAL_GOALS.values.contains(tileId) -> TileType.FINAL_GOAL
                tileId in ARM_P1.take(3) || tileId in ARM_P2.take(3) -> TileType.SAFE_ZONE
                tileId in ELEMENTAL_TILE_IDS -> TileType.ELEMENTAL
                tileId in EMPTY_TILE_IDS -> TileType.EMPTY
                else -> TileType.NORMAL
            }

            val element = when {
                type == TileType.ELEMENTAL -> {
                    // Distribute elements evenly
                    when (tileId % 4) {
                        0 -> ElementType.FIRE
                        1 -> ElementType.ICE
                        2 -> ElementType.GRASS
                        else -> ElementType.ROCK
                    }
                }
                else -> null
            }

            TileState(
                tileId = tileId,
                tileType = type,
                baseElement = element,
                currentElement = element
            )
        }
    }

    fun getArmPath(playerId: String): List<Int> {
        return when (playerId) {
            "P1" -> ARM_P1
            "P2" -> ARM_P2
            else -> emptyList()
        }
    }

    fun getMainLoop(): List<Int> = MAIN_LOOP

    fun getBranchRules(): Map<Int, BranchInfo> = BRANCH_RULES

    fun getFinalGoal(playerId: String): Int = FINAL_GOALS[playerId] ?: -1
}

private data class BranchInfo(
    val owner: String,
    val goalStart: Int,
    val goalPath: List<Int>
)
