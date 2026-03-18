// src/ladder-mechanic.js
// Part of CCN2 game engine
// Implements: Ladder Mechanic (see design/GDD-ladder-mechanic.md)
// Created by: agent_dev 2026-03-18

/**
 * LadderMechanic — handles gate opening, Ladder Lane entry, and win condition.
 *
 * Dependencies: CONFIG (rules.js), gv.bus (event bus)
 * Token states: IN_HOME | ON_TRACK | IN_LADDER_LANE | FINISHED
 *
 * Architecture: global object literal pattern, no import/export.
 */
var LadderMechanic = {

  /**
   * Initialize with game config
   * @param {Object} config - CONFIG object from rules.js
   */
  init: function(config) {
    this.config = config;
    // Ladder Lane structure per color: 6 tiles each
    this.ladderLaneSize = 6;
  },

  // ── Token state enum ──────────────────────────────────────
  TokenState: {
    IN_HOME: 'IN_HOME',
    ON_TRACK: 'ON_TRACK',
    IN_LADDER_LANE: 'IN_LADDER_LANE',
    FINISHED: 'FINISHED'
  },

  /**
   * Check if gate should open after KC update.
   * Called during UPDATE_KC phase.
   * Gate opens permanently when ladderPoint >= 600.
   *
   * @param {Object} player - player object with ladderPoint, gateOpened
   * @returns {boolean} true if gate just opened (for UI notification)
   */
  checkGateOpen: function(player) {
    // GDD §2: Gate opens immediately upon reaching >=600 KC
    // Once open, stays open permanently
    if (!player.gateOpened && player.ladderPoint >= 600) {
      player.gateOpened = true;
      return true; // gate just opened — trigger notification
    }
    return false;
  },

  /**
   * Force open a player's gate (e.g., FORCE_OPEN_GATE round event).
   *
   * @param {Object} player - player object
   * @returns {boolean} true if gate was just opened
   */
  forceOpenGate: function(player) {
    if (!player.gateOpened) {
      player.gateOpened = true;
      return true;
    }
    return false;
  },

  /**
   * Check if player can enter Ladder Lane from current position.
   * Preconditions: gate open AND token on Safe Zone (entry gate tile).
   *
   * @param {Object} player - player object (gateOpened)
   * @param {Object} token - token object (state, position)
   * @param {number} entryGateTileId - the Safe Zone tile ID for this player's color
   * @returns {boolean}
   */
  canEnterLadderLane: function(player, token, entryGateTileId) {
    return (
      player.gateOpened === true &&
      token.state === this.TokenState.ON_TRACK &&
      token.position === entryGateTileId
    );
  },

  /**
   * Move token from Safe Zone into Ladder Lane (first tile).
   *
   * @param {Object} token - token object
   * @returns {boolean} success
   */
  enterLadderLane: function(token) {
    if (token.state !== this.TokenState.ON_TRACK) {
      return false;
    }
    token.state = this.TokenState.IN_LADDER_LANE;
    token.ladderLaneStep = 0; // first tile of the 6-tile lane
    return true;
  },

  /**
   * Advance token within Ladder Lane by dice roll.
   * Exact roll required to land on Final Tile (step 5, the 6th tile).
   * If roll overshoots remaining distance, token does NOT move.
   *
   * @param {Object} token - token object (state, ladderLaneStep)
   * @param {number} diceRoll - dice result (1-6)
   * @returns {number} new step position, or -1 if no move
   */
  advanceInLadderLane: function(token, diceRoll) {
    if (token.state !== this.TokenState.IN_LADDER_LANE) {
      return -1;
    }

    var currentStep = token.ladderLaneStep; // 0-indexed (0..5)
    var remaining = 5 - currentStep; // steps to Final Tile (step index 5)

    // GDD §2: Exact roll required — overshoot = no move
    if (diceRoll > remaining) {
      return -1;
    }

    var newStep = currentStep + diceRoll;
    token.ladderLaneStep = newStep;
    return newStep;
  },

  /**
   * Check if token has reached the Final Tile and trigger win.
   * Called after movement resolves (CHECK_WIN phase).
   *
   * @param {Object} token - token object
   * @param {string} playerId - winning player's ID
   * @returns {boolean} true if win triggered
   */
  checkWinCondition: function(token, playerId) {
    // GDD §2: Win only when IN_LADDER_LANE and on Final Tile (step 5)
    if (token.state !== this.TokenState.IN_LADDER_LANE) {
      return false;
    }

    if (token.ladderLaneStep === 5) {
      token.state = this.TokenState.FINISHED;
      this.triggerWin(playerId);
      return true;
    }
    return false;
  },

  /**
   * Trigger win event via bus.
   *
   * @param {string} playerId - winning player's ID
   */
  triggerWin: function(playerId) {
    if (typeof gv !== 'undefined' && gv.bus) {
      gv.bus.emit('GAME_WIN', { playerId: playerId });
    }
  },

  /**
   * Check if a kick action is blocked because token is in a safe zone
   * or in Ladder Lane (kick-safe per GDD §4.3, §4.8).
   *
   * @param {Object} token - token object
   * @returns {boolean} true if kick should be blocked
   */
  isKickBlocked: function(token) {
    return token.state === this.TokenState.IN_LADDER_LANE;
  },

  /**
   * Get the number of steps remaining to Final Tile.
   *
   * @param {Object} token - token object
   * @returns {number} remaining steps, or -1 if not in ladder lane
   */
  getRemainingSteps: function(token) {
    if (token.state !== this.TokenState.IN_LADDER_LANE) {
      return -1;
    }
    return 5 - token.ladderLaneStep;
  },

  /**
   * Reset state — called on new game.
   */
  reset: function() {
    this.config = null;
  }
};
