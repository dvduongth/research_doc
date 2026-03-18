# GDD: Ladder Mechanic
**Source**: concepts/ladder-mechanic.md
**Created**: 2026-03-18
**Status**: Draft

## 1. Overview
The Ladder Mechanic is the primary win-condition pathway in CCN2. It governs how players transition from the main board to their private Ladder Lane after accumulating sufficient Ladder Points (KC), ultimately leading to the Final Tile victory.

## 2. Core Mechanics

### State Variables
- `player.ladderPoint` (integer): Accumulated KC, starts at 0, persists across the match.
- `player.gateOpened` (boolean): Whether the player's gate is open (true when `ladderPoint >= 600`). Once set to true, it remains true permanently for that match.
- `token.state` (enum): `IN_HOME` | `ON_TRACK` | `IN_LADDER_LANE` | `FINISHED`
- `board.ladderLane[color][6]`: Array of 6 tiles in each player's private Ladder Lane.
- `board.entryGate[color]`: The tile coordinate connecting main track to the Ladder Lane (located at the Safe Zone tile for that color: Green=1, Red=11, Blue=21, Yellow=31).
- `board.finalTile[color]`: The winning tile at the end of each Ladder Lane.

### Triggers & Conditions

1. **Gate Opening Check** (Server-side, occurs after Ladder Points are updated):
   - Condition: `player.ladderPoint >= 600`
   - Action: Set `player.gateOpened = true` (persistent)
   - Note: Gate opens immediately upon reaching 600 KC; does not require landing on Safe Zone.

