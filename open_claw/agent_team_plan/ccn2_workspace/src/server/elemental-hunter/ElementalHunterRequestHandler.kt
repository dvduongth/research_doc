package com.ccn2.server.elementalhunter

import io.ktor.http.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.coroutines.*

/**
 * ElementalHunterRequestHandler - HTTP endpoint handlers.
 *
 * Called from ElementalHunterModule routes. Uses GameRoomManager
 * to dispatch commands to the appropriate room.
 */
object ElementalHunterRequestHandler {

    private val manager = GameRoomManager

    /**
     * POST /api/elemental-hunter/start
     * Body: { "player1": "id1", "player2": "id2" }
     */
    suspend fun handleStartGame(call: RoutingCall) {
        val params = call.receive<StartGameRequest>()
        val room = manager.getOrCreateRoom(
            matchId = generateMatchId(),
            config = GameConfig.default()
        )
        room.dispatch(GameCommand.StartGame(params.player1, params.player2))
        call.respond(HttpStatusCode.OK, mapOf("matchId" to room.state.value.matchId))
    }

    /**
     * POST /api/elemental-hunter/roll
     * Body: { "playerId": "...", "powerRollRange": [min,max] (optional) }
     */
    suspend fun handleRollDice(call: RoutingCall) {
        val params = call.receive<RollDiceRequest>()
        // matchId needs to be in path or body; assume call has matchId attribute set by module
        val matchId = call.parameters["matchId"] ?: throw IllegalArgumentException("matchId required")
        manager.dispatch(matchId, GameCommand.RollDice(params.playerId, params.powerRollRange))
        call.respond(HttpStatusCode.OK)
    }

    /**
     * POST /api/elemental-hunter/select-token
     * Body: { "playerId": "...", "tokenId": "..." }
     */
    suspend fun handleSelectToken(call: RoutingCall) {
        val params = call.receive<SelectTokenRequest>()
        val matchId = call.parameters["matchId"] ?: throw IllegalArgumentException("matchId required")
        manager.dispatch(matchId, GameCommand.SelectToken(params.playerId, params.tokenId))
        call.respond(HttpStatusCode.OK)
    }

    /**
     * POST /api/elemental-hunter/move
     * Body: { "playerId": "...", "steps": N }
     */
    suspend fun handleMove(call: RoutingCall) {
        val params = call.receive<MoveRequest>()
        val matchId = call.parameters["matchId"] ?: throw IllegalArgumentException("matchId required")
        manager.dispatch(matchId, GameCommand.Move(params.playerId, params.steps))
        call.respond(HttpStatusCode.OK)
    }

    /**
     * POST /api/elemental-hunter/artifact
     * Body: { "playerId": "...", "artifactType": "SWAP|CHANGE|CHARGE" }
     */
    suspend fun handleArtifact(call: RoutingCall) {
        val params = call.receive<ArtifactRequest>()
        val matchId = call.parameters["matchId"] ?: throw IllegalArgumentException("matchId required")
        val type = ArtifactType.valueOf(params.artifactType)
        manager.dispatch(matchId, GameCommand.SelectArtifact(params.playerId, type))
        call.respond(HttpStatusCode.OK)
    }

    /**
     * POST /api/elemental-hunter/ultimate
     * Body: { "playerId": "..." }
     */
    suspend fun handleActivateUltimate(call: RoutingCall) {
        val params = call.receive<UltimateRequest>()
        val matchId = call.parameters["matchId"] ?: throw IllegalArgumentException("matchId required")
        manager.dispatch(matchId, GameCommand.ActivateUltimate(params.playerId))
        call.respond(HttpStatusCode.OK)
    }

    private fun generateMatchId(): String {
        return "match_${System.currentTimeMillis()}"
    }
}

// Request DTOs
data class StartGameRequest(val player1: String, val player2: String)
data class RollDiceRequest(val playerId: String, val powerRollRange: Pair<Int, Int>? = null)
data class SelectTokenRequest(val playerId: String, val tokenId: String)
data class MoveRequest(val playerId: String, val steps: Int)
data class ArtifactRequest(val playerId: String, val artifactType: String)
data class UltimateRequest(val playerId: String)
