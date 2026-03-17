# concepts/ — Feature Concept Files

Human developers write here. agent_gd reads here.

## How to Write a Concept

Create a file named `<feature-kebab-name>.md` using this template:

```markdown
# Feature: <Tên feature>
**Priority**: High / Medium / Low
**Requester**: <your name>
**Date**: YYYY-MM-DD

## Description
<Mô tả ngắn gameplay mechanic / feature>

## Core Mechanics
- Mechanic 1: ...
- Mechanic 2: ...

## Edge Cases
- Case 1: ...

## References
- GDD section: ...
- Similar mechanic: ...
```

## Rules
- File name: `<feature>.md` (kebab-case, no spaces)
- agent_gd picks up new/changed files within 15 minutes
- DO NOT edit files in `design/` — that's agent_gd's territory
