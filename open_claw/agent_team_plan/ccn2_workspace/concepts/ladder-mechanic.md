# Feature: Ladder Mechanic
**Priority**: High
**Requester**: CCN2 Team
**Date**: 2026-03-17

## Description
The Ladder Mechanic is the primary win-condition pathway in CCN2.
When a player accumulates 600 KC (Ladder Points) and lands on a safe zone tile,
a "gate" opens allowing their tokens to enter the Ladder Lane and eventually reach
the Final Tile of their color — triggering a win.

## Core Mechanics
- Track `player.kc` (Ladder Points) for each player throughout the game
- Players earn KC by landing on Ladder tiles (5, 10, 15, 20, 25, 30, 35, 40)
- When `player.kc >= 600` AND player lands on a Safe Zone (1, 11, 21, 31): gate opens
- With gate open, player can choose to route their token toward Ladder Lane
- Token reaches the Final Tile of that player's color → `triggerWin(playerId)`
- Only 1 win is possible per game (first player to reach Final Tile wins)

## Edge Cases
- Player has 600 KC but lands on a non-safe zone tile → gate does NOT open
- Player has exactly 599 KC → not eligible, even on safe zone
- Two players both reach 600 KC in the same round → both gates open, race to Final Tile
- Player with open gate gets kicked back by another player → gate remains open
- Player overshoots Final Tile (needs exact roll) → bounces back

## References
- GDD section: Win Condition (GameDesignDocument.md)
- Dice modes: SINGLE and DOUBLE affect how players approach safe zones
