// src/rules.js
// Global configuration for CCN2 features.
// This file must be loaded first in the script load order.

var CONFIG = CONFIG || {};

// Elemental Hunter configuration
CONFIG.ELEMENTAL_HUNTER = {
  // Board & Players
  NUM_TOKENS_PER_PLAYER: 3,
  BOARD_SIZE: 61,
  START_TILES: { 1: 51, 2: 0 },
  FINAL_GOAL_TILES: { 1: 31, 2: 25 },

  // Balance
  DOUBLE_ROLL_COOLDOWN_ROUNDS: 2,
  MAX_CONSECUTIVE_ROLLS: 3,
  COMBO_T1_ATK_BONUS: 150,
  COMBO_T2_MULTIPLIER: 2,
  COMBO_T3_ATK_MULTIPLIER: 1.5,
  ULTIMATE_COST_EXTRA_ROLL: 50,
  POWER_ROLL_ACCURACY: 0.2, // 20%

  // Limits
  magCap: 999, // placeholder; set by balance file
  maxElementQueue: 10, // placeholder; set by balance file

  // Character defaults (Pillow) — used if character not provided by server
  CHARACTER_STATS: {
    pillow: {
      affinity: 'fire',
      atk: 30,
      mag: 10,
      hp: 1000,
      comboRewards: ['power_surge', 'double_harvest', 'absolute_might']
    }
  },

  // Level configurations
  LEVELS: {
    lv1: { maxRounds: 12, maxComboTier: 1, artifactSlots: 1 },
    lv2: { maxRounds: 15, maxComboTier: 2, artifactSlots: 2 },
    lv3: { maxRounds: 15, maxComboTier: 3, artifactSlots: 3 }
  },

  // Artifact pool
  ARTIFACTS: ['Swap', 'Change', 'Charge']
};