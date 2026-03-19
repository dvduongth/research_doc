package com.ccn2.server.elementalhunter

import kotlinx.serialization.Serializable

/**
 * ArtifactHandler - Manages artifact unlock and execution.
 *
 * Artifacts are unlocked based on emptyTileVisits count.
 * Three types: SWAP, CHANGE, CHARGE.
 */
object ArtifactHandler {

    private val UNLOCK_THRESHOLDS = mapOf(
        ArtifactType.SWAP to 1,    // first visit
        ArtifactType.CHANGE to 2,  // second visit
        ArtifactType.CHARGE to 3   // third visit
    )

    /**
     * Get list of artifacts available to player based on visits and level.
     */
    fun getAvailableArtifacts(player: PlayerState, level: LevelConfig): List<ArtifactType> {
        return ArtifactType.entries.filter { type ->
            UNLOCK_THRESHOLDS[type]?.let { threshold -> player.emptyTileVisits >= threshold } ?: false
        }
    }

    /**
     * Execute an artifact's effect on game state.
     * All effects modify the player's element queue.
     */
    fun executeArtifact(
        state: GameState,
        playerId: String,
        artifactType: ArtifactType
    ) {
        val player = state.players[playerId]!!
        val queue = ArrayDeque(player.elementQueue)

        when (artifactType) {
            ArtifactType.SWAP -> {
                // Swap two adjacent elements in queue
                if (queue.size >= 2) {
                    val idx = (0 until queue.size - 1).random()
                    val temp = queue[idx]
                    queue[idx] = queue[idx + 1]
                    queue[idx + 1] = temp
                }
                // else: no effect if queue < 2
            }
            ArtifactType.CHANGE -> {
                // Change one element to another type (excluding affinity)
                if (queue.isNotEmpty()) {
                    val idx = (0 until queue.size).random()
                    val current = queue[idx]
                    val otherTypes = ElementType.entries.filter { it != current && it != player.elementAffinity }
                    if (otherTypes.isNotEmpty()) {
                        queue[idx] = otherTypes.random()
                    }
                }
            }
            ArtifactType.CHARGE -> {
                // Add one element of player's affinity to end of queue
                queue.addLast(player.elementAffinity)
                // Trim if exceeds max
                if (queue.size > BalanceConfig.maxElementQueue) {
                    queue.removeFirst()
                }
            }
        }

        // Update player state (queue modified)
        val updatedPlayer = player.copy(elementQueue = queue)
        // Caller updates state.players
        // No immediate combo check here; handled after element added
    }

    /**
     * Check if artifact selection is allowed.
     */
    fun canSelectArtifact(player: PlayerState, artifactType: ArtifactType): Boolean {
        return UNLOCK_THRESHOLDS[artifactType]?.let { player.emptyTileVisits >= it } ?: false
    }
}
