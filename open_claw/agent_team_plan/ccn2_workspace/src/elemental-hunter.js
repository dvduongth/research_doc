// src/elemental-hunter.js
// Part of CCN2 game engine
// Implements: Elemental Hunter (see design/GDD-FEATURE-elemental-hunter.md)
// Created by: agent_dev 2026-03-19

var ElementalHunter = (function() {
  // Private configuration (set in init)
  var CONFIG = null;

  // Element constants
  var ELEMENT = {
    FIRE: 'fire',
    ICE: 'ice',
    GRASS: 'grass',
    ROCK: 'rock'
  };

  // Tile type constants
  var TILE_TYPE = {
    ELEMENTAL: 'elemental',
    EMPTY: 'empty',
    SAFE_ZONE: 'safe',
    START: 'start',
    FINAL_GOAL: 'final_goal'
  };

  // Helper: check if all elements in an array are distinct
  function allDifferent(arr) {
    for (var i = 0; i < arr.length; i++) {
      for (var j = i + 1; j < arr.length; j++) {
        if (arr[i] === arr[j]) return false;
      }
    }
    return true;
  }

  // Get next position using board.getPath (like test mock) or fallback linear
  function getNextPosition(board, currentPos, steps) {
    if (board && typeof board.getPath === 'function') {
      return board.getPath(currentPos, steps);
    }
    // Fallback: simple linear wrap (for 61 cells)
    var newPos = currentPos + steps;
    var size = 61; // default board size
    return newPos % size;
  }

  // Find the nearest safe zone behind a position (search backwards)
  function findSafeZoneBehind(board, pos, playerId) {
    var size = CONFIG.BOARD_SIZE;
    var p = pos - 1;
    while (p >= 0) {
      var tile = board.getTile(p);
      if (tile && tile.isSafeZone) return p;
      p--;
    }
    // If none found, fallback to player's start tile
    return CONFIG.START_TILES[playerId];
  }

  // Process combos triggered by a new element addition
  // This function scans the entire queue, removes combo patterns, and applies rewards.
  // It tracks milestones to apply Tier2/Tier3 only once.
  function processCombos(player) {
    var queue = player.elementQueue;
    if (!queue || queue.length === 0) return;

    var newCombos = 0;
    var madeCombo = true;

    while (madeCombo) {
      madeCombo = false;
      // Scan for C3 (Triple Threat)
      for (var i = 0; i < queue.length - 2; i++) {
        if (queue[i] === queue[i + 1] && queue[i + 1] === queue[i + 2]) {
          queue.splice(i, 3);
          newCombos++;
          madeCombo = true;
          break; // restart scan after modification
        }
      }
      if (madeCombo) continue;
      // Scan for C4 (Elemental Master)
      for (var i = 0; i < queue.length - 3; i++) {
        var slice = queue.slice(i, i + 4);
        if (allDifferent(slice)) {
          queue.splice(i, 4);
          newCombos++;
          madeCombo = true;
          break;
        }
      }
    }

    if (newCombos === 0) return;

    // Update total combo count
    player.comboCount = (player.comboCount || 0) + newCombos;

    // Apply Tier1 reward: +150 ATK per combo (for each new combo)
    for (var c = 0; c < newCombos; c++) {
      for (var t = 0; t < player.tokens.length; t++) {
        player.tokens[t].atk = (player.tokens[t].atk || 0) + CONFIG.COMBO_T1_ATK_BONUS;
      }
    }

    // Tier2: first time reaching comboCount >= 2 and player level >= 2
    if (player.level >= 2 && player.comboCount >= 2 && !player._tier2Applied) {
      player.tileGainMultiplier = CONFIG.COMBO_T2_MULTIPLIER;
      player._tier2Applied = true;
    }

    // Tier3: first time reaching comboCount >= 3 and player level >= 3
    if (player.level >= 3 && player.comboCount >= 3 && !player._tier3Applied) {
      for (var t = 0; t < player.tokens.length; t++) {
        player.tokens[t].atk = Math.ceil(player.tokens[t].atk * CONFIG.COMBO_T3_ATK_MULTIPLIER);
      }
      player._tier3Applied = true;
    }

    // Emit combo event
    if (typeof gv !== 'undefined' && gv.bus && gv.bus.emit) {
      gv.bus.emit('elementalHunter:comboTriggered', {
        playerId: player.playerId,
        combos: newCombos,
        totalCombos: player.comboCount,
        rewards: ['tier1'] // per-combo rewards
      });
    }
  }

  return {
    /**
     * Initialize with game config
     * @param {Object} config - CONFIG object from rules.js (CONFIG.ELEMENTAL_HUNTER)
     */
    init: function(config) {
      CONFIG = config || {};
    },

    /**
     * Main action — implement GDD section 2 Core Mechanics
     * @param {Object} gameState - Contains players, board, etc.
     * @param {Object} params - { playerId, tokenId, diceRoll, artifactChoice?, goalChoice? }
     * @returns {boolean} success
     */
    execute: function(gameState, params) {
      if (!gameState || !params) return false;
      var playerId = params.playerId;
      var tokenId = params.tokenId;
      var diceRoll = params.diceRoll || 0;

      var players = gameState.players;
      if (!players || !players[playerId]) return false;
      var player = players[playerId];
      var tokens = player.tokens || [];

      // Find the token
      var token = null;
      for (var i = 0; i < tokens.length; i++) {
        if (tokens[i].tokenId === tokenId) {
          token = tokens[i];
          break;
        }
      }
      if (!token) return false;

      // Check if token is frozen
      if (token.frozenRounds > 0) return false;

      // Move the token
      var board = gameState.board;
      if (!board) return false;
      var newPos = getNextPosition(board, token.position, diceRoll);
      token.position = newPos;

      // Emit token moved event
      if (typeof gv !== 'undefined' && gv.bus && gv.bus.emit) {
        gv.bus.emit('elementalHunter:tokenMoved', {
          playerId: playerId,
          tokenId: tokenId,
          newPos: newPos
        });
      }

      // Process landing tile effects
      var tile = board.getTile(newPos);
      if (!tile) return true;

      // 1. Elemental Tile
      if (tile.type === TILE_TYPE.ELEMENTAL && tile.currentElement != null) {
        var element = tile.currentElement;
        tile.currentElement = null;

        // Ensure queue exists
        if (!player.elementQueue) player.elementQueue = [];
        player.elementQueue.push(element);
        // Enforce max queue size: if exceeds CONFIG.maxElementQueue, remove oldest
        if (CONFIG.maxElementQueue && player.elementQueue.length > CONFIG.maxElementQueue) {
          player.elementQueue.shift();
        }

        // Affinity check (use default multiplier 1 if not set)
        if (element === player.elementAffinity) {
          token.atk = (token.atk || 0) + player.character.atk * (player.tileGainMultiplier || 1);
        } else {
          player.mag = (player.mag || 0) + player.character.mag * (player.tileGainMultiplier || 1);
          if (CONFIG.magCap && player.mag > CONFIG.magCap) {
            player.mag = CONFIG.magCap;
          }
        }

        // Check combos
        processCombos(player);
        return true;
      }

      // 2. Empty Tile
      if (tile.type === TILE_TYPE.EMPTY) {
        player.emptyTileVisits = (player.emptyTileVisits || 0) + 1;

        // Determine available artifacts based on visits and level
        var levelKey = 'lv' + (player.level || 3);
        var levelConfig = (CONFIG.LEVELS && CONFIG.LEVELS[levelKey]) || CONFIG.LEVELS.lv3;
        var available = [];
        if (player.emptyTileVisits >= 1) available.push('Swap');
        if (player.emptyTileVisits >= 2) available.push('Change');
        if (player.emptyTileVisits >= 3) available.push('Charge');
        available = available.slice(0, levelConfig.artifactSlots);

        // Emit event for UI
        if (typeof gv !== 'undefined' && gv.bus && gv.bus.emit) {
          gv.bus.emit('elementalHunter:emptyTileReached', {
            playerId: playerId,
            emptyTileVisits: player.emptyTileVisits,
            availableArtifacts: available
          });
        }

        // If artifact choice provided, apply immediately (atomic flow)
        if (params.artifactChoice) {
          this.applyArtifact(player, params.artifactChoice);
        }
        return true;
      }

      // 3. Kick: check for opponent token on the tile (non-safe)
      var opponentToken = null;
      var opponentPlayerId = null;
      for (var pid in players) {
        if (pid == playerId) continue;
        var p = players[pid];
        var tokens2 = p.tokens || [];
        for (var j = 0; j < tokens2.length; j++) {
          if (tokens2[j].position === newPos) {
            opponentToken = tokens2[j];
            opponentPlayerId = pid;
            break;
          }
        }
        if (opponentToken) break;
      }
      if (opponentToken && opponentToken.frozenRounds === 0 && !tile.isSafeZone) {
        var damage = token.atk || 0;
        players[opponentPlayerId].hp -= damage;
        // Push opponent back to nearest safe zone behind
        var safePos = findSafeZoneBehind(board, opponentToken.position, opponentPlayerId);
        opponentToken.position = safePos;
        player.kickCount = (player.kickCount || 0) + 1;

        if (typeof gv !== 'undefined' && gv.bus && gv.bus.emit) {
          gv.bus.emit('elementalHunter:kick', {
            attackerId: playerId,
            defenderId: opponentPlayerId,
            damage: damage,
            defenderNewPos: safePos
          });
        }
        return true;
      }

      // 4. Final Goal
      if (tile.type === TILE_TYPE.FINAL_GOAL) {
        if (typeof gv !== 'undefined' && gv.bus && gv.bus.emit) {
          gv.bus.emit('elementalHunter:finalGoalReached', {
            playerId: playerId,
            tokenId: tokenId
          });
        }
        // If goal choice provided, apply reward immediately
        if (params.goalChoice) {
          this._applyFinalGoalReward(gameState, player, token, params.goalChoice);
        }
        return true;
      }

      // Other tile types (safe, start, etc.) have no effect
      return true;
    },

    /**
     * Apply an artifact effect to a player's element queue.
     * @param {Object} player - Player state object
     * @param {string} artifactType - 'Swap', 'Change', or 'Charge'
     * @param {Object} [options] - For Swap: { idx1, idx2 } (adjacent); for Change: { index, newElement }.
     */
    applyArtifact: function(player, artifactType, options) {
      options = options || {};
      var queue = player.elementQueue;
      if (!queue) return;

      if (artifactType === 'Swap') {
        if (queue.length < 2) return;
        var i1 = (options.idx1 !== undefined) ? options.idx1 : 0;
        var i2 = (options.idx2 !== undefined) ? options.idx2 : 1;
        // Ensure indices are adjacent and valid
        if (i1 < 0 || i2 < 0 || i1 >= queue.length || i2 >= queue.length || Math.abs(i1 - i2) !== 1) {
          return;
        }
        var tmp = queue[i1];
        queue[i1] = queue[i2];
        queue[i2] = tmp;
      } else if (artifactType === 'Change') {
        if (queue.length === 0) return;
        var idx = (options.index !== undefined) ? options.index : 0;
        var newElem = options.newElement;
        if (idx < 0 || idx >= queue.length || !newElem) return;
        // Validate element is one of the four types
        var validElements = [ELEMENT.FIRE, ELEMENT.ICE, ELEMENT.GRASS, ELEMENT.ROCK];
        if (validElements.indexOf(newElem) === -1) return;
        // Ensure it's a different element
        if (queue[idx] === newElem) return;
        queue[idx] = newElem;
      } else if (artifactType === 'Charge') {
        var affinity = player.elementAffinity;
        queue.push(affinity);
        // Enforce max queue size
        if (CONFIG.maxElementQueue && queue.length > CONFIG.maxElementQueue) {
          queue.shift();
        }
        // Charge adds an element, so trigger combos
        this._processCombos(player);
      }

      // Emit artifact applied event
      if (typeof gv !== 'undefined' && gv.bus && gv.bus.emit) {
        gv.bus.emit('elementalHunter:artifactApplied', {
          playerId: player.playerId,
          artifactType: artifactType
        });
      }
    },

    /**
     * Internal: Apply Final Goal reward (called after player chooses element).
     * @param {Object} gameState
     * @param {Object} player
     * @param {Object} token
     * @param {string} chosenElement
     */
    _applyFinalGoalReward: function(gameState, player, token, chosenElement) {
      // Add chosen element to end of queue
      if (!player.elementQueue) player.elementQueue = [];
      player.elementQueue.push(chosenElement);
      // Enforce max queue size
      if (CONFIG.maxElementQueue && player.elementQueue.length > CONFIG.maxElementQueue) {
        player.elementQueue.shift();
      }

      // Combo check (element added)
      this._processCombos(player);

      // Find opponent (assume 2 players)
      var opponent = null;
      for (var pid in gameState.players) {
        if (pid != player.playerId) {
          opponent = gameState.players[pid];
          break;
        }
      }
      if (!opponent || opponent.hp == null) return;

      // Attack opponent with token's current ATK
      opponent.hp -= token.atk;

      // Return token to player's safe zone (start tile)
      token.position = CONFIG.START_TILES[player.playerId];

      // Increment finished horse count
      player.finishedHorseCount = (player.finishedHorseCount || 0) + 1;

      // Emit event
      if (typeof gv !== 'undefined' && gv.bus && gv.bus.emit) {
        gv.bus.emit('elementalHunter:finalGoalRewardApplied', {
          playerId: player.playerId,
          tokenId: token.tokenId,
          damage: token.atk,
          opponentHP: opponent.hp
        });
      }
    },

    /**
     * Internal: process combo logic (called after element addition)
     * @param {Object} player
     */
    _processCombos: processCombos,

    /**
     * Reset module state (if any). Does not reset gameState; engine should handle.
     */
    reset: function() {
      // No persistent module-level state to clear.
    }
  };
})();