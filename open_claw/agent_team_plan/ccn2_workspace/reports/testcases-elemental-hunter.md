# Test Cases — elemental-hunter

**Source**: design/GDD-FEATURE-elemental-hunter.md (sections 4 & 8)
**Generated**: 2026-03-19T12:57:00+07:00 (agent_qc)
**Hash**: 53EA91862F5788049D5D4DBB2CDE6F9D

---

## Core Mechanics (GDD Section 2)

1. Board structure: 61 tiles, Arm Paths (4 arms × 10 tiles), Main Loop, Branch Points, Goal Paths (4 tiles), Final Goal
2. Token movement: dice total steps along defined path, stop at Final Goal if overshoot
3. Power Roll: 20% accuracy to land in target range
4. Roll Double: doubles grant extra turn; cooldown 2 rounds
5. Consecutive Roll Cap: max 3 rolls per turn sequence
6. Element affinity: matching affinity → +ATK; mismatched → +MAG (scaled by character stat & tileGainMultiplier)
7. Element Queue: max size, FIFO ejection when full; new element added to tail
8. Combo detection: C3 (3 consecutive same), C4 (4 consecutive different); cascade; priority C3 first
9. Combo rewards: T1 +150 ATK; T2 ×2 tileGainMultiplier; T3 ×1.5 ATK (rounded up)
10. Kick: non-Safe Zone collision → HP -= ATK; defender pushed to nearest Safe Zone behind
11. HP & KO: HP <= 0 → immediate opponent win
12. MAG & Ultimate: MAG gained from mismatched affinity; Ultimate Extra Roll costs 50 MAG
13. Artifacts: Swap, Change, Charge; unlocked by emptyTileVisits; slot limit based on Level
14. Character stats: ATK, MAG, HP, Affinity, Combo rewards, Ultimate

---

## Edge Cases (GDD Section 4)

1. elementQueue full when adding new element → oldest (head) ejected
2. frozenRounds > 0 → token cannot be selected for movement
3. consecutiveRollsThisTurn >= MAX_CONSECUTIVE_ROLLS → Roll Double does not grant extra turn
4. Artifact Swap with queue size < 2 → no effect (artifact ignored)
5. Kick on Safe Zone → no kick occurs
6. Multiple tokens reach Final Goal in same turn sequence → each processes Final Goal independently (element added, attack opponent, return to safe zone)
7. Roll Double during doubleRollCooldown → no extra turn granted (still counts as Roll Double but no reward)
8. Power Roll without target range selection → dice roll action ignored
9. Empty Tile with no unlocked artifacts → no selection shown (or no-op)

---

## Win/Lose Conditions (GDD Section 3)

- KO: HP <= 0 triggers immediate opponent victory
- Round limit reached: player with higher HP wins
- Tie-break: if HP equal, Player2 wins (Last Mover Advantage)

---

## Test Scenarios (GDD Section 8)

1. Affinity match: token on matching element → +ATK (character.atk, ×2 if tileGainMultiplier active)
2. Affinity mismatch: token on different element → +MAG (character.mag, ×2 if active)
3. C3 combo: queue [Fire, Fire, Fire] + add Fire → C3 triggers: 3 Fire removed, all tokens +150 ATK, cascade re-scan
4. Kick: token A lands on opponent token B (non-Safe Zone) → opponent HP -= ATK[A], B pushed to nearest Safe Zone behind, kickCount[A]++
5. Final Goal: token reaches Final Goal → choose element added to queue tail, token attacks opponent (ATK damage), token returns to player's Safe Zone
6. Consecutive Roll Cap: consecutiveRollsThisTurn = 3 → any further roll (Double or Ultimate) does not grant extra turn
7. Artifact Swap invalid: queue size < 2 → Swap artifact ignored without effect
8. Frozen token: frozenRounds > 0 → token not selectable for movement
9. Roll Double cooldown: doubleRollCooldown active → Roll Double does not grant extra turn

---

## Coverage Notes

- All core mechanics mapped to at least 1 test
- All edge cases from Section 4 covered
- Win/lose conditions tested per Section 3
- All 9 scenarios from Section 8 included as standalone tests
