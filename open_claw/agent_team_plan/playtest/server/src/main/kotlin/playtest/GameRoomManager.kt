package playtest

import io.ktor.websocket.*
import java.util.concurrent.ConcurrentHashMap
import java.util.Collections

object GameRoomManager {

    private val rooms = ConcurrentHashMap<String, GameRoom>()
    private val sessions = ConcurrentHashMap<String, MutableList<DefaultWebSocketSession>>()
    private val playerSessions = ConcurrentHashMap<String, DefaultWebSocketSession>()

    fun getOrCreateRoom(roomId: String, config: GameConfig): GameRoom {
        return rooms.getOrPut(roomId) {
            GameRoom(
                roomId = roomId,
                config = config,
                broadcastFn = { message -> broadcast(roomId, message) }
            )
        }
    }

    fun getRoom(roomId: String): GameRoom? = rooms[roomId]

    fun getRoomList(): List<Map<String, String>> = rooms.map { (id, room) ->
        mapOf("roomId" to id, "playerCount" to room.playerIds.size.toString())
    }

    fun registerSession(roomId: String, playerId: String, session: DefaultWebSocketSession) {
        sessions.computeIfAbsent(roomId) { Collections.synchronizedList(mutableListOf()) }
            .add(session)
        playerSessions["$roomId:$playerId"] = session
    }

    fun unregisterSession(roomId: String, playerId: String, session: DefaultWebSocketSession) {
        sessions[roomId]?.remove(session)
        playerSessions.remove("$roomId:$playerId")

        if (sessions[roomId]?.isEmpty() == true) {
            sessions.remove(roomId)
            rooms.remove(roomId)?.close()
            println("[GameRoomManager] Room $roomId cleaned up")
        }
    }

    private suspend fun broadcast(roomId: String, message: String) {
        val roomSessions = sessions[roomId] ?: return
        val dead = mutableListOf<DefaultWebSocketSession>()
        for (session in roomSessions.toList()) {
            try {
                session.send(Frame.Text(message))
            } catch (e: Exception) {
                println("[GameRoomManager] Dead session in $roomId: ${e.message}")
                dead.add(session)
            }
        }
        roomSessions.removeAll(dead)
    }
}
