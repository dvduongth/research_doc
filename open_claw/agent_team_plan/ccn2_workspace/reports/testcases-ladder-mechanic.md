# Test Cases — Ladder Mechanic
**Generated**: 2026-03-18 14:37 (Asia/Bangkok)  
**Source**: design/GDD-ladder-mechanic.md  
**Test File**: src/tests/ladder-mechanic.test.js

## Summary
| Section | Test Count |
|---------|-----------|
| Gate Opening | 5 |
| Force Open Gate | 2 |
| canEnterLadderLane | 4 |
| enterLadderLane | 2 |
| advanceInLadderLane | 6 |
| checkWinCondition | 3 |
| Edge Cases | 7 |
| Test Scenarios (GDD §8) | 10 |
| **Total** | **39** |

## Gate Opening Tests
- [x] Gate does NOT open when ladderPoint < 600
- [x] Gate opens when ladderPoint >= 600
- [x] Gate does NOT re-trigger if already open
- [x] Gate opens at exactly 600 KC (boundary)
- [x] Gate opens for values well above 600

## Force Open Gate Tests
- [x] Force opens gate even when ladderPoint < 600
- [x] Does nothing if gate already open

## Ladder Lane Entry Tests
- [x] canEnter: gate open + on entry gate tile → true
- [x] canEnter: gate closed → false
- [x] canEnter: not on entry gate tile → false
- [x] canEnter: already in ladder lane → false
- [x] enterLadderLane: moves to step 0
- [x] enterLadderLane: fails if not ON_TRACK

## Advance in Ladder Lane Tests
- [x] Advances token by dice roll
- [x] Exact roll to Final Tile (step 5)
- [x] Overshoot returns -1, token does NOT move
- [x] Overshoot when 1 step remaining
- [x] Exact roll of 1 to Final Tile
- [x] Fails if token not IN_LADDER_LANE

## Win Condition Tests
- [x] Triggers win at Final Tile (step 5), emits GAME_WIN
- [x] Does NOT trigger win before Final Tile
- [x] Does NOT trigger win for non-ladder token

## Edge Cases (GDD §4)
- [x] Gate opens at 600 regardless of tile position (§4.1)
- [x] Two players both reach 600 KC — both open (§4.2)
- [x] Kick blocked in Ladder Lane (§4.8)
- [x] Kick NOT blocked for ON_TRACK token
- [x] FORCE_OPEN_GATE opens gate below 600 KC (§4.6)
- [x] Cannot win without entering Ladder Lane
- [x] getRemainingSteps correct / returns -1 for non-ladder

## Test Scenarios from GDD §8
- [x] TS-1: 599 KC → gate does NOT open
- [x] TS-2: 600 KC → gate opens, can enter
- [x] TS-3: 600 KC non-Safe Zone → gate opens, cannot enter yet
- [x] TS-4: gate open + Safe Zone → enter Ladder Lane
- [x] TS-5: 2 steps remaining, roll 2 → WIN
- [x] TS-6: 2 steps remaining, roll 3 → no move, no win
- [x] TS-7: two players race — first exact roll wins
- [x] TS-8: kick blocked in Ladder Lane
- [x] TS-9: FORCE_OPEN_GATE at 500 KC → gate opens
- [x] TS-10: at tile with 1 step, roll 6 → overshoot, no win
