# GDD: <Feature Name>
**Source**: concepts/<filename.md>
**Created**: YYYY-MM-DD
**Updated**: YYYY-MM-DD
**Status**: Draft | Review | Approved

---

## 1. Overview
Brief description of the feature and its role in the game. 2–3 sentences max.

## 2. Core Mechanics
Step-by-step mechanics. Be specific enough for a developer to implement directly.

1. Step one...
2. Step two...
3. Step three...

## 3. Win/Lose Conditions
How this feature affects the win state. If N/A, state explicitly.

## 4. Edge Cases
At least 3 edge cases must be documented.

- **Edge case 1**: ...
- **Edge case 2**: ...
- **Edge case 3**: ...

## 5. UI/UX Notes
What the player sees, hears, or feels. Relevant for client animator and sound designer.

- Visual: ...
- Audio: ...
- Animation: ...

## 6. Balance Notes
Expected impact on game balance. Include numbers where possible.

- Expected frequency: ...
- Impact on win rate: ...
- Risk of exploit: ...

## 7. Dependencies
- Other GDDs this depends on: (list by GDD filename)
- Server changes needed: yes / no
- Client changes needed: yes / no
- Config changes needed: yes / no

## 8. Test Scenarios
At least 5 test scenarios for agent_qc to implement.
Format: "Given [state], When [action], Then [result]"

1. Given..., When..., Then...
2. Given..., When..., Then...
3. Given..., When..., Then...
4. Given..., When..., Then...
5. Given..., When..., Then...
