# Test Cases — Elemental Hunter

**Feature:** elemental-hunter  
**GDD:** design/GDD-FEATURE-elemental-hunter.md  
**Generated:** 2026-03-19 10:55 UTC  
**Agent:** agent_qc (Verita)

---

## Core Mechanics Tests (GDD Section 2)

### Token Movement
- [ ] Test that a token moves the exact number of steps rolled (2 dice sum)
- [ ] Test that token stops at Final Goal if steps exceed it
- [ ] Test Branch Point routing: token belonging to player enters Goal Path; other continues Main Loop
- [ ] Test that token returns to player's Safe Zone after reaching Final Goal
- [ ] Test that frozen tokens cannot be selected for movement

### Element Collection
- [ ] Test: When token lands on Elemental Tile with element == Affinity → token gains +ATK (character.atk)
- [ ] Test: When token lands on Elemental Tile with element != Affinity → player gains +MAG (character.mag)
- [ ] Test: Element added to end of Element Queue (max size enforced)
- [ ] Test: When queue full, oldest element (head) removed to make room
- [ ] Test: Game start adds 1 Affinity element to head of queue

### Power Roll
- [ ] Test: Power Roll has 20% chance to land in target range
- [ ] Test: Power Roll requires target range selection before dice stop
- [ ] Test: If no target range selected, dice action is ignored

### Roll Double & Consecutive Roll Cap
- [ ] Test: Rolling doubles grants an extra turn immediately after current turn
- [ ] Test: After a double roll, player enters doubleRollCooldown for 2 rounds
- [ ] Test: If double roll occurs during cooldown, no extra turn granted
- [ ] Test: consecutiveRollsThisTurn resets when switching to other player
- [ ] Test: When consecutiveRollsThisTurn >= MAX_CONSECUTIVE_ROLLS (3), no extra turns from Roll Double
- [ ] Test: When consecutiveRollsThisTurn >= MAX_CONSECUTIVE_ROLLS (3), Ultimate Extra Roll cannot be activated

### Combo System (C3 and C4)
- [ ] Test: C3 (Triple Threat) triggers when 3 consecutive identical elements in queue
- [ ] Test: C4 (Elemental Master) triggers when 4 consecutive different elements in queue
- [ ] Test: C3 has priority over C4 when both could trigger
- [ ] Test: Combo causes triggering element(s) to be removed from queue
- [ ] Test: Combo applies Tier 1 reward (Power Surge: +150 ATK to all tokens)
- [ ] Test: At Tier 2 milestone (2nd combo), Double Harvest activates (tileGainMultiplier ×2)
- [ ] Test: At Tier 3 milestone (3rd combo), Absolute Might activates (all tokens ATK ×1.5, round up)
- [ ] Test: After combo, queue rescanned for cascading combos
- [ ] Test: combocount resets to 0 at end of match

### Kick Mechanic
- [ ] Test: When token A lands on tile with opponent token B (not Safe Zone), kick occurs
- [ ] Test: Kick deals damage: HP[owner(B)] -= ATK[A]
- [ ] Test: Token B is pushed back to nearest Safe Zone behind (along its movement direction)
- [ ] Test: kickCount[A] increments by 1
- [ ] Test: If ATK[A] = 0, kick still pushes but no damage
- [ ] Test: If landing tile is Safe Zone, kick does NOT occur

### HP and KO
- [ ] Test: Player HP starts at character.hp (default 1000)
- [ ] Test: HP decreases only from Kick or Goal token attack
- [ ] Test: If HP ≤ 0, player is KO'd and opponent wins immediately

### MAG and Ultimate
- [ ] Test: MAG increases when token lands on element != Affinity: player.mag += character.mag (× tileGainMultiplier)
- [ ] Test: MAG is capped by magCap
- [ ] Test: Ultimate (Extra Roll) costs 50 MAG
- [ ] Test: When Ultimate triggered, ultimateExtraRolls++
- [ ] Test: After current movement, if ultimateExtraRolls > 0, consume 1 and grant new dice roll
- [ ] Test: If consecutiveRollsThisTurn >= MAX_CONSECUTIVE_ROLLS, Ultimate cannot be activated

