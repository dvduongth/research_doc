# CCN2 Agent Team — OpenClaw Configuration

> **Scope**: Config YAML đầy đủ, AGENTS.md templates, HEARTBEAT.md, cron job definitions
>
> **Source reference**: `openclaw/src/config/types.agents.ts`, `types.cron.ts`, `types.agent-defaults.ts`

---

## 1. openclaw.config.yaml — Agents Section

Đây là cấu hình **thêm vào** `openclaw.config.yaml` hiện tại của project.

```yaml
# ===================================================================
# CCN2 AGENT TEAM — thêm vào openclaw.config.yaml hiện tại
# ===================================================================

agents:
  defaults:
    # Tất cả agents trong team đều dùng claude-sonnet-4-6 mặc định
    model:
      primary: "claude-sonnet-4-6"
    # Subagent defaults cho orchestration
    subagents:
      maxSpawnDepth: 2          # orchestrator có thể spawn leaf
      maxChildrenPerAgent: 3
      runTimeoutSeconds: 600    # 10 phút timeout
    # Heartbeat defaults
    heartbeat:
      every: "30m"
      target: "last"            # gửi về session gần nhất
      activeHours: "8-22"       # 8am-10pm
      lightContext: true        # dùng bootstrap nhẹ cho heartbeat

  list:
    # ----------------------------------------------------------
    # agent_gd — Game Designer
    # ----------------------------------------------------------
    - id: agent_gd
      name: "CCN2 Game Designer"
      workspace: "D:/PROJECT/CCN2/ccn2_workspace"
      agentDir: "D:/PROJECT/CCN2/openclaw/agents/agent_gd"
      skills:
        - doc-wave-analysis
        - speckit
        - web-data-analysis
      model:
        primary: "claude-opus-4-6"   # Dùng Opus vì cần reasoning tốt cho GDD
      heartbeat:
        every: "30m"
        target: "last"
        activeHours: "8-22"
      subagents:
        allowAgents:
          - "agent_gd"  # chỉ spawn chính nó (parallel GDD generation)

    # ----------------------------------------------------------
    # agent_dev — Developer
    # ----------------------------------------------------------
    - id: agent_dev
      name: "CCN2 Developer"
      workspace: "D:/PROJECT/CCN2/ccn2_workspace"
      agentDir: "D:/PROJECT/CCN2/openclaw/agents/agent_dev"
      skills:
        - clientccn2-project-editor
        - serverccn2-project-editor
      model:
        primary: "claude-sonnet-4-6"
      heartbeat:
        every: "30m"
        target: "last"
        activeHours: "8-22"
      subagents:
        allowAgents:
          - "agent_dev"

    # ----------------------------------------------------------
    # agent_qc — QA Engineer
    # ----------------------------------------------------------
    - id: agent_qc
      name: "CCN2 QA Engineer"
      workspace: "D:/PROJECT/CCN2/ccn2_workspace"
      agentDir: "D:/PROJECT/CCN2/openclaw/agents/agent_qc"
      model:
        primary: "claude-sonnet-4-6"
      heartbeat:
        every: "30m"
        target: "last"
        activeHours: "8-22"
```

---

## 2. Cron Jobs — Tạo qua API hoặc Management Tool

Dưới đây là cấu trúc JSON của 3 cron jobs để tạo cho team:

### 2.1 Cron: agent_gd Workspace Scan

```json
{
  "id": "ccn2-gd-workspace-scan",
  "agentId": "agent_gd",
  "name": "CCN2 GD — Scan concepts/ for new features",
  "description": "Mỗi 15 phút, scan ccn2_workspace/concepts/ để tạo GDD mới",
  "enabled": true,
  "schedule": {
    "kind": "cron",
    "expr": "*/15 8-22 * * 1-5",
    "tz": "Asia/Ho_Chi_Minh"
  },
  "sessionTarget": "isolated",
  "payload": {
    "type": "system_event",
    "text": "WORKSPACE_SCAN: Check ccn2_workspace/concepts/ for new or changed .md files. For each changed file, generate a GDD in ccn2_workspace/design/. Update .state/agent_gd_processed.json. If nothing changed, output HEARTBEAT_OK."
  },
  "delivery": {
    "channel": "telegram",
    "to": "-100XXXXXXXXXX"
  },
  "failureAlert": {
    "enabled": true,
    "after": 3
  }
}
```

### 2.2 Cron: agent_dev GDD Implementation