2. **Entering Ladder Lane** (Token movement selection phase):
   - Preconditions:
     - `player.gateOpened == true`
     - Active token is on the Entry Gate tile (Safe Zone for that player's color)
     - Player chooses to route token into Ladder Lane instead of continuing on main track
   - Action: Change token state to `IN_LADDER_LANE` and place it on the first tile of the Ladder Lane.

3. **Winning the Game** (After token movement resolves):
   - Preconditions:
     - Token state is `IN_LADDER_LANE`
     - Token lands exactly on `finalTile[color]` (dice roll equals remaining steps)
   - Action: Set token state to `FINISHED`, trigger `triggerWin(playerId)`, end match.

### Exact Step Rule
If dice roll exceeds remaining steps to Final Tile, token moves past the Final Tile and does NOT win. Player must roll exact number on a subsequent turn.

### Turn Flow Integration
- Ladder Points are updated during `UPDATE_KC` phase (after landing resolution).
- Gate status is checked immediately after KC update.
- Entry into Ladder Lane occurs during token selection/move phase (`MOVE` state) when player chooses available path.
- Win condition checked during `CHECK_WIN` phase after movement resolves.

## 3. Win/Lose Conditions
This feature directly defines the win condition.

**Win**: First player to have any token reach their color's Final Tile (after gate is open and token has entered Ladder Lane) wins the game. Match ends immediately.

**Lose**: All other players lose when one player wins. If match timeout occurs (60 minutes), player with highest Ladder Points wins.

## 4. Edge Cases

1. **Player reaches 600 KC but not on Safe Zone**: Gate opens immediately upon reaching >=600 KC regardless of tile location. Player does NOT need to land on Safe Zone to open gate; they can later enter Ladder Lane when they eventually land on their Safe Zone/Entry Gate.

2. **Two players both reach 600 KC in same round**: Both gates open independently. Both can enter their respective Ladder Lanes. Results in a race to Final Tiles.

3. **Player with open gate gets kicked while on Safe Zone**: Kicking is blocked in Safe Zones, so token cannot be kicked off the Safe Zone. However, if token is on Safe Zone and gate is open, it can choose to enter Ladder Lane on next turn.

4. **Token in Ladder Lane overshoots Final Tile**: Must roll exact number. Bouncing back is not defined in GDD; typical implementation: token stays at current position or moves to a safe spot? (Clarify with `clientccn2`). For now: token does not move if roll > remaining distance (cannot overshoot).

5. **Player opens gate but never reaches Safe Zone**: If player never lands on their Safe Zone after opening gate, they cannot enter Ladder Lane and thus cannot win. They may still win if they somehow teleport/enter via skill effect (if such exists). Default: must physically land on Safe Zone to access Entry Gate.

6. **Round Event FORCE_OPEN_GATE**: This event forces a player's gate open even if `ladderPoint < 600`. Gate still opens permanently. Player can then enter Ladder Lane. Does NOT auto-win; still must reach Final Tile.

## 5. UI/UX Notes

- **Ladder Point Display**: Show player's current KC prominently on HUD (e.g., progress bar: "600/600").
- **Gate Opening Feedback**: When gate opens (server message), show visual effect: glowing Entry Gate tile, particle animation, and a toast notification: "Gate opened! Enter Ladder Lane at your Safe Zone."
- **Entry Gate Highlight**: When token is on Safe Zone and gate is open, highlight the Ladder Lane entry path to indicate available movement option.
- **Final Tile Marker**: Clearly mark each player's Final Tile with their color icon/badge.
- **Ladder Lane Visualization**: Show the 6-tile path in a distinct style (e.g., golden path) separate from main track.
- **Lane Token Tooltip**: Hovering over token in Ladder Lane shows: "Ladder Lane: Tile X/6".
- **Win Animation**: When token lands on Final Tile, play victory sequence (camera zoom, confetti, win sound) before match ends.

## 6. Balance Notes

- **KC Accumulation Rate**: Based on probability of landing on Ladder tiles (5,10,15,20,25,30,35,40) ~8/40 = 20% per turn if moving randomly. Expected 5–10 turns per 100 KC, so ~30–60 turns to reach 600 KC. This is a mid-to-long game.
- **Gate as Milestone**: 600 KC is a major milestone; once reached, player can focus on reaching Safe Zone to enter Ladder Lane.
- **Ladder Lane Length**: 6 tiles requires at least 2 dice rolls (6 can be covered by one roll of 6 if starting at tile 0 of lane, but start at first tile -> needs 5 more steps). Average dice roll 3.5 → ~1.5 turns to finish lane after entry.
- **First-to-Open Advantage**: Players who reach 600 KC earlier have more opportunities to enter Ladder Lane and win. However, being ahead may make them a target for kicking/diamond stealing.
- **Exact Roll Requirement**: Prevents guaranteed win; introduces risk and potential for delay. Opponents may still kick in main track (but not in Ladder Lane), so main-token progress can be disrupted before gate opens.

## 7. Dependencies

- **Features this depends on**:
  - `GDD-token-movement`: For token state transitions and movement rules
  - `GDD-dice-system`: For exact roll requirement and dice roll mechanics
  - `GDD-board-design`: For tile layout, Safe Zones, Ladder Lane structure
  - `GDD-ladder-point-system`: For KC accumulation mechanics (this GDD covers gate opening as extension)

- **Server changes needed**: Yes
  - Add `gateOpened` boolean field to Player state
  - Update `UPDATE_KC` phase to set `gateOpened = true` when `ladderPoint >= 600`
  - Add `ENTRY_GATE` and `LADDER_LANE` tile handling in `GET_PATHS_CAN_MOVE` and `MOVE_TOKEN`
  - Add win condition check for token on `FINAL_TILE` with proper color matching

- **Client changes needed**: Yes
  - Render Ladder Lane as distinct visual path
  - Highlight Entry Gate when conditions met
  - Show gate-opening animation/notification
  - Show ladder point progress on HUD
  - Final tile marker with player color
  - Win animation sequence

- **Config keys needed**:
  - `Board.json` → `pointOpenGate = 600` (already exists)
  - `Board.json` → `finalTile[color]` coordinates for each color
  - `Board.json` → `ladderLane[color][]` arrays (6 tiles each)
  - `Board.json` → `entryGate[color]` or derive from Safe Zone tile IDs (1,11,21,31)

## 8. Test Scenarios

1. **Given** Player has 599 KC and is on their Safe Zone, **When** they land on Safe Zone (no action), **Then** gate does NOT open.
2. **Given** Player has 600 KC and is on Safe Zone, **When** turn begins, **Then** server sends `gateOpened = true`, UI shows gate-open notification, and token can select Ladder Lane entry.
3. **Given** Player has 600 KC but is on tile 15 (LADDER tile), **When** turn ends, **Then** gate opens immediately, but token stays on main track; entry still requires landing on Safe Zone later.
4. **Given** Gate is open and token is on Safe Zone, **When** player selects Ladder Lane entry, **Then** token moves to first tile of Ladder Lane and token state becomes `IN_LADDER_LANE`.
5. **Given** Token in Ladder Lane has 2 steps to Final Tile, **When** dice roll = 2, **Then** token lands on Final Tile, triggers `WIN` and match ends.
6. **Given** Token in Ladder Lane has 2 steps to Final Tile, **When** dice roll = 3, **Then** token cannot move (exact roll required) or stays at current position; `WIN` not triggered.
7. **Given** Two players both reach 600 KC in same round, **When** both later enter Ladder Lane, **Then** both race; first to exact roll on Final Tile wins.
8. **Given** Gate is open and token in Ladder Lane, **When** opponent kicks (impossible because Ladder Lane is kick-safe), **Then** kick is blocked; token unaffected.
9. **Given** FORCE_OPEN_GATE round event activates for a player with 500 KC, **When** event resolves, **Then** that player's gate opens; they can enter Ladder Lane even without 600 KC.
10. **Given** Token in Ladder Lane at tile 5/6 (1 step from Final), **When** player rolls 6, **Then** token overshoots, does NOT win; remains at tile 5.

---

*End of GDD*
