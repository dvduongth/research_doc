package playtest

import kotlinx.serialization.Serializable

/**
 * MovementValidator - Validates movement and pathfinding.
 *
 * All pure functions, no side effects.
 */
object MovementValidator {

    // Board configuration constants (61 tiles)
    private val ARM_PATHS = mapOf(
        "P1" to listOf(51, 52, 53, 54, 55, 56, 57, 58, 59, 60),
        "P2" to listOf(0, 1, 2, 3, 4, 5, 6, 7, 8, 9)
    )

    private val MAIN_LOOP = listOf(
        10, 11, 12, 13, 14, 15, 20, 21, 22, 23, 24,
        30, 31, 32, 33, 34, 35, 40, 41, 42, 43, 44,
        50, 51, 60, 50, 40, 30, 20, 10, 0 // circular
    )

    private val BRANCH_RULES = mapOf(
        19 to BranchRule(owner = "P1", goalPath = listOf(20, 21, 22, 23, 24)),
        29 to BranchRule(owner = "P1", goalPath = listOf(30, 31, 32, 33, 34)),
        39 to BranchRule(owner = "P2", goalPath = listOf(40, 41, 42, 43, 44)),
        49 to BranchRule(owner = "P2", goalPath = listOf(50, 51, 52, 53, 54))
    )

    private val FINAL_GOALS = mapOf(
        "P1" to 24,
        "P2" to 44
    )

    private val SAFE_ZONES = setOf(0, 1, 2, 51, 52, 53, 54) // start tiles + maybe others

    /**
     * Compute path from current tile moving `steps` steps.
     * Returns list of tileIds visited in order (including intermediate).
     */
    fun computePath(from: Int, steps: Int, owner: String, board: List<TileState>): List<Int> {
        require(steps > 0) { "Steps must be positive" }

        val path = mutableListOf<Int>()
        var current = from
        repeat(steps) {
            current = getNextTile(current, owner, board)
            path.add(current)
        }
        return path
    }

    private fun getNextTile(current: Int, owner: String, board: List<TileState>): Int {
        // Check if current is a branch point for this owner
        val branch = BRANCH_RULES[current]
        if (branch != null && branch.owner == owner) {
            return branch.goalPath.first()
        }

        // Find next along MAIN_LOOP or default progression
        val idx = MAIN_LOOP.indexOf(current)
        if (idx != -1 && idx < MAIN_LOOP.lastIndex) {
            return MAIN_LOOP[idx + 1]
        }

        // Fallback: linear increment? (board layout)
        val tile = board.find { it.tileId == current } ?: return current + 1
        // Assume board tiles are ordered; simple increment for unknown
        return current + 1
    }

    /**
     * Get nearest safe zone backward from given tile (for kick pushback).
     */
    fun getNearestSafeZone(tileId: Int, owner: String, board: List<TileState>): Int {
        // Reversed direction depends on owner's path direction
        val path = if (owner == "P1") {
            ARM_PATHS["P1"]!!.asReversed() + MAIN_LOOP.asReversed()
        } else {
            ARM_PATHS["P2"]!!.asReversed() + MAIN_LOOP.asReversed()
        }

        val idx = path.indexOf(tileId)
        for (i in (idx + 1) until path.size) {
            if (SAFE_ZONES.contains(path[i])) {
                return path[i]
            }
        }
        return SAFE_ZONES.first()
    }

    /**
     * Check if a tile is a safe zone (tokens can stack).
     */
    fun isSafeZone(tileId: Int, board: List<TileState>): Boolean {
        return SAFE_ZONES.contains(tileId)
    }

    /**
     * Check if a token destination is blocked by another token of same team.
     * Safe zones allow stacking.
     */
    fun isBlockedBySameTeam(
        tileId: Int,
        owner: String,
        tokens: List<TokenState>,
        board: List<TileState>
    ): Boolean {
        if (isSafeZone(tileId, board)) return false
        return tokens.any { it.tileId == tileId && it.owner == owner }
    }
}

private data class BranchRule(
    val owner: String,
    val goalPath: List<Int>
)