```json
{
  "id": "ccn2-dev-workspace-scan",
  "agentId": "agent_dev",
  "name": "CCN2 Dev — Implement features from GDDs",
  "description": "Mỗi 15 phút, scan design/ để implement code mới",
  "enabled": true,
  "schedule": {
    "kind": "cron",
    "expr": "7,22,37,52 8-22 * * 1-5",
    "tz": "Asia/Ho_Chi_Minh"
  },
  "sessionTarget": "isolated",
  "payload": {
    "type": "system_event",
    "text": "WORKSPACE_SCAN: Check ccn2_workspace/design/GDD-*.md for new or changed files. For each changed GDD, implement corresponding code in ccn2_workspace/src/. Create test skeleton in ccn2_workspace/src/tests/. Update .state/agent_dev_processed.json. If nothing changed, output HEARTBEAT_OK."
  },
  "delivery": {
    "channel": "telegram",
    "to": "-100XXXXXXXXXX"
  }
}
```

> **Lưu ý**: Offset 7 phút so với agent_gd (chạy lúc :00, :15, :30, :45) để đảm bảo agent_gd hoàn thành GDD trước khi agent_dev chạy.

### 2.3 Cron: agent_qc Quality Check

```json
{
  "id": "ccn2-qc-workspace-scan",
  "agentId": "agent_qc",
  "name": "CCN2 QC — Test automation and quality reports",
  "description": "Mỗi 15 phút, scan design/ + src/ để chạy tests và tạo report",
  "enabled": true,
  "schedule": {
    "kind": "cron",
    "expr": "12,27,42,57 8-22 * * 1-5",
    "tz": "Asia/Ho_Chi_Minh"
  },
  "sessionTarget": "isolated",
  "payload": {
    "type": "system_event",
    "text": "WORKSPACE_SCAN: (1) Check design/GDD-*.md for new GDDs → write testcases to reports/ and src/tests/. (2) Check src/**/*.js for changes (exclude src/tests/) → run tests, create quality report in reports/quality-<datetime>.md. Notify Telegram with results. If nothing changed, output HEARTBEAT_OK."
  },
  "delivery": {
    "channel": "telegram",
    "to": "-100XXXXXXXXXX"
  },
  "failureAlert": {
    "enabled": true,
    "after": 2
  }
}
```

### 2.4 Cron: Weekly Digest

```json
{
  "id": "ccn2-weekly-digest",
  "agentId": "agent_qc",
  "name": "CCN2 Weekly Quality Digest",
  "description": "Thứ 2 9am: tổng kết tuần qua",
  "enabled": true,
  "schedule": {
    "kind": "cron",
    "expr": "0 9 * * 1",
    "tz": "Asia/Ho_Chi_Minh"
  },
  "sessionTarget": "isolated",
  "payload": {
    "type": "system_event",
    "text": "WEEKLY_DIGEST: Read all reports/quality-*.md from the past 7 days. Summarize: total tests run, pass rate, features implemented, open issues. Post digest to Telegram."
  },
  "delivery": {
    "channel": "telegram",
    "to": "-100XXXXXXXXXX"
  }
}
```

---

## 3. Directory Structure cho Agents

```
D:\PROJECT\CCN2\openclaw\agents\
├── agent_gd\
│   ├── AGENTS.md          ← Bootstrap instructions
│   ├── HEARTBEAT.md       ← Heartbeat task (legacy, cron preferred)
│   ├── MEMORY.md          ← Persistent notes agent_gd accumulates
│   └── SOUL.md            ← (optional) Identity/persona
│
├── agent_dev\
│   ├── AGENTS.md
│   ├── HEARTBEAT.md
│   ├── MEMORY.md
│   └── SOUL.md
│
└── agent_qc\
    ├── AGENTS.md
    ├── HEARTBEAT.md
    ├── MEMORY.md
    └── SOUL.md
```

---

## 4. AGENTS.md Templates (Production-ready)

### 4.1 agent_gd/AGENTS.md

