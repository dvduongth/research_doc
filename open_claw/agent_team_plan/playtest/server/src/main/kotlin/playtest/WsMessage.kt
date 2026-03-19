package playtest

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*

// ===== Client → Server =====

@Serializable
data class ClientMessage(
    val action: String,
    val playerId: String,
    val tokenId: String? = null,
    val steps: Int? = null
)

// ===== Server → Client =====

@Serializable
data class ServerMessage(
    val event: String,
    val data: JsonObject
)

object ServerEvents {
    private val json = Json { encodeDefaults = true; ignoreUnknownKeys = true }

    fun gameState(room: Map<String, String>, players: List<Map<String, String>>, board: List<Map<String, String>>): String =
        json.encodeToString(ServerMessage.serializer(), ServerMessage(
            event = "GAME_STATE",
            data = buildJsonObject {
                put("room", room.toJsonObject())
                put("players", JsonArray(players.map { it.toJsonObject() }))
                put("board", JsonArray(board.map { it.toJsonObject() }))
            }
        ))

    fun diceResult(playerId: String, dice: List<Int>, sum: Int, isDouble: Boolean): String =
        json.encodeToString(ServerMessage.serializer(), ServerMessage(
            event = "DICE_RESULT",
            data = buildJsonObject {
                put("playerId", playerId)
                put("dice", JsonArray(dice.map { JsonPrimitive(it) }))
                put("sum", sum)
                put("isDouble", isDouble)
            }
        ))

    fun tokenSelected(playerId: String, tokenId: String): String =
        json.encodeToString(ServerMessage.serializer(), ServerMessage(
            event = "TOKEN_SELECTED",
            data = buildJsonObject { put("playerId", playerId); put("tokenId", tokenId) }
        ))

    fun moveResult(playerId: String, tokenId: String, from: Int, to: Int): String =
        json.encodeToString(ServerMessage.serializer(), ServerMessage(
            event = "MOVE_RESULT",
            data = buildJsonObject {
                put("playerId", playerId); put("tokenId", tokenId)
                put("from", from); put("to", to)
            }
        ))

    fun kick(kickerId: String, kickedId: String, tokenId: String, returnedTo: Int): String =
        json.encodeToString(ServerMessage.serializer(), ServerMessage(
            event = "KICK",
            data = buildJsonObject {
                put("kickerId", kickerId); put("kickedId", kickedId)
                put("tokenId", tokenId); put("returnedTo", returnedTo)
            }
        ))

    fun turnChange(currentPlayer: String): String =
        json.encodeToString(ServerMessage.serializer(), ServerMessage(
            event = "TURN_CHANGE",
            data = buildJsonObject { put("currentPlayer", currentPlayer) }
        ))

    fun win(winnerId: String): String =
        json.encodeToString(ServerMessage.serializer(), ServerMessage(
            event = "WIN",
            data = buildJsonObject { put("winnerId", winnerId) }
        ))

    fun error(message: String): String =
        json.encodeToString(ServerMessage.serializer(), ServerMessage(
            event = "ERROR",
            data = buildJsonObject { put("message", message) }
        ))

    private fun Map<String, String>.toJsonObject(): JsonObject = buildJsonObject {
        this@toJsonObject.forEach { (k, v) -> put(k, v) }
    }
}
