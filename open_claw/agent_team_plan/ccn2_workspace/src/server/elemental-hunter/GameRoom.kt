package com.ccn2.server.elementalhunter

import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.channels.ReceiveChannel
import kotlinx.coroutines.channels.SendChannel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.Serializable
import kotlin.random.Random

/**
 * GameRoom - Actor per Elemental Hunter match.
 *
 * Holds authoritative GameState, processes commands serially,
 * broadcasts events to connected clients. All game logic
 * happens here or in delegated engine classes.
 *
 * Actor model: single-threaded per room, suspend functions only,
 * never blocking (use withContext(Dispatchers.Default) for CPU work).
 */
@OptIn(ExperimentalCoroutinesApi::class)
class GameRoom(
    private val matchId: String,
    private val config: GameConfig,
    private val rng: Random = Random.Default
) : CoroutineScope by CoroutineScope(Dispatchers.Default + SupervisorJob()) {

    // Command channel: receives all player actions
    private val commandChannel: SendChannel<GameCommand> = Channel<GameCommand>(Channel.UNLIMITED)

    // Event broadcast channel: websocket connections read from this
    private val eventChannel: MutableStateFlow<List<GameEvent>> = MutableStateFlow(emptyList())

    // Current authoritative state (immutable updates only)
    private val _state: MutableStateFlow<GameState> = MutableStateFlow(createInitialState())
    val state: StateFlow<GameState> = _state.asStateFlow()

    init {
        launch {
            commandChannel.consumeEach { command ->
                try {
                    when (command) {
                        is GameCommand.StartGame -> handleStartGame(command.player1, command.player2)
                        is GameCommand.RollDice -> handleRollDice(command.playerId, command.powerRollRange)
                        is GameCommand.SelectToken -> handleSelectToken(command.playerId, command.tokenId)
                        is GameCommand.Move -> handleMove(command.playerId, command.steps)
                        is GameCommand.SelectArtifact -> handleSelectArtifact(command.playerId, command.artifactType)
                        is GameCommand.ActivateUltimate -> handleActivateUltimate(command.playerId)
                        is GameCommand.SelectGoalElement -> handleSelectGoalElement(command.playerId, command.element)
                    }
                } catch (e: Exception) {
                    logger.error("Error processing command $command", e)
                    sendEvent(GameEvent.ErrorOccurred(command.playerId, e.message ?: "Unknown error"))
                }
            }
        }
    }

    // Send command to this room (called from request handlers)
    suspend fun dispatch(command: GameCommand) {
        commandChannel.send(command)
    }

    // Subscribe to events (WebSocket connections)
    fun events(): StateFlow<List<GameEvent>> = eventChannel

    private suspend fun sendEvent(event: GameEvent) {
        _state.value = _state.value.copy( // state snapshot with new event
            lastEvent = event
        )
        eventChannel.value = eventChannel.value + event
        // TODO: broadcast to specific player's WS connection
    }

    private fun createInitialState(): GameState {
        return GameState(
            matchId = matchId,
            phase = GamePhase.LOBBY,
            currentTurn = null,
            currentRound = 0,
            maxRounds = config.level.maxRounds,
            players = emptyMap(),
            tokens = emptyList(),
            board = BoardBuilder.buildBoard(), // static board configuration
            winner = null,
            endReason = null,
            matchStartTime = null,
            matchEndTime = null
        )
    }

    // ========== Command Handlers ==========

    private suspend fun handleStartGame(player1: String, player2: String) {
        require(_state.value.phase == GamePhase.LOBBY) { "Game already started" }

        val players = mapOf(
            player1 to createPlayerState(player1, config.character.affinity),
            player2 to createPlayerState(player2, config.character.affinity)
        )

        val tokens = createTokens(player1, player2)
        val board = BoardBuilder.buildBoard()

        _state.value = _state.value.copy(
            phase = GamePhase.PLAYING,
            currentTurn = player1,
            currentRound = 1,
            players = players,
            tokens = tokens,
            board = board,
            matchStartTime = System.currentTimeMillis()
        )

        sendEvent(GameEvent.GameStarted(level = config.level.level, players = players.keys.toList()))
    }

    private suspend fun handleRollDice(playerId: String, powerRollRange: Pair<Int, Int>?) {
        val state = _state.value
        val player = state.players[playerId] ?: throw IllegalArgumentException("Player not found")
        require(state.currentTurn == playerId) { "Not your turn" }
        require(player.consecutiveRollsThisTurn < BalanceConfig.MAX_CONSECUTIVE_ROLLS) {
            "Max consecutive rolls reached"
        }

        val (d1, d2) = if (powerRollRange != null) {
            // Power Roll: 20% chance to land in target range
            val targetSum = (powerRollRange.first..powerRollRange.second).random(rng)
            val isHit = rng.nextDouble() < BalanceConfig.POWER_ROLL_ACCURACY
            if (isHit) targetSum to targetSum else rng.nextInt(2, 13) to rng.nextInt(2, 13)
        } else {
            rng.nextInt(1, 7) to rng.nextInt(1, 7)
        }
        val sum = d1 + d2
        val isDouble = d1 == d2

        // Update player state
        val updatedPlayer = player.copy(
            consecutiveRollsThisTurn = player.consecutiveRollsThisTurn + 1,
            lastDiceResult = Pair(d1, d2)
        )

        val newState = state.copy(
            players = state.players + (playerId to updatedPlayer)
        )
        _state.value = newState

        sendEvent(
            GameEvent.DiceResult(
                playerId = playerId,
                dice = listOf(d1, d2),
                sum = sum,
                isDouble = isDouble,
                powerRollHit = powerRollRange?.let { (d1..d2).contains(sum) } ?: false
            )
        )
    }

    private suspend fun handleSelectToken(playerId: String, tokenId: String) {
        val state = _state.value
        val token = state.tokens.find { it.tokenId == tokenId && it.owner == playerId }
            ?: throw IllegalArgumentException("Invalid token selection")

        val player = state.players[playerId]!!
        require(token.frozenRounds <= 0) { "Token is frozen" }

        // Check path obstruction: same team tokens on path? (except safe zones)
        // Simplified: assume client validates mostly

        val updatedPlayer = player.copy(selectedTokenId = tokenId)
        _state.value = state.copy(
            players = state.players + (playerId to updatedPlayer)
        )

        sendEvent(GameEvent.TokenSelected(playerId, tokenId))
    }

    private suspend fun handleMove(playerId: String, steps: Int) {
        val state = _state.value
        val player = state.players[playerId]!!
        val tokenId = player.selectedTokenId
            ?: throw IllegalArgumentException("No token selected")
        val token = state.tokens.find { it.tokenId == tokenId }
            ?: throw IllegalArgumentException("Token not found")

        val path = MovementValidator.computePath(token.tileId, steps, playerId, state.board)
        require(path.isNotEmpty()) { "Invalid path" }

        // Step through each tile
        var currentToken = token
        for (tileId in path) {
            currentToken = processTileLanding(state, currentToken, tileId)
        }

        // Update token position
        val updatedTokens = state.tokens.map { if (it.tokenId == tokenId) currentToken else it }

        val updatedPlayer = player.copy(
            selectedTokenId = null, // deselect after move
            consecutiveRollsThisTurn = 0 // end of move
        )

        val newState = state.copy(
            tokens = updatedTokens,
            players = state.players + (playerId to updatedPlayer)
        )
        _state.value = newState

        sendEvent(GameEvent.TokenMoved(playerId, tokenId, path, currentToken.tileId))

        // Check winner after move
        checkWinCondition(newState)
    }

    private fun processTileLanding(state: GameState, token: TokenState, tileId: Int): TokenState {
        val tile = state.board.find { it.tileId == tileId } ?: return token
        val player = state.players[token.owner]!!

        return when (tile.tileType) {
            TileType.ELEMENTAL -> {
                val element = tile.currentElement ?: tile.baseElement
                    ?: throw IllegalStateException("Elemental tile has no element")
                ElementEngine.collectElement(player, element, config.balance)
                token // token unchanged; element added to player queue
            }
            TileType.EMPTY -> {
                // Artifact selection event sent; player responds with CMD_SELECT_ARTIFACT
                sendEvent(GameEvent.EmptyTileReached(token.owner, token.tokenId, tileId))
                token
            }
            TileType.FINAL_GOAL -> {
                // require player to select element? GDD: add chosen element at Final Goal
                // Auto-add affinity element and attack opponent
                val chosenElement = player.elementAffinity
                ElementEngine.collectElement(player, chosenElement, config.balance)
                val opponent = state.players.values.first { it.playerId != token.owner }
                val damage = token.atk + (player.comboTier * BalanceConfig.COMBO_T1_ATK_BONUS) // simplified
                val newOpponentHp = opponent.hp - damage
                val updatedOpponent = opponent.copy(hp = newOpponentHp.coerceAtLeast(0))

                // Move token to owner's Safe Zone
                val safeZoneTile = MovementValidator.getNearestSafeZone(token.tileId, token.owner, state.board)
                val updatedToken = token.copy(tileId = safeZoneTile)

                // Update opponent HP
                val newState = state.copy(
                    players = state.players + (opponent.playerId to updatedOpponent)
                )
                _state.value = newState

                sendEvent(
                    GameEvent.GoalReached(
                        tokenId = token.tokenId,
                        playerId = token.owner,
                        elementChosen = chosenElement,
                        damageDealt = damage,
                        opponentNewHp = updatedOpponent.hp
                    )
                )
                updatedToken
            }
            else -> {
                // Check for opponent token to kick
                val defender = state.tokens.firstOrNull { it.tileId == tileId && it.owner != token.owner }
                if (defender != null && !MovementValidator.isSafeZone(tileId, state.board)) {
                    CombatEngine.executeKick(state, token, defender)
                } else {
                    token
                }
            }
        }
    }

    private suspend fun handleSelectGoalElement(playerId: String, element: ElementType) {
        // Handle when Final Goal reached and player selects element
        // Should be integrated into handleMove flow, but may be separate command
        sendEvent(GameEvent.Info(playerId, "Goal element selection not implemented"))
    }

    private suspend fun handleSelectArtifact(playerId: String, artifactType: ArtifactType) {
        val state = _state.value
        val player = state.players[playerId]!!
        val available = ArtifactHandler.getAvailableArtifacts(player, config.level)

        require(artifactType in available) { "Artifact not available" }

        ArtifactHandler.executeArtifact(state, playerId, artifactType)

        val updatedPlayer = player.copy(emptyTileVisits = player.emptyTileVisits + 1)
        _state.value = state.copy(players = state.players + (playerId to updatedPlayer))

        sendEvent(GameEvent.ArtifactUsed(playerId, artifactType))
    }

    private suspend fun handleActivateUltimate(playerId: String) {
        val state = _state.value
        val player = state.players[playerId]!!

        require(player.mag >= BalanceConfig.ULTIMATE_COST_EXTRA_ROLL) { "Insufficient MAG" }
        require(player.consecutiveRollsThisTurn < BalanceConfig.MAX_CONSECUTIVE_ROLLS) {
            "Max consecutive rolls reached"
        }

        val updatedPlayer = player.copy(
            mag = player.mag - BalanceConfig.ULTIMATE_COST_EXTRA_ROLL,
            ultimateExtraRolls = player.ultimateExtraRolls + 1
        )

        _state.value = state.copy(players = state.players + (playerId to updatedPlayer))

        sendEvent(GameEvent.UltimateActivated(playerId))

        // Grant extra turn after current move sequence ends; handled in endTurn
    }

    private suspend fun checkWinCondition(state: GameState) {
        val opponent = state.players.values.firstOrNull { it.hp <= 0 }
        if (opponent != null) {
            val winner = state.players.values.first { it.playerId != opponent.playerId }
            endGame(winner.playerId, EndReason.KO)
            return
        }

        // Round limit check
        if (state.currentRound >= state.maxRounds) {
            val winner = state.players.values.maxByOrNull { it.hp }?.playerId
            endGame(winner, EndReason.ROUND_LIMIT)
        }
    }

    private suspend fun endGame(winner: String?, reason: EndReason) {
        val newState = _state.value.copy(
            phase = GamePhase.ENDED,
            winner = winner,
            endReason = reason,
            matchEndTime = System.currentTimeMillis()
        )
        _state.value = newState
        sendEvent(GameEvent.GameOver(winner, reason))
    }

    private fun createPlayerState(playerId: String, affinity: ElementType): PlayerState {
        return PlayerState(
            playerId = playerId,
            hp = config.character.hp,
            mag = 0,
            magCap = BalanceConfig.DEFAULT_MAG_CAP,
            elementQueue = ArrayDeque(),
            elementAffinity = affinity,
            comboCount = 0,
            comboTier = 0,
            tileGainMultiplier = 1,
            doubleRollCooldown = 0,
            consecutiveRollsThisTurn = 0,
            ultimateExtraRolls = 0,
            emptyTileVisits = 0,
            kickCount = 0,
            finishedHorseCount = 0,
            selectedTokenId = null,
            lastDiceResult = null
        )
    }

    private fun createTokens(player1: String, player2: String): List<TokenState> {
        // 3 tokens per player, starting positions from BoardBuilder
        return listOf(
            TokenState("${player1}_1", player1, 51, config.character.atk, 0),
            TokenState("${player1}_2", player1, 52, config.character.atk, 0),
            TokenState("${player1}_3", player1, 53, config.character.atk, 0),
            TokenState("${player2}_1", player2, 0, config.character.atk, 0),
            TokenState("${player2}_2", player2, 1, config.character.atk, 0),
            TokenState("${player2}_3", player2, 2, config.character.atk, 0)
        )
    }

    companion object {
        private val logger = mu.KotlinLogging.logger {}
    }
}