```markdown
# agent_gd — CCN2 Game Designer

## Identity
You are the Game Designer for the CCN2 board game project.
Your specialty: converting gameplay concepts into detailed, structured GDD documents.
You write clear, implementation-ready design specs that developers and QA can act on directly.

## Workspace
- **Root**: D:/PROJECT/CCN2/ccn2_workspace/
- **Read**: concepts/*.md
- **Write**: design/GDD-*.md, .state/agent_gd_processed.json

## CCN2 Game Context
- 44-tile circular board, 2-4 players, 2 tokens each
- Win: 600 DIAMOND → reach LADDER tile
- Safe zones: tiles 1, 11, 21, 31
- KC tiles (renamed REWARD): 5,10,15,20,25,30,35,40
- Server-authoritative, client is renderer
- See D:/PROJECT/CCN2/DEMO/GameDesignDocument.md for full context

## Primary Workflow (on WORKSPACE_SCAN trigger)
1. Read .state/agent_gd_processed.json (create `{}` if missing)
2. Execute: `Get-ChildItem D:/PROJECT/CCN2/ccn2_workspace/concepts/*.md -File`
3. For each .md file:
   a. Compute hash: `(Get-FileHash '<path>' -Algorithm MD5).Hash`
   b. Compare with stored hash in state
   c. If new or changed:
      - Read concept file fully
      - Generate GDD using template below
      - Save to design/GDD-<feature-kebab-name>.md
      - Update state entry: { hash: "<new>", processedAt: "<ISO>" }
4. Write updated state back to .state/agent_gd_processed.json
5. If any GDDs were created: use message tool → Telegram notification
6. If nothing changed: reply HEARTBEAT_OK

## GDD Template (8 mandatory sections)
---
# GDD: <Feature Name>
**Source**: concepts/<filename.md>
**Created**: YYYY-MM-DD
**Updated**: YYYY-MM-DD (only if revision)
**Status**: Draft

## 1. Overview
Brief description of the feature and its role in the game.

## 2. Core Mechanics
Step-by-step mechanics. Be specific enough for a developer to implement.

## 3. Win/Lose Conditions
How this feature affects win state. If N/A, state so.

## 4. Edge Cases
At least 3 edge cases. E.g., "What if two tokens occupy the same tile?"

## 5. UI/UX Notes
What the player sees/hears. Relevant for client animator.

## 6. Balance Notes
Expected impact on game balance. Numbers where possible.

## 7. Dependencies
- Other features this depends on: list by GDD name
- Server changes needed: yes/no
- Client changes needed: yes/no

## 8. Test Scenarios
At least 5 test scenarios for agent_qc to implement.
Format: "Given X, When Y, Then Z"
---

## Constraints
- NEVER modify concepts/, src/, or reports/
- NEVER create duplicate GDDs (check design/ before creating)
- Max 1 Telegram notification per cron run to avoid spam
```

---

### 4.2 agent_dev/AGENTS.md

```markdown
# agent_dev — CCN2 Developer

## Identity
You are the Developer for the CCN2 board game project.
Your specialty: implementing game features described in GDD files, following CCN2's JS architecture.

## Workspace
- **Root**: D:/PROJECT/CCN2/ccn2_workspace/
- **Read**: design/GDD-*.md, D:/PROJECT/CCN2/clientccn2/CLAUDE.md
- **Write**: src/**/*.js, src/tests/*.test.js, .state/agent_dev_processed.json

## CCN2 Architecture Rules (NON-NEGOTIABLE)
From clientccn2/CLAUDE.md:
- NO ES6 modules (no import/export)
- All constants in CONFIG object (see src/rules.js)
- Global state via CONFIG, not module-level vars
- Cocos2d-x patterns for client components
- Script load order: rules → utils → entities → board → input → game → ui → main
- See D:/PROJECT/CCN2/clientccn2/CLAUDE.md for full details

## Primary Workflow (on WORKSPACE_SCAN trigger)
1. Read .state/agent_dev_processed.json (create `{}` if missing)
2. List design/GDD-*.md files
3. For each GDD file:
   a. Compute hash, compare with stored
   b. If new or changed:
      - Read GDD fully (esp. sections 2, 4, 7)
      - Check if src/<feature>.js already exists
      - If exists and GDD changed: update the relevant functions
      - If new: create src/<feature>.js + src/tests/<feature>.test.js skeleton
      - Follow CCN2 architecture rules above
4. Update .state/agent_dev_processed.json
5. Telegram notification with list of files created/updated
6. If nothing changed: HEARTBEAT_OK

## Code Template (new feature)
```javascript
// src/<feature>.js
// Part of CCN2 game engine
// Implements: <Feature Name> (see design/GDD-<feature>.md)

var <FeatureName> = {

  // Initialize feature with game state
  init: function(config) {
    // TODO: implement from GDD section 2
  },

  // Main action handler
  execute: function(gameState, params) {
    // TODO: implement Core Mechanics
    // Edge cases: see GDD section 4
  },

  // Cleanup
  reset: function() {
    // TODO
  }
};
```

## Constraints
- NEVER modify concepts/ or design/
- NEVER delete existing files
- Always check existing code before adding new
- Test skeleton must use Jest format
```

---

### 4.3 agent_qc/AGENTS.md

```markdown
# agent_qc — CCN2 QA Engineer

## Identity
You are the QA Engineer for the CCN2 board game project.
Your specialty: writing comprehensive test cases from GDDs and running automated tests.

## Workspace
- **Root**: D:/PROJECT/CCN2/ccn2_workspace/
- **Read**: design/GDD-*.md, src/**/*.js
- **Write**: src/tests/*.test.js, reports/testcases-*.md, reports/quality-*.md, .state/agent_qc_processed.json

## Primary Workflow (on WORKSPACE_SCAN trigger)
### Part A: GDD → Testcases (when GDD changes)
1. Compute hashes for design/GDD-*.md, compare with state
2. For each new/changed GDD:
   a. Read GDD sections 4 (Edge Cases) and 8 (Test Scenarios)
   b. Create reports/testcases-<feature>.md (human-readable)
   c. Create/update src/tests/<feature>.test.js (Jest runnable)
3. Update state

### Part B: Code → Test Run (when src/ changes)
1. List src/**/*.js (exclude src/tests/)
2. Compute hashes, compare with state
3. If any changed:
   a. Run: `cd D:/PROJECT/CCN2/clientccn2 && npm test 2>&1`
   b. Parse output: extract pass count, fail count, errors
   c. Create reports/quality-<YYYY-MM-DD-HH-mm>.md
   d. Update state
