// src/ladder-mechanic.js
// Part of CCN2 game engine
// Implements: Ladder Mechanic (see design/GDD-FEATURE-ladder-mechanic.md)
// Updated by: agent_dev 2026-03-18 (from GDD-FEATURE-ladder-mechanic.md)
// Original: agent_dev 2026-03-18

/**
 * LadderMechanic — handles DIAMOND accumulation, gate opening,
 * Ladder Lane entry, bounce-back, and win condition.
 *
 * Dependencies: CONFIG (rules.js), gv.bus (event bus)
 * Player state: diamond, gateOpen
 * Token states: IN_HOME | ON_TRACK | IN_LADDER_LANE | FINISHED
 *
 * Architecture: global object literal pattern, no import/export.
 */
var LadderMechanic = {

  /**
   * Initialize with game config.
   * @param {Object} config - CONFIG object from rules.js
   */
  init: function(config) {
    this.config = config;
    this.ladderLaneSize = 6; // 6 tiles in Ladder Lane per color
  },

  // ── Tile ID constants (GDD-FEATURE §6) ────────────────────
  REWARD_TILE_IDS: [5, 10, 15, 20, 25, 30, 35, 40],
  SAFE_ZONE_IDS: [1, 11, 21, 31],
  // LADDER_TILE_IDS keyed by player color
  LADDER_TILE_IDS: {
    green: 41,
    red: 42,
    blue: 43,
    yellow: 44
  },

  // ── Token state enum ──────────────────────────────────────
  TokenState: {
    IN_HOME: 'IN_HOME',
    ON_TRACK: 'ON_TRACK',
    IN_LADDER_LANE: 'IN_LADDER_LANE',
    FINISHED: 'FINISHED'
  },

  /**
   * Grant DIAMOND when token lands on a REWARD tile.
   * GDD-FEATURE §2.1: player.diamond += CONFIG.REWARD_TILE_GRANT
   *
   * @param {Object} player - player object (diamond)
   * @param {number} tileId - tile the token landed on
   * @returns {number} new diamond total, or -1 if not a REWARD tile
   */
  grantRewardDiamond: function(player, tileId) {
    if (this.REWARD_TILE_IDS.indexOf(tileId) === -1) {
      return -1;
    }
    var grant = (this.config && this.config.REWARD_TILE_GRANT) || 0;
    player.diamond = (player.diamond || 0) + grant;
    return player.diamond;
  },

  /**
   * Check if gate should open after token lands on a tile.
   * GDD-FEATURE §2.2: diamond >= 600 AND token landed on Safe Zone.
   * Once open, gate is permanent (cannot be reversed).
   *
   * @param {Object} player - player object (diamond, gateOpen)
   * @param {number} tileId - tile the token landed on
   * @returns {boolean} true if gate just opened (for UI notification)
   */
  checkGateOpen: function(player, tileId) {
    if (player.gateOpen) {
      return false; // already open, permanent
    }
    // GDD-FEATURE §4: threshold is strictly >= 600
    var threshold = (this.config && this.config.WIN_DIAMOND_THRESHOLD) || 600;
    var onSafeZone = this.SAFE_ZONE_IDS.indexOf(tileId) !== -1;

    if (player.diamond >= threshold && onSafeZone) {
      player.gateOpen = true;
      return true; // gate just opened — trigger notification
    }
    return false;
  },

  /**
   * Force open a player's gate (e.g., FORCE_OPEN_GATE round event).
   *
   * @param {Object} player - player object (gateOpen)
   * @returns {boolean} true if gate was just opened
   */
  forceOpenGate: function(player) {
    if (!player.gateOpen) {
      player.gateOpen = true;
      return true;
    }
    return false;
  },

  /**
   * Check if player can enter Ladder Lane from current position.
   * Preconditions: gate open AND token on Safe Zone (entry gate tile).
   *
   * @param {Object} player - player object (gateOpen)
   * @param {Object} token - token object (state, position)
   * @param {number} entryGateTileId - the Safe Zone tile ID for this player's color
   * @returns {boolean}
   */
  canEnterLadderLane: function(player, token, entryGateTileId) {
    return (
      player.gateOpen === true &&
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
   * GDD-FEATURE §2.4: Overshoot causes bounce-back (not stuck).
   * If token overshoots the Final Tile, it bounces back by the excess steps.
   * The token does NOT leave the Ladder Lane.
   *
   * @param {Object} token - token object (state, ladderLaneStep)
   * @param {number} diceRoll - dice result (1-6)
   * @returns {number} new step position, or -1 if not in ladder lane
   */
  advanceInLadderLane: function(token, diceRoll) {
    if (token.state !== this.TokenState.IN_LADDER_LANE) {
      return -1;
    }

    var currentStep = token.ladderLaneStep; // 0-indexed (0..5)
    var targetStep = 5; // Final Tile index
    var remaining = targetStep - currentStep;

    var newStep = currentStep + diceRoll;

    if (newStep > targetStep) {
      // GDD-FEATURE §4: Bounce-back — overshoot bounces back
      var overshoot = newStep - targetStep;
      newStep = targetStep - overshoot;
      // Clamp to 0 (can't bounce before start of lane)
      if (newStep < 0) {
        newStep = 0;
      }
    }

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
    if (token.state !== this.TokenState.IN_LADDER_LANE) {
      return false;
    }

    // GDD-FEATURE §2.4: Win only when on Final Tile (step 5)
    if (token.ladderLaneStep === 5) {
      token.state = this.TokenState.FINISHED;
      this.triggerWin(playerId);
      return true;
    }
    return false;
  },

  /**
   * Trigger win event via bus.
   * GDD-FEATURE §3: First player to trigger win ends the game immediately.
   *
   * @param {string} playerId - winning player's ID
   */
  triggerWin: function(playerId) {
    if (typeof gv !== 'undefined' && gv.bus) {
      gv.bus.emit('GAME_WIN', { playerId: playerId });
    }
  },

  /**
   * Check if a kick action is blocked because token is in Ladder Lane.
   * GDD-FEATURE §4: kicked player's gateOpen is NOT reset.
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