// ========== Commands ==========

sealed class GameCommand {
    data class StartGame(val player1: String, val player2: String) : GameCommand()
    data class RollDice(val playerId: String, val powerRollRange: Pair<Int, Int>? = null) : GameCommand()
    data class SelectToken(val playerId: String, val tokenId: String) : GameCommand()
    data class Move(val playerId: String, val steps: Int) : GameCommand()
    data class SelectArtifact(val playerId: String, val artifactType: ArtifactType) : GameCommand()
    data class ActivateUltimate(val playerId: String) : GameCommand()
    data class SelectGoalElement(val playerId: String, val element: ElementType) : GameCommand()
}

// ========== Events ==========

@Serializable
sealed class GameEvent {
    @Serializable
    data class GameStarted(
        val level: Int,
        val players: List<String>
    ) : GameEvent()

    @Serializable
    data class DiceResult(
        val playerId: String,
        val dice: List<Int>,
        val sum: Int,
        val isDouble: Boolean,
        val powerRollHit: Boolean
    ) : GameEvent()

    @Serializable
    data class TokenSelected(val playerId: String, val tokenId: String) : GameEvent()

    @Serializable
    data class TokenMoved(
        val playerId: String,
        val tokenId: String,
        val path: List<Int>,
        val newTileId: Int
    ) : GameEvent()

