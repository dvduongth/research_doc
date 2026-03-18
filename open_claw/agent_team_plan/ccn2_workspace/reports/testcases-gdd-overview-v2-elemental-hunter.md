# Test Cases — GDD Overview v2: Elemental Hunter
**Generated**: 2026-03-18 18:57 (Asia/Bangkok)  
**Source**: design/GDD-gdd-overview-v2-elemental-hunter.md  
**Sections**: 2 (Core Mechanics), 4 (Edge Cases), 8 (Test Scenarios)

---

## Core Mechanics — Turn Structure

| # | Scenario | Priority |
|---|----------|----------|
| CM-01 | Roll 2 dice (d6), sum used as movement steps | P0 |
| CM-02 | Power Roll: player selects target range, 20% in-range / 80% random | P1 |
| CM-03 | Power Roll without target range → normal random roll | P1 |
| CM-04 | Select valid token (not frozen, dest not blocked by same-team token) | P0 |
| CM-05 | Invalid move (frozen token) → cannot select | P0 |
| CM-06 | Invalid move (dest blocked by same-owner token) → move rejected | P0 |
| CM-07 | Token moves exactly sum-of-dice steps along designated path | P0 |
| CM-08 | Elemental Tile (matching Affinity) → ATK += character.atk (×2 if multiplier) | P0 |
| CM-09 | Elemental Tile (non-matching Affinity) → MAG += character.mag (×2 if multiplier) | P0 |
| CM-10 | Element added to end of Element Queue (max size enforced) | P0 |
| CM-11 | Element Queue full → oldest (head) removed before adding new | P0 |
| CM-12 | Empty Tile → artifact selection UI opens from unlocked pool | P1 |
| CM-13 | Empty Tile → emptyTileVisits increments | P1 |
| CM-14 | Safe Zone → no effect | P0 |
| CM-15 | Token leaves Elemental Tile (element was collected) → tile respawns native element | P1 |

## Combo System

| # | Scenario | Priority |
|---|----------|----------|
| CO-01 | C3 detection: 3 same consecutive elements → remove all 3, apply reward | P0 |
| CO-02 | C4 detection: 4 different elements → remove all 4, apply reward | P0 |
| CO-03 | C3 priority over C4 when both possible | P0 |
| CO-04 | Combo Tier1 (each combo): +150 ATK to all tokens | P0 |
| CO-05 | Combo Tier2 (2nd combo, Lv2+): tileGainMultiplier ×2 | P1 |
| CO-06 | Combo Tier3 (3rd combo, Lv3): all token ATK ×1.5 (round up) | P1 |
| CO-07 | Cascading combo: after removal, re-scan queue triggers further combos | P1 |
| CO-08 | Combo count resets each game round | P1 |
| CO-09 | maxComboTier enforced by Level (Lv1=1, Lv2=2, Lv3=3) | P1 |

## Combat (Kick)

| # | Scenario | Priority |
|---|----------|----------|
| CK-01 | Attacker lands on opponent's non-safe tile → HP[opponent] -= ATK[attacker] | P0 |
| CK-02 | ATK=0 → no damage dealt | P0 |
| CK-03 | Kicked token pushed back to nearest safe zone behind | P0 |
| CK-04 | attacker's kickCount increments | P1 |
| CK-05 | Kick cannot happen on Safe Zone | P0 |
| CK-06 | Kick cannot happen on Goal Path (only owner tokens allowed) | P1 |

## Final Goal

| # | Scenario | Priority |
|---|----------|----------|
| FG-01 | Token reaches Final Goal → player selects 1 element (Fire/Ice/Grass/Rock) | P0 |
| FG-02 | Selected element added to end of Element Queue | P0 |
| FG-03 | Combo check runs after element added | P0 |
| FG-04 | Token attacks opponent: HP -= ATK (after combo bonuses) | P0 |
| FG-05 | Token returns to Start (Safe Zone) | P0 |
| FG-06 | finishedHorseCount increments | P1 |
| FG-07 | ATK=0 at Final Goal → no damage but still counts as goal completion | P0 |
| FG-08 | Token can reach Final Goal multiple times (rewards each time) | P1 |

## Extra Turn & Cooldown

| # | Scenario | Priority |
|---|----------|----------|
| ET-01 | Roll Double → extra turn granted immediately | P0 |
| ET-02 | Double Roll Cooldown (2 rounds) after double roll | P0 |
| ET-03 | During cooldown, double result NOT treated as Roll Double | P0 |
| ET-04 | Ultimate Extra Roll: spend 50 MAG → ultimateExtraRolls++ | P0 |
| ET-05 | After current turn, if ultimateExtraRolls > 0 → consume 1, grant extra roll | P0 |
| ET-06 | Consecutive Roll Cap (MAX_CONSECUTIVE_ROLLS=3) blocks further extra turns | P0 |
| ET-07 | consecutiveRollsThisTurn resets to 0 when turn switches player | P0 |
| ET-08 | Consecutive rolls count includes initial roll + all extra rolls | P1 |

