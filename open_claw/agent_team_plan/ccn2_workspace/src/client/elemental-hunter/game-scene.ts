// Elemental Hunter — Game Scene
// Main scene component extending BaseLayer
// Manages game loop, network communication, and coordinates renderers

import { _decorator, Component, Node, Prefab, instantiate } from 'cc';
import { BaseLayer } from '../../clientccn2/base/BaseLayer';
import { EventBus, EventKeys } from './event-bus';
import { GameState, PlayerState, TokenState, TileState, ArtifactType, ElementType, PlayerId } from './types';
import { BoardRenderer } from './board-renderer';
import { TokenRenderer } from './token-renderer';
import { DiceUI } from './dice-ui';
import { ElementQueueUI } from './element-queue-ui';
import { HUD } from './hud-renderer';
import { ArtifactUI } from './artifact-ui';
import { ComboAnimation } from './combo-animation';
import { NetworkService } from '../../clientccn2/services/NetworkService';
import { SceneManager } from '../../clientccn2/managers/SceneManager';
import { logger } from '../../clientccn2/utils/logger';

const { ccclass } = _decorator;

@ccclass('ElementalHunterGameScene')
export class GameScene extends BaseLayer {
  // --- Cocos nodes (assign in editor)
  @Component({ type: Node })
  boardNode!: Node;
  @Component({ type: Node })
  tokenContainer!: Node;
  @Component({ type: Node })
  diceNode!: Node;
  @Component({ type: Node })
  hudNode!: Node;
  @Component({ type: Node })
  artifactPopupNode!: Node;
  @Component({ type: Node })
  comboEffectNode!: Node;

  // --- Services
  private eventBus: EventBus = new EventBus();
  private network!: NetworkService;
  private boardRenderer!: BoardRenderer;
  private tokenRenderer!: TokenRenderer;
  private diceUI!: DiceUI;
  private elementQueueUI!: ElementQueueUI;
  private hud!: HUD;
  private artifactUI!: ArtifactUI;
  private comboAnim!: ComboAnimation;

  // --- Game state
  private gameState!: GameState;
  private selectedTokenId: string | null = null;
  private pendingArtifact: { playerId: PlayerId; tokenId: string } | null = null;

  protected onEnter(): void {
    super.onEnter();
    logger.info('[ElementalHunter] GameScene onEnter');

    // Initialize services
    this.network = NetworkService.getInstance();
    this.bindEvents();
    this.initRenderers();

    // Request game start or restore state
    this.network.send({ type: 'cmd', action: 'joinQueue' });
  }

  protected onExit(): void {
    this.unbindEvents();
    super.onExit();
  }

  private bindEvents(): void {
    const bus = this.eventBus;

    bus.on(EventKeys.GAME_START, this.handleGameStart.bind(this));
    bus.on(EventKeys.DICE_RESULT, this.handleDiceResult.bind(this));
    bus.on(EventKeys.TOKEN_MOVED, this.handleTokenMoved.bind(this));
    bus.on(EventKeys.TOKEN_SELECTED, this.handleTokenSelected.bind(this));
    bus.on(EventKeys.ELEMENT_COLLECTED, this.handleElementCollected.bind(this));
    bus.on(EventKeys.COMBO_TRIGGERED, this.handleComboTriggered.bind(this));
    bus.on(EventKeys.KICK_OCCURRED, this.handleKickOccurred.bind(this));
    bus.on(EventKeys.GOAL_REACHED, this.handleGoalReached.bind(this));
    bus.on(EventKeys.EMPTY_TILE_REACHED, this.handleEmptyTileReached.bind(this));
    bus.on(EventKeys.ARTIFACT_USED, this.handleArtifactUsed.bind(this));
    bus.on(EventKeys.TURN_END, this.handleTurnEnd.bind(this));
    bus.on(EventKeys.GAME_OVER, this.handleGameOver.bind(this));
    bus.on(EventKeys.ERROR, this.handleError.bind(this));

    // Wire network → event bus
    this.network.onMessage((msg) => {
      const { event, payload } = msg as { event: string; payload: any };
      if (bus.eventNames().includes(event)) {
        bus.emit(event, payload);
      } else {
        logger.warn('[ElementalHunter] Unknown event:', event);
      }
    });
  }

  private unbindEvents(): void {
    this.eventBus.removeAllListeners();
    this.network.offMessage();
  }