    @Serializable
    data class ElementCollected(
        val playerId: String,
        val element: ElementType,
        val queueState: List<ElementType>
    ) : GameEvent()

    @Serializable
    data class ComboTriggered(
        val playerId: String,
        val type: ComboType,
        val elements: List<ElementType>,
        val rewards: ComboRewards,
        val cascade: Boolean = false
    ) : GameEvent()

    @Serializable
    data class KickOccurred(
        val attackerTokenId: String,
        val defenderTokenId: String,
        val damage: Int,
        val defenderNewTile: Int
    ) : GameEvent()

    @Serializable
    data class GoalReached(
        val tokenId: String,
        val playerId: String,
        val elementChosen: ElementType,
        val damageDealt: Int,
        val opponentNewHp: Int
    ) : GameEvent()

    @Serializable
    data class EmptyTileReached(
        val playerId: String,
        val tokenId: String,
        val tileId: Int,
        val artifactsAvailable: List<ArtifactType> = emptyList()
    ) : GameEvent()

    @Serializable
    data class ArtifactUsed(
        val playerId: String,
        val artifactType: ArtifactType
    ) : GameEvent()

    @Serializable
    data class UltimateActivated(val playerId: String) : GameEvent()

    @Serializable
    data class TurnEnd(
        val nextPlayer: String,
        val currentRound: Int
    ) : GameEvent()