### Artifact (Empty Tile)
- [ ] Test: Landing on Empty Tile triggers artifact selection popup
- [ ] Test: Artifact Swap unlocked when emptyTileVisits ≥ 1
- [ ] Test: Artifact Change unlocked when emptyTileVisits ≥ 2
- [ ] Test: Artifact Charge unlocked when emptyTileVisits ≥ 3
- [ ] Test: Artifact slots limited by level (Lv1:1, Lv2:2, Lv3:3)
- [ ] Test: Swap exchanges 2 adjacent elements in queue
- [ ] Test: Change converts one element to one of the other 3 types
- [ ] Test: Charge adds 1 Affinity element to end of queue
- [ ] Test: If queue has <2 elements and Swap selected, Swap ignored (no effect, not consumed)

### Character
- [ ] Test: Character has Affinity (Fire/Ice/Grass/Rock)
- [ ] Test: Character base ATK = 30, MAG = 10, HP = 1000 (or config per character)
- [ ] Test: Combo rewards apply per Character pillow config (Tier 1/2/3)

### Level Difficulty
- [ ] Test: Level 1: maxRounds 12, combo max Tier 1, artifact slots 1
- [ ] Test: Level 2: maxRounds 15, combo max Tier 2, artifact slots 2
- [ ] Test: Level 3: maxRounds 15, combo max Tier 3, artifact slots 3
- [ ] Test: Default level is Lv3

---

## Edge Cases (GDD Section 4)

- [ ] Full queue overflow: when adding new element with full queue, oldest element removed
- [ ] Frozen token cannot be selected for movement (frozenRounds > 0)
- [ ] Consecutive roll cap: when consecutiveRollsThisTurn = 3, Roll Double does NOT grant extra turn
- [ ] Consecutive roll cap: when consecutiveRollsThisTurn = 3, Ultimate Extra Roll cannot be activated
- [ ] Artifact Swap with <2 elements in queue has no effect
- [ ] Kick on Safe Zone tile does NOT occur
- [ ] Multiple tokens from same player reaching Final Goal in same turn sequence: each processes independently (add element, attack opponent, return to Safe Zone)
- [ ] Roll Double during doubleRollCooldown: no extra turn granted even if dice double
- [ ] Power Roll without target range selection: dice action ignored

---

## Win/Lose Conditions (GDD Section 3)

- [ ] KO: When player HP ≤ 0, opponent wins immediately
- [ ] Round limit reached: player with higher HP wins
- [ ] Tie-break: if HP equal, Player2 wins (Last Mover Advantage)

---

## Suggested Test Structure (Jest)

```javascript
describe('ElementalHunter', () => {

  describe('core mechanics', () => {
    // Token movement
    // Element collection (Affinity vs non-Affinity)
    // Power Roll
    // Roll Double & Consecutive Roll Cap
    // Combo system (C3, C4, cascades, tiers)
    // Kick
    // HP/KO
    // MAG/Ultimate
    // Artifacts
    // Character
    // Level settings
  });

  describe('edge cases', () => {
    // Full queue overflow
    // Frozen token
    // Consecutive roll cap reached
    // Swap with <2 elements
    // Kick on Safe Zone
    // Multiple tokens finish same turn
    // Roll Double during cooldown
    // Power Roll without target
  });

  describe('win conditions', () => {
    // KO immediate win
    // Round limit HP comparison
    // Tie-break Player2 wins
  });

});
```

---

## Notes for Implementer

- Mock Cocos2d-x JS environment: SceneManager, EventBus, GameState
- Focus on pure logic unit tests; UI rendering can be integration tests
- Ensure deterministic randomness: seed dice rolls in tests
- Test combo cascading logic thoroughly (multiple combos in one queue scan)