  private initRenderers(): void {
    this.boardRenderer = new BoardRenderer(this.boardNode);
    this.tokenRenderer = new TokenRenderer(this.tokenContainer);
    this.diceUI = new DiceUI(this.diceNode);
    this.elementQueueUI = new ElementQueueUI(this.node); // attach to scene root
    this.hud = new HUD(this.hudNode);
    this.artifactUI = new ArtifactUI(this.artifactPopupNode);
    this.comboAnim = new ComboAnimation(this.comboEffectNode);

    // Dice UI callbacks
    this.diceUI.onRoll = (powerRollRange?: [number, number]) => {
      this.network.send({
        type: 'cmd',
        action: 'rollDice',
        payload: { powerRollTarget: powerRollRange }
      });
    };

    this.diceUI.onPowerRollToggle = (enabled: boolean) => {
      // UI state only; no network call until roll
    };

    // Artifact UI callbacks
    this.artifactUI.onSelect = (artifact: ArtifactType, params?: any) => {
      if (this.pendingArtifact) {
        this.network.send({
          type: 'cmd',
          action: 'selectArtifact',
          payload: { artifactType: artifact, params }
        });
        this.pendingArtifact = null;
        this.artifactUI.hide();
      }
    };

    // Token selection
    this.tokenRenderer.onTokenClick = (tokenId: string) => {
      if (this.gameState.phase !== 'playing') return;
      if (this.gameState.currentTurn !== this.getLocalPlayerId()) return; // only local player

      this.network.send({
        type: 'cmd',
        action: 'selectToken',
        payload: { tokenId }
      });
    };
  }

  // ==================== Event Handlers ====================

  private handleGameStart(payload: any): void {
    logger.info('[ElementalHunter] Game started', payload);
    // Payload matches GameStartEvent
    this.gameState = {
      matchId: '', // will be set by server
      phase: 'playing',
      level: payload.level,
      currentTurn: payload.character.currentTurn || PlayerId.P1,
      currentRound: 1,
      maxRounds: payload.level === 1 ? 12 : (payload.level === 2 ? 15 : 15),
      players: this.initializePlayers(payload),
      tokens: this.initializeTokens(payload.tokenPositions),
      board: this.initializeBoard(),
      winner: null,
      endReason: null,
      matchStartTime: Date.now(),
      matchEndTime: null
    };

    this.boardRenderer.render(this.gameState.board);
    this.tokenRenderer.render(this.gameState.tokens, this.gameState.board);
    this.hud.updateAll(this.gameState.players);
    this.diceUI.setEnabled(true);
    this.diceUI.reset();

    // Initial element queue from GDD: 1 affinity element at start
    // Already in players[].elementQueue from server
  }

  private handleDiceResult(payload: any): void {
    const event = payload as any; // typed as DiceResultEvent
    this.diceUI.showResult(event.values, event.isDouble, event.doubleRollCooldown);
    this.hud.updateConsecutiveRolls(this.gameState.currentTurn, event.consecutiveRollsThisTurn || 0);
  }

  private handleTokenSelected(payload: any): void {
    const { tokenId, playerId } = payload as { tokenId: string; playerId: PlayerId };
    this.selectedTokenId = tokenId;
    this.tokenRenderer.highlightToken(tokenId, true);
    this.hud highlightSelection(playerId, tokenId); // TODO: implement
  }

  private handleTokenMoved(payload: any): void {
    const { tokenId, path, landedTile } = payload as { tokenId: string; path: number[]; landedTile: number };
    this.tokenRenderer.animateMovement(tokenId, path, () => {
      // After movement complete, token state already updated via gameState
      this.tokenRenderer.updateTokenPosition(tokenId, landedTile);
      this.hud.refresh(this.gameState.players);
    });
  }

  private handleElementCollected(payload: any): void {
    const { playerId, element, affinityBonus, queueState } = payload as any;
    // Visual feedback
    const tileId = this.gameState.tokens.find(t => t.owner === playerId && t.tileId === payload.tileId)?.tileId || 0;
    this.boardRenderer.showElementGain(tileId, element, affinityBonus);
    this.elementQueueUI.updateQueue(playerId, queueState);
    if (affinityBonus) {
      this.hud.showATKBuff(playerId);
    } else {
      this.hud.showMAGBuff(playerId);
    }
  }

  private handleComboTriggered(payload: any): void {
    const { playerId, type, elements, rewards, cascade } = payload as any;
    this.comboAnim.playCombo(type, playerId, () => {
      this.hud.updateComboCount(playerId, this.gameState.players[playerId].comboCount);
      this.elementQueueUI.updateQueue(playerId, this.gameState.players[playerId].elementQueue);
    });
    // Team-wide ATK bonus from rewards already applied in state; reflect in HUD
    this.hud.refresh(this.gameState.players);
  }

  private handleKickOccurred(payload: any): void {
    const { attacker, defender, damage, defenderNewTile } = payload as any;
    this.tokenRenderer.showKickDamage(attacker.tokenId, defender.tokenId, damage);
    this.tokenRenderer.animateKickPush(defender.tokenId, defenderNewTile);
    this.hud.damagePlayer(defender.owner, damage);
  }