    @Serializable
    data class GameOver(
        val winner: String?,
        val reason: EndReason
    ) : GameEvent()

    @Serializable
    data class ErrorOccurred(
        val playerId: String,
        val message: String
    ) : GameEvent()

    @Serializable
    data class Info(val playerId: String, val message: String) : GameEvent()
}

// ========== Data Models ==========

@Serializable
enum class GamePhase { LOBBY, PLAYING, ENDED }

@Serializable
enum class TileType { ELEMENTAL, EMPTY, SAFE_ZONE, START, NORMAL }

@Serializable
enum class ElementType { FIRE, ICE, GRASS, ROCK }

@Serializable
enum class ArtifactType { SWAP, CHANGE, CHARGE }

@Serializable
enum class ComboType { C3, C4 }

@Serializable
enum class EndReason { KO, ROUND_LIMIT }

@Serializable
data class GameState(
    val matchId: String,
    val phase: GamePhase,
    val currentTurn: String?,
    val currentRound: Int,
    val maxRounds: Int,
    val players: Map<String, PlayerState>,
    val tokens: List<TokenState>,
    val board: List<TileState>,
    val winner: String?,
    val endReason: EndReason?,
    val matchStartTime: Long?,
    val matchEndTime: Long?,
    val lastEvent: GameEvent? = null
)

