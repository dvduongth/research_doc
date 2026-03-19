package com.ccn2.server.elementalhunter

import io.ktor.http.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.isActive
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.time.Duration

/**
 * Elemental Hunter Game Module
 *
 * Registers the Elemental Hunter game mode with the Ktor server.
 * Sets up HTTP routes and WebSocket handlers for real-time game events.
 */
class ElementalHunterModule : KtorServerPlugin() {
    private val json = Json { prettyPrint = false }
    private val manager = GameRoomManager

    override fun onLoad() {
        // Preload default configs on startup
        manager.saveDefaultConfigs(File("src/server/elemental-hunter/config"))

        // Register HTTP routes
        application.routing {
            post("/api/elemental-hunter/start") { ElementalHunterRequestHandler.handleStartGame(call) }
            post("/api/elemental-hunter/{matchId}/roll") { ElementalHunterRequestHandler.handleRollDice(call) }
            post("/api/elemental-hunter/{matchId}/select-token") { ElementalHunterRequestHandler.handleSelectToken(call) }
            post("/api/elemental-hunter/{matchId}/move") { ElementalHunterRequestHandler.handleMove(call) }
            post("/api/elemental-hunter/{matchId}/artifact") { ElementalHunterRequestHandler.handleArtifact(call) }
            post("/api/elemental-hunter/{matchId}/ultimate") { ElementalHunterRequestHandler.handleActivateUltimate(call) }
        }

        // WebSocket for live events
        webSocket("/ws/elemental-hunter/{matchId}", {
            pingPeriod = Duration.ofSeconds(15)
            timeout = Duration.ofMinutes(60)
            maxFrameSize = Long.MAX_VALUE
            masking = false
        }) { handleGameWebSocket() }

        logger.info("ElementalHunterModule loaded with routes and WebSocket")
    }

    private suspend fun handleGameWebSocket() {
        val matchId = call.parameters["matchId"]
            ?: run {
                close(CloseReason(CloseReason.Codes.VIOLATED_POLICY, "Missing matchId"))
                return
            }

        val room = manager.getOrCreateRoom(matchId)

        try {
            // Send current state snapshot upon connect
            val snapshot = room.state.value
            send(json.encodeToString(GameEventWrapper.GameStateSnapshot(snapshot)))

            // Stream events
            room.events().collect { events ->
                // Only send new events since last send (simplified: send all; client tracks lastEventId)
                events.forEach { event ->
                    send(json.encodeToString(GameEventWrapper.Event(event)))
                }
            }
        } catch (e: Exception) {
            logger.error("WebSocket error for match $matchId", e)
        } finally {
            logger.info("WebSocket closed for match $matchId")
        }
    }
}

/**
 * WebSocket message wrapper to distinguish between full state snapshots and events.
 */
@kotlinx.serialization.Serializable
sealed class GameEventWrapper {
    @kotlinx.serialization.Serializable
    data class GameStateSnapshot(val state: GameState) : GameEventWrapper()

    @kotlinx.serialization.Serializable
    data class Event(val event: com.ccn2.server.elementalhunter.GameEvent) : GameEventWrapper()
}
