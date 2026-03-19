package playtest

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.websocket.*
import kotlinx.serialization.json.*
import kotlin.time.Duration.Companion.seconds

fun main() {
    embeddedServer(Netty, port = 8181, host = "0.0.0.0") {
        install(CORS) {
            anyHost()
            allowHeader(HttpHeaders.ContentType)
        }
        install(WebSockets) {
            pingPeriod = 15.seconds
            timeout = 15.seconds
            maxFrameSize = Long.MAX_VALUE
            masking = false
        }
        install(ContentNegotiation) {
            json(Json { prettyPrint = true; isLenient = true })
        }
        configureRouting()
    }.start(wait = true)
}

private fun Application.configureRouting() {
    val config = GameConfig.default()

    routing {
        get("/health") {
            call.respondText("OK")
        }

        get("/game/rooms") {
            val rooms = GameRoomManager.getRoomList()
            call.respond(rooms)
        }

        post("/game/rooms/{roomId}") {
            val roomId = call.parameters["roomId"]
                ?: return@post call.respondText("Missing roomId", status = HttpStatusCode.BadRequest)
            GameRoomManager.getOrCreateRoom(roomId, config)
            call.respondText("Room $roomId created", status = HttpStatusCode.Created)
        }

        webSocket("/game/ws/{roomId}/{playerId}") {
            val roomId = call.parameters["roomId"]
                ?: return@webSocket close(CloseReason(CloseReason.Codes.VIOLATED_POLICY, "Missing roomId"))
            val playerId = call.parameters["playerId"]
                ?: return@webSocket close(CloseReason(CloseReason.Codes.VIOLATED_POLICY, "Missing playerId"))

            println("[WS] $playerId connected to room $roomId")
            val room = GameRoomManager.getOrCreateRoom(roomId, config)
            GameRoomManager.registerSession(roomId, playerId, this)

            // Auto-join on connect
            room.submit(GameRoom.Cmd.Join(playerId))

            try {
                for (frame in incoming) {
                    if (frame is Frame.Text) {
                        handleClientMessage(room, playerId, frame.readText())
                    }
                }
            } catch (e: Exception) {
                println("[WS] Error $playerId@$roomId: ${e.message}")
            } finally {
                println("[WS] $playerId disconnected from $roomId")
                GameRoomManager.unregisterSession(roomId, playerId, this)
            }
        }
    }
}

private fun handleClientMessage(room: GameRoom, playerId: String, text: String) {
    try {
        val json = Json.parseToJsonElement(text).jsonObject
        val action = json["action"]?.jsonPrimitive?.content ?: return
        when (action) {
            "JOIN"         -> { /* no-op: server auto-joins on WS connect */ }
            "ROLL_DICE"    -> room.submit(GameRoom.Cmd.RollDice(playerId))
            "SELECT_TOKEN" -> {
                val tokenId = json["tokenId"]?.jsonPrimitive?.content ?: return
                room.submit(GameRoom.Cmd.SelectToken(playerId, tokenId))
            }
            "MOVE"         -> room.submit(GameRoom.Cmd.Move(playerId))
            else           -> println("[WS] Unknown action: $action from $playerId")
        }
    } catch (e: Exception) {
        println("[WS] Parse error from $playerId: ${e.message}")
    }
}