@Serializable
data class PlayerState(
    val playerId: String,
    val hp: Int,
    val mag: Int,
    val magCap: Int,
    val elementQueue: ArrayDeque<ElementType>,
    val elementAffinity: ElementType,
    val comboCount: Int,
    val comboTier: Int,
    val tileGainMultiplier: Int,
    val doubleRollCooldown: Int,
    val consecutiveRollsThisTurn: Int,
    val ultimateExtraRolls: Int,
    val emptyTileVisits: Int,
    val kickCount: Int,
    val finishedHorseCount: Int,
    val selectedTokenId: String?,
    val lastDiceResult: Pair<Int, Int>?
) {
    // Summon method for convenience
    val atkBonus: Int
        get() = when (comboTier) {
            1 -> BalanceConfig.COMBO_T1_ATK_BONUS
            2 -> (BalanceConfig.COMBO_T1_ATK_BONUS * 1.5).toInt()
            3 -> BalanceConfig.COMBO_T1_ATK_BONUS * 2
            else -> 0
        }
}

@Serializable
data class TokenState(
    val tokenId: String,
    val owner: String,
    val tileId: Int,
    val atk: Int,
    val frozenRounds: Int
)

@Serializable
data class TileState(
    val tileId: Int,
    val tileType: TileType,
    val baseElement: ElementType?,
    val currentElement: ElementType?
)

// ========== Config Classes ==========

data class GameConfig(
    val character: CharacterConfig,
    val level: LevelConfig,
    val balance: BalanceConfig
)

@Serializable
data class CharacterConfig(
    val affinity: ElementType,
    val atk: Int,
    val mag: Int,
    val hp: Int,
    val ultimateType: String,
    val ultimateCost: Int
)

@Serializable
data class LevelConfig(
    val level: Int,
    val maxRounds: Int,
    val comboTierMax: Int,
    val artifactSlots: Int
)

object BalanceConfig {
    const val MAX_CONSECUTIVE_ROLLS = 3
    const val DOUBLE_ROLL_COOLDOWN_ROUNDS = 2
    const val COMBO_T1_ATK_BONUS = 150
    val COMBO_T3_ATK_MULTIPLIER = 1.5
    const val ULTIMATE_COST_EXTRA_ROLL = 50
    const val POWER_ROLL_ACCURACY = 0.20
    const val TILE_REWARD_ATK = 30   // = character.atk default
    const val TILE_REWARD_MAG = 10   // = character.mag default
    const val TOKEN_COUNT = 3
    const val DEFAULT_MAG_CAP = 100
    // Note: magCap and maxElementQueue should come from balance file
    var magCap: Int = DEFAULT_MAG_CAP
    var maxElementQueue: Int = 8
}
