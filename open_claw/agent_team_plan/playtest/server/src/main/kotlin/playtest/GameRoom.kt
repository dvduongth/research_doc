package playtest

import io.ktor.websocket.*
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*
import kotlin.random.Random

class GameRoom(
    val roomId: String,
    private val config: GameConfig,
    private val broadcastFn: suspend (String) -> Unit,
    private val rng: Random = Random.Default
) : CoroutineScope by CoroutineScope(Dispatchers.Default + SupervisorJob()) {

    sealed class Cmd {
        data class Join(val playerId: String) : Cmd()
        data class RollDice(val playerId: String) : Cmd()
        data class SelectToken(val playerId: String, val tokenId: String) : Cmd()
        data class Move(val playerId: String) : Cmd()
    }

    private val cmdChannel = Channel<Cmd>(Channel.UNLIMITED)
    val playerIds = mutableListOf<String>()

    // Simple in-memory game state for playtest
    private var phase = "LOBBY"
    private var currentTurn: String? = null
    private var lastRoll: Int = 0
    // playerId -> { tokenId -> tileId }
    private val tokens = mutableMapOf<String, MutableMap<String, Int>>()
    private val playerHp = mutableMapOf<String, Int>()
    private val selectedToken = mutableMapOf<String, String?>()

    init {
        launch { processCommands() }
    }

    fun submit(cmd: Cmd) { cmdChannel.trySend(cmd) }

    private suspend fun processCommands() {
        for (cmd in cmdChannel) {
            try {
                when (cmd) {
                    is Cmd.Join        -> handleJoin(cmd.playerId)
                    is Cmd.RollDice    -> handleRollDice(cmd.playerId)
                    is Cmd.SelectToken -> handleSelectToken(cmd.playerId, cmd.tokenId)
                    is Cmd.Move        -> handleMove(cmd.playerId)
                }
            } catch (e: Exception) {
                broadcastFn(ServerEvents.error(e.message ?: "Unknown error"))
            }
        }
    }

    private suspend fun handleJoin(playerId: String) {
        if (playerIds.contains(playerId)) {
            // Reconnect: just resend game state
            broadcastGameState()
            return
        }
        if (playerIds.size >= 2) {
            broadcastFn(ServerEvents.error("Room full"))
            return
        }
        playerIds.add(playerId)
        val startTile = if (playerIds.size == 1) 51 else 0
        tokens[playerId] = mutableMapOf("tokenA" to startTile, "tokenB" to (startTile + 1))
        playerHp[playerId] = 100
        selectedToken[playerId] = null
        broadcastGameState()

        if (playerIds.size == 2) {
            phase = "PLAYING"
            currentTurn = playerIds[0]
            broadcastGameState()
        }
    }

    private suspend fun handleRollDice(playerId: String) {
        require(phase == "PLAYING") { "Game not started" }
        require(currentTurn == playerId) { "Not your turn" }

        val d1 = rng.nextInt(1, 7)
        val d2 = rng.nextInt(1, 7)
        lastRoll = d1 + d2
        val isDouble = d1 == d2
        broadcastFn(ServerEvents.diceResult(playerId, listOf(d1, d2), lastRoll, isDouble))
    }

    private suspend fun handleSelectToken(playerId: String, tokenId: String) {
        require(phase == "PLAYING") { "Game not started" }
        require(currentTurn == playerId) { "Not your turn" }
        val playerTokens = tokens[playerId] ?: error("Player not found")
        require(playerTokens.containsKey(tokenId)) { "Invalid token: $tokenId" }
        selectedToken[playerId] = tokenId
        broadcastFn(ServerEvents.tokenSelected(playerId, tokenId))
    }

    private suspend fun handleMove(playerId: String) {
        require(phase == "PLAYING") { "Game not started" }
        require(currentTurn == playerId) { "Not your turn" }
        require(lastRoll > 0) { "Must roll dice first" }
        val tokenId = selectedToken[playerId] ?: error("No token selected")
        val playerTokens = tokens[playerId] ?: error("Player not found")
        val fromTile = playerTokens[tokenId] ?: error("Token not found")

        // Simple linear movement (wrap at 60)
        val toTile = (fromTile + lastRoll) % 61
        playerTokens[tokenId] = toTile
        broadcastFn(ServerEvents.moveResult(playerId, tokenId, fromTile, toTile))

        // Check kick: opponent token on same tile?
        val opponentId = playerIds.first { it != playerId }
        val opponentTokens = tokens[opponentId] ?: emptyMap<String, Int>()
        val board = BoardBuilder.buildBoard()
        val isSafe = board.find { it.tileId == toTile }?.tileType == TileType.SAFE_ZONE

        if (!isSafe) {
            opponentTokens.forEach { (opTokId, opTile) ->
                if (opTile == toTile) {
                    val returnTo = if (opponentId == playerIds[0]) 51 else 0
                    (tokens[opponentId] as MutableMap)[opTokId] = returnTo
                    broadcastFn(ServerEvents.kick(playerId, opponentId, opTokId, returnTo))
                }
            }
        }

        // Check win: reached FINAL_GOAL tile
        val tileType = board.find { it.tileId == toTile }?.tileType
        if (tileType == TileType.FINAL_GOAL) {
            phase = "DONE"
            broadcastFn(ServerEvents.win(playerId))
            return
        }

        // Advance turn
        selectedToken[playerId] = null
        lastRoll = 0
        currentTurn = opponentId
        broadcastFn(ServerEvents.turnChange(opponentId))
    }

    private suspend fun broadcastGameState() {
        val boardTiles = BoardBuilder.buildBoard().map { tile ->
            mapOf(
                "tileId" to tile.tileId.toString(),
                "tileType" to tile.tileType.name,
                "element" to (tile.baseElement?.name ?: "NONE")
            )
        }

        val playersData = playerIds.map { pid ->
            val toks = tokens[pid] ?: emptyMap()
            mapOf(
                "playerId" to pid,
                "hp" to (playerHp[pid] ?: 100).toString(),
                "tokens" to toks.entries.joinToString(";") { "${it.key}:${it.value}" }
            )
        }

        val roomData = mapOf(
            "roomId" to roomId,
            "phase" to phase,
            "currentTurn" to (currentTurn ?: ""),
            "playerCount" to playerIds.size.toString()
        )

        broadcastFn(ServerEvents.gameState(roomData, playersData, boardTiles))
    }

    fun close() {
        cmdChannel.close()
        cancel()
    }
}
