package com.ccn2.server.elementalhunter

import kotlinx.coroutines.flow.Flow

/**
 * EventListener interface for external observers of GameRoom events.
 * Can be implemented by analytics, logging, or admin modules.
 */
interface ElementalHunterEventListener {
    /**
     * Called when a game event is emitted.
     */
    fun onEvent(event: GameEvent, room: GameRoom)

    /**
     * Called when a room is created.
     */
    fun onRoomCreated(room: GameRoom)

    /**
     * Called when a room ends.
     */
    fun onRoomEnded(room: GameRoom, winner: String?, reason: EndReason)

    companion object {
        val NoOp: ElementalHunterEventListener = object : ElementalHunterEventListener {
            override fun onEvent(event: GameEvent, room: GameRoom) {}
            override fun onRoomCreated(room: GameRoom) {}
            override fun onRoomEnded(room: GameRoom, winner: String?, reason: EndReason) {}
        }
    }
}

/**
 * EventBroadcaster - internal helper to dispatch events to listeners.
 */
internal class EventBroadcaster(
    private val listeners: List<ElementalHunterEventListener> = emptyList()
) {
    suspend fun broadcast(event: GameEvent, room: GameRoom) {
        listeners.forEach { it.onEvent(event, room) }
    }
}