  private handleGoalReached(payload: any): void {
    const { tokenId, playerId, chosenElement, attackDamage, defenderHpAfterAttack } = payload as any;
    // Show element selection UI (automatic per GDD; server chooses? Actually player selects)
    // In GDD: "player chọn 1 nguyên tố thêm vào cuối Element Queue"
    // Prompt player to pick element
    this.diceUI.setEnabled(false);
    // For now, auto-pick affinity element (simplified)
    this.network.send({
      type: 'cmd',
      action: 'selectGoalElement',
      payload: { element: this.gameState.players[playerId].elementAffinity }
    });

    // Show attack animation
    this.comboAnim.playGoalAttack(attackDamage, () => {
      this.hud.damagePlayer(PlayerId.P1 === playerId ? PlayerId.P2 : PlayerId.P1, attackDamage);
    });
  }

  private handleEmptyTileReached(payload: any): void {
    const { playerId, artifactsAvailable } = payload as { playerId: PlayerId; artifactsAvailable: ArtifactType[] };
    this.pendingArtifact = { playerId, tokenId: '' }; // tokenId can be derived from selection
    this.artifactUI.show(artifactsAvailable);
  }

  private handleArtifactUsed(payload: any): void {
    const { playerId, artifactType, queueState } = payload as any;
    this.artifactUI.hide();
    this.elementQueueUI.updateQueue(playerId, queueState);
    this.hud.updateArtifactUsed(playerId, artifactType);
  }

  private handleTurnEnd(payload: any): void {
    const { nextPlayer, currentRound } = payload as any;
    this.gameState.currentTurn = nextPlayer;
    this.gameState.currentRound = currentRound;
    this.selectedTokenId = null;
    this.tokenRenderer.clearHighlights();
    this.diceUI.reset();

    if (nextPlayer === this.getLocalPlayerId()) {
      this.diceUI.setEnabled(true);
    } else {
      this.diceUI.setEnabled(false);
    }

    this.hud.updateTurn(nextPlayer, currentRound);
  }

  private handleGameOver(payload: any): void {
    const { winner, reason, finalHp } = payload as any;
    this.gameState.winner = winner;
    this.gameState.endReason = reason;
    this.gameState.matchEndTime = Date.now();
    this.diceUI.setEnabled(false);
    this.hud.showGameOver(winner, reason, finalHp);

    // Auto-return to lobby after delay
    this.scheduleOnce(() => {
      SceneManager.getInstance().loadScene('LobbyScene');
    }, 5);
  }

  private handleError(payload: any): void {
    logger.error('[ElementalHunter] Error event:', payload);
    // Show error popup
  }

  // ==================== Helpers ====================

  private initializePlayers(payload: any): Record<PlayerId, PlayerState> {
    // Build PlayerState from server payload (GDD says server sends state)
    // Use payload.players if available; else construct
    const players: Record<PlayerId, PlayerState> = {} as any;
    (Object.keys(payload.players) as PlayerId[]).forEach(pid => {
      const p = payload.players[pid];
      players[pid] = {
        playerId: pid,
        hp: p.hp,
        mag: p.mag,
        magCap: p.magCap,
        elementQueue: p.elementQueue,
        elementAffinity: p.elementAffinity,
        comboCount: p.comboCount,
        comboTier: p.comboTier,
        tileGainMultiplier: p.tileGainMultiplier,
        doubleRollCooldown: p.doubleRollCooldown,
        consecutiveRollsThisTurn: p.consecutiveRollsThisTurn,
        ultimateExtraRolls: p.ultimateExtraRolls,
        emptyTileVisits: p.emptyTileVisits,
        kickCount: p.kickCount,
        finishedHorseCount: p.finishedHorseCount
      };
    });
    return players;
  }

  private initializeTokens(tokenPositions: Record<string, number>): TokenState[] {
    const tokens: TokenState[] = [];
    Object.entries(tokenPositions).forEach(([tokenId, tileId]) => {
      const owner = tokenId.startsWith('P1_') ? PlayerId.P1 : PlayerId.P2;
      tokens.push({
        tokenId,
        owner,
        tileId,
        atk: 0,
        frozenRounds: 0
      });
    });
    return tokens;
  }

  private initializeBoard(): TileState[] {
    // Server should send board state; if not, use static map (GDD has fixed layout)
    // For now, assume server provides
    return this.gameState.board; // will be overwritten by server payload
  }

  private getLocalPlayerId(): PlayerId {
    // Determine local player from network session (e.g., match assignment)
    // For now return P1 if currentTurn is P1 and we're hosting? Need better logic.
    return this.gameState?.currentTurn || PlayerId.P1;
  }
}