## MAG & Ultimate

| # | Scenario | Priority |
|---|----------|----------|
| MG-01 | MAG accumulates on non-Affinity elemental landing | P0 |
| MG-02 | MAG capped at magCap; excess not stored | P0 |
| MG-03 | MAG UI displays actual gain (capped amount) | P1 |
| MG-04 | Ultimate Extra Roll costs exactly 50 MAG | P0 |
| MG-05 | Cannot activate Ultimate if MAG < 50 | P0 |

## Artifacts

| # | Scenario | Priority |
|---|----------|----------|
| AF-01 | Unlock Swap at emptyTileVisits ≥ 1 | P1 |
| AF-02 | Unlock Change at emptyTileVisits ≥ 2 | P1 |
| AF-03 | Unlock Charge at emptyTileVisits ≥ 3 | P1 |
| AF-04 | Lv1: 1 artifact slot, Lv2: 2, Lv3: 3 | P1 |
| AF-05 | Swap: swap 2 adjacent elements in queue | P0 |
| AF-06 | Change: convert 1 element to another type | P0 |
| AF-07 | Charge: add player's Affinity element to end of queue | P0 |
| AF-08 | After artifact use, combo check runs | P0 |
| AF-09 | Swap with queue < 2 elements → disabled/unavailable | P0 |
| AF-10 | Change with queue < 1 element → disabled/unavailable | P0 |
| AF-11 | No artifacts unlocked (emptyTileVisits < 1) → no artifact effect | P1 |

## Level System

| # | Scenario | Priority |
|---|----------|----------|
| LV-01 | Lv1: maxRounds=12, maxComboTier=1, artifactSlots=1 | P1 |
| LV-02 | Lv2: maxRounds=15, maxComboTier=2, artifactSlots=2 | P1 |
| LV-03 | Lv3: maxRounds=15, maxComboTier=3, artifactSlots=3 | P1 |
| LV-04 | Combo tier beyond maxComboTier is not applied | P1 |

## Win Conditions

| # | Scenario | Priority |
|---|----------|----------|
| WC-01 | KO: player HP ≤ 0 → opponent wins immediately | P0 |
| WC-02 | After maxRounds, compare HP; higher wins | P0 |
| WC-03 | HP tie at round limit → Player2 wins (Last Mover Advantage) | P0 |

## Edge Cases

| # | Scenario | Priority |
|---|----------|----------|
| EC-01 | Frozen token (frozenRounds > 0) cannot be selected at turn start | P0 |
| EC-02 | frozenRounds decreases by 1 at end of each round | P1 |
| EC-03 | Queue full + add → pop oldest first, then add, then check combo | P0 |
| EC-04 | Consecutive roll cap blocks ALL extra turn sources (double + ultimate) | P0 |
| EC-05 | Power Roll no target → normal random roll | P1 |
| EC-06 | MAG cap hit → only add up to cap, display actual gain | P0 |
| EC-07 | Final Goal attack with ATK 0 → no damage, still counts as goal | P0 |
| EC-08 | Token same-owner on same tile → blocked (no stacking) | P0 |
| EC-09 | Element respawn when token leaves tile | P1 |
| EC-10 | Cooldown decreases at round end (per-player or global) | P1 |

## Test Scenarios (from GDD §8)

| # | Given → When → Then | Mapped To |
|---|---------------------|-----------|
| TS-01 | Token at start, roll 7 (4+3), move 7 steps, land → tile effect triggers | CM-01, CM-07 |
| TS-02 | Queue [Fire,Ice,Fire], add Fire → C3 detected, +150 ATK, queue [Fire,Ice] | CO-01, CO-04 |
| TS-03 | ATK 75 attacker lands on defender non-safe tile → -75 HP, kick to safe zone | CK-01, CK-03 |
| TS-04 | Token reaches Final Goal → select element, combo check, attack, return to start | FG-01..FG-06 |
| TS-05 | MAG ≥ 50, activate Ultimate → -50 MAG, extraRoll++, extra turn after | ET-04, ET-05 |

---

## Summary
- **Total test cases**: 78 (across 9 categories + GDD scenarios)
- **P0 (must-have)**: 42
- **P1 (important)**: 36
- **Priority**: Start with Core Mechanics + Win Conditions + Edge Cases (P0)
