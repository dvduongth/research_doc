# Test Cases — elemental-hunter
Generated: 2026-03-19 19:42 (Asia/Bangkok)
Source: design/GDD-FEATURE-elemental-hunter.md (sections 4, 8)

## Core Mechanics (from GDD section 2)

1. Horse movement follows defined path (Arm Path → Branch → Goal Path or Main Loop)
2. Element collection: Affinity match → +ATK; mismatch → +MAG
3. Element Queue: max size `maxElementQueue`; new added to end; overflow removes oldest (head)
4. Combo detection: C3 (3 identical consecutive) and C4 (4 different consecutive); cascade possible
5. Kick: attacker ATK deals damage to defender, defender pushed to nearest Safe Zone behind
6. HP <= 0 → immediate KO win
7. Final Goal: horse selects element, attacks opponent, returns to Safe Zone
8. Roll Double: extra turn granted (unless cooldown or cap)
9. Power Roll: 20% accuracy to target range
10. Consecutive Roll Cap: max `MAX_CONSECUTIVE_ROLLS` rolls per turn sequence

## Edge Cases (from GDD section 4)

- EC1: Element Queue full → oldest element removed when adding new
- EC2: Frozen horse (`frozenRounds > 0`) cannot be selected for movement
- EC3: Artifact Swap ignored if queue has < 2 elements
- EC4: Kick does not occur on Safe Zone (even if enemy horse present)
- EC5: Multiple horses reaching Final Goal in same turn sequence: each processes independently (element + attack + return)
- EC6: Roll Double during `doubleRollCooldown` → no extra turn granted
- EC7: Power Roll without target range selection before stop → dice roll ignored (no effect)
- EC8: ConsecutiveRollsThisTurn >= MAX_CONSECUTIVE_ROLLS → Roll Double does not grant extra turn
- EC9: Roll Double still counts as a double even if cooldown/cap prevents extra turn
- EC10: If `consecutiveRollsThisTurn` at cap, Ultimate Extra Roll cannot be activated (need clarification - check rule)

## Test Scenarios (from GDD section 8)

1. Given horse on Elemental tile with Affinity match, When landing confirmed, Then horse gains +ATK equal to character.atk (×2 if multiplier active)
2. Given horse on Elemental tile with Affinity mismatch, When landing confirmed, Then player gains +MAG equal to character.mag (×2 if multiplier active)
3. Given Element Queue = [Fire, Fire, Fire], When adding Fire, Then C3 triggers: 3 Fires removed, all horses +150 ATK (Tier 1), queue rescanned for cascade
4. Given horse A lands on tile with enemy horse B, and tile is not Safe Zone, When landing confirmed, Then `HP[owner(B)] -= ATK[A]` and horse B pushed to nearest Safe Zone behind (following B's movement direction)
5. Given horse reaches Final Goal, When confirmed, Then player selects 1 element to add to end of Element Queue, horse attacks opponent with `ATK[horse]`, then horse returns to player's Safe Zone
6. Given `consecutiveRollsThisTurn = 3` (at MAX_CONSECUTIVE_ROLLS), When rolling Double (dice match), Then no extra turn granted
7. Given Element Queue has only 1 element, When player uses Artifact Swap, Then Swap has no effect (artifact ignored, queue unchanged)
8. Given horse has `frozenRounds > 0`, When turn selection phase, Then horse is not displayed as a valid move option

## Coverage Notes

- All scenarios mapped to Jest unit tests in src/tests/elemental-hunter.test.js
- Edge cases explicitly covered as separate `describe('edge cases')` block
- Win condition tests to be added (KO condition check)