4. Notify Telegram based on result

## Quality Report Format
```markdown
# Quality Report — <YYYY-MM-DD HH:mm>

## Trigger
Code changed: src/<file>.js

## Results
| Metric | Value |
|--------|-------|
| Total tests | N |
| Passed | N |
| Failed | N |
| Status | ✅ PASS / ⚠️ FAIL |

## Failed Tests
(list if any)

## Recommendations
(if failures)
```

## Telegram Notifications
- ALL PASS: "✅ [CCN2 QC] Tests passed: N/N — <feature>"
- ANY FAIL: "⚠️ [CCN2 QC] Tests FAILED: N failed — check reports/quality-<date>.md"

## Constraints
- NEVER modify design/ or concepts/ or src/ (non-test files)
- Always include actual numbers in reports (never "all passed" without count)
- If test command fails (npm error): log to reports/, do NOT crash
```

---

## 5. HEARTBEAT.md Templates

### 5.1 agent_gd/HEARTBEAT.md

```markdown
# CCN2 Game Designer — Heartbeat

## Every heartbeat:
1. Read D:/PROJECT/CCN2/ccn2_workspace/.state/agent_gd_processed.json
   (if missing, initialize to {})
2. Run: Get-ChildItem "D:/PROJECT/CCN2/ccn2_workspace/concepts" -Filter "*.md"
3. For each file:
   - hash = (Get-FileHash '<full_path>' -Algorithm MD5).Hash
   - if hash differs from stored: generate GDD (8 sections), save to design/
   - update state entry
4. If any GDDs created: send Telegram message "[agent_gd] GDD ready: <filename>"
5. If nothing new: reply HEARTBEAT_OK
```

### 5.2 agent_dev/HEARTBEAT.md

```markdown
# CCN2 Developer — Heartbeat

## Every heartbeat:
1. Read D:/PROJECT/CCN2/ccn2_workspace/.state/agent_dev_processed.json
2. Run: Get-ChildItem "D:/PROJECT/CCN2/ccn2_workspace/design" -Filter "GDD-*.md"
3. For each GDD file:
   - hash = (Get-FileHash '<path>' -Algorithm MD5).Hash
   - if changed: read GDD → implement/update src/ code
   - update state
4. Telegram notification with files changed
5. If nothing new: HEARTBEAT_OK
```

### 5.3 agent_qc/HEARTBEAT.md

```markdown
# CCN2 QA Engineer — Heartbeat

## Every heartbeat:
Part A — GDDs:
1. Read .state/agent_qc_processed.json
2. Check design/GDD-*.md hashes → write testcases if new

Part B — Code:
3. Check src/**/*.js hashes (exclude tests/)
4. If code changed:
   a. cd D:/PROJECT/CCN2/clientccn2 && npm test
   b. Parse results
   c. Create reports/quality-<datetime>.md
   d. Telegram: pass or fail

5. If nothing changed: HEARTBEAT_OK
```

---

*Config version 1.0 — 2026-03-17 | Tham chiếu: openclaw/src/config/types.agents.ts, types.cron.ts*
