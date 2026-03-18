# Round 2 — agent_dev Code Workflow: Implementation Plan
**Date**: 2026-03-18
**Spec**: `specs/2026-03-18-agent-dev-workflow-design.md` (v3 — APPROVED)
**Session**: William Đào 👌

---

## Deliverables (10 items)

| # | File/Folder | Chunk |
|---|-------------|-------|
| 1 | `ccn2_workspace/analysis/` folder | A |
| 2 | `ccn2_workspace/eval/CODE-EVAL-RUBRIC.md` | A |
| 3 | `ccn2_workspace/.state/agent_dev_processed.json` | A |
| 4 | `ccn2_workspace/.state/agent_dev_dispatched.json` | A |
| 5 | `openclaw/agents/agent_dev/AGENTS.md` upgraded | B |
| 6 | `openclaw/agents/agent_dev_client/AGENTS.md` + `SOUL.md` | C |
| 7 | `openclaw/agents/agent_dev_server/AGENTS.md` + `SOUL.md` | C |
| 8 | `openclaw/agents/agent_dev_admin/AGENTS.md` + `SOUL.md` | C |
| 9 | `~/.openclaw/openclaw.json` — thêm 3 agents mới | C |
| 10 | `ccn2_workspace/progress/PROGRESS.md` updated | D |

---

## Chunk A — Infrastructure (analysis/ + eval/ + state JSONs)

### Task A1: Tạo analysis/ folder + CODE-EVAL-RUBRIC.md

**Files:**
- Create: `ccn2_workspace/analysis/.gitkeep`
- Create: `ccn2_workspace/eval/CODE-EVAL-RUBRIC.md`

- [ ] **A1.1** Tạo `ccn2_workspace/analysis/` folder
- [ ] **A1.2** Viết `ccn2_workspace/eval/CODE-EVAL-RUBRIC.md`:

```markdown
# CODE-EVAL-RUBRIC — agent_dev Code Workflow

## Client Mode (TypeScript/Vite/Cocos2d) — pass ≥80/100

| Dimension | Weight | Pass Criteria |
|-----------|--------|---------------|
| GDD Alignment | 30pt | TypeScript features map đúng GDD mechanics |
| Pattern Compliance | 25pt | Dùng demo-main patterns: BaseLayer/BaseModal/SceneManager/EventEmitter3 |
| Type Safety | 20pt | Strict TypeScript typing, interfaces cho tất cả state/event |
| Error Handling | 15pt | try/catch tường minh + EventEmitter error events |
| Testability | 10pt | Functions Jest-able, không side effects ẩn |

## Server Mode (Kotlin/Ktor/Actor) — pass ≥80/100

| Dimension | Weight | Pass Criteria |
|-----------|--------|---------------|
| GDD Alignment | 30pt | Kotlin logic map đúng GDD mechanics, không contradictions |
| Pattern Compliance | 25pt | Actor model (suspend + coroutine), Exposed ORM (không raw SQL) |
| Type Safety | 20pt | Kotlin null-safe, sealed classes cho state, Result type cho errors |
| Error Handling | 15pt | suspend function + Result<T>, không blocking call |
| Testability | 10pt | Functions unit-testable, dependencies injectable |

## Admin Mode (Java+React) — pass ≥80/100

| Dimension | Weight | Pass Criteria |
|-----------|--------|---------------|
| GDD Alignment | 30pt | CRUD panels cover đúng data model từ DESIGN-<name>.md |
| Pattern Compliance | 25pt | REST controller pattern (Java), functional React + hooks |
| Type Safety | 20pt | Java type-safe beans, TypeScript strict trong React components |
| Error Handling | 15pt | HTTP status codes đúng, validation errors hiển thị rõ |
| Testability | 10pt | Services mockable, controllers testable với MockMvc |

## Score Gates (tất cả 3 modes)

| Score | Action |
|-------|--------|
| < 60 | KHÔNG write file. Telegram: `[<agent>] CODE FAIL: <feature>/<layer> score=XX` |
| 60–79 | Write file, status=done_warning. Telegram: `[<agent>] CODE WARNING: <feature>/<layer> score=XX — human review recommended` |
| ≥ 80 | Write file, status=done. Telegram: `[<agent>] Code ready: <feature>/<layer> score=XX` |

## Eval Output Format

```
# CODE-EVAL: <layer>-<feature> — YYYY-MM-DD
**Mode**: Client | Server | Admin
**Score**: XX/100 — PASS | WARNING | FAIL

## Dimension Scores
| Dimension | Score | Max | Notes |

## Issues Found
- [CRITICAL] ...
- [WARNING] ...

## Recommendation
PASS | WARNING | FAIL
```
```

### Task A2: Tạo state JSON files

**Files:**
- Create: `ccn2_workspace/.state/agent_dev_processed.json`
- Create: `ccn2_workspace/.state/agent_dev_dispatched.json`

- [ ] **A2.1** Tạo `agent_dev_processed.json` với schema mới:

```json
{}
```
*(Empty object — populated khi agent_dev process feature đầu tiên)*

Schema reference per entry:
```json
{
  "<feature-name>": {
    "gdd_hash": null,
    "req_score": null,
    "req_status": null,
    "design_score": null,
    "design_status": null,
    "combined_score": null,
    "processedAt": null,
    "overall_status": "pending"
  }
}
```

- [ ] **A2.2** Tạo `agent_dev_dispatched.json`:

```json
{}
```
*(Empty object — populated khi agent_dev dispatch lần đầu)*

Schema reference per entry:
```json
{
  "<feature-name>": {
    "dispatched_at": null,
    "gdd_path": null,
    "sub_agents": {
      "client": { "status": "pending", "score": null, "output": null },
      "server": { "status": "pending", "score": null, "output": null },
      "admin":  { "status": "pending", "score": null, "output": null }
    },
    "overall_status": "pending"
  }
}
```

---

## Chunk B — agent_dev AGENTS.md Upgrade

### Task B1: Upgrade agent_dev AGENTS.md

**File:** `openclaw/agents/agent_dev/AGENTS.md` — full overwrite, giữ Round 1 logic + thêm Round 2

- [ ] **B1.1** Đọc file AGENTS.md hiện tại của agent_dev
- [ ] **B1.2** Overwrite toàn bộ với nội dung mới:
  - **Giữ Round 1 logic**: hash scan, Telegram notify pattern, cron trigger
  - **Thêm Round 2**: 4-phase pipeline (REQ → DESIGN → DESIGN-EVAL → Dispatch)
  - Trigger map với hash tracking mechanism
  - Phase 1 flow (Requirements Analysis + UseCase diagram)
  - Phase 2 flow (System Design + 4 Mermaid diagrams)
  - Phase 3 flow (Combined eval → DESIGN-EVAL-*.md)
  - Phase 4 flow (Dispatch với fallback rule)
  - Aggregation & notification (batch max 1/scan)
  - State machine documentation
  - Full constraints list

**Key rules trong AGENTS.md mới:**
```
WORKSPACE: ccn2_workspace/
IDENTITY: Codera — Tech Lead, Software Architect
LANGUAGE: Tiếng Việt cho tất cả analysis docs
READ-ONLY: design/, eval/ (chỉ đọc GDD và rubric)
WRITE: analysis/, .state/ (artifacts + state)
NEVER WRITE: src/, concepts/, serverccn2/, clientccn2/
EVAL GATE: combined <70 → KHÔNG dispatch
RETRY LIMIT: max 2 lần re-eval per phase
TELEGRAM: max 1 batch per WORKSPACE_SCAN
```

---

## Chunk C — 3 New Sub-agents + openclaw.json

### Task C1: agent_dev_client (Pixel)

**Files:**
- Create: `openclaw/agents/agent_dev_client/SOUL.md`
- Create: `openclaw/agents/agent_dev_client/AGENTS.md`

- [ ] **C1.1** Tạo `SOUL.md` cho Pixel:

```markdown
# SOUL — agent_dev_client (Pixel)

## Identity
- **Tên**: Pixel
- **Role**: Frontend Developer — TypeScript/Vite/Cocos2d Specialist
- **Personality**: Chi tiết, cẩn thận với type safety, hỏi lại khi interface không rõ
- **Tone**: Technical nhưng clear, tránh magic code không có comment

## Focus Areas
- UI/UX flow từ GDD → code
- Event-driven communication (EventEmitter3)
- Render performance (object pooling, sprite sheet)
- TypeScript strict mode — không any, không unknown nếu tránh được

## Core Rule
Chỉ viết code vào staging area src/client/. Không bao giờ chạm clientccn2/.
```

- [ ] **C1.2** Tạo `AGENTS.md` cho Pixel với:
  - Input format (dispatch message JSON)
  - Full flow: READ → IDENTIFY → GENERATE (in-memory) → SELF-EVAL → conditionally WRITE
  - Demo-main patterns bắt buộc (SceneManager, EventEmitter3, BaseLayer/BaseModal)
  - Score gates (< 60 không write; 60-79 write + WARNING; ≥80 write + ready)
  - OUTPUT: `src/client/<feature>/` + `eval/CODE-EVAL-client-<name>-<date>.md`
  - UPDATE: `agent_dev_dispatched.json` status
  - CONSTRAINTS: Read-only GDD/REQ/DESIGN, output vào staging only

### Task C2: agent_dev_server (Forge)

**Files:**
- Create: `openclaw/agents/agent_dev_server/SOUL.md`
- Create: `openclaw/agents/agent_dev_server/AGENTS.md`

- [ ] **C2.1** Tạo `SOUL.md` cho Forge:

```markdown
# SOUL — agent_dev_server (Forge)

## Identity
- **Tên**: Forge — Backend Architect, Kotlin/Ktor Specialist
- **Personality**: Chính xác, không ambiguous, flag ngay khi spec mâu thuẫn
- **Tone**: Technical, terse, evidence-based

## Focus Areas
- Actor model integrity (suspend + coroutine, no blocking)
- Null-safety (sealed classes, Result<T>)
- DB schema consistency (Exposed ORM)
- Thread-safety trong game room context

## Core Rule
Output vào staging src/server/. Config JSON vào src/server/<feature>/ — không chạm workspace root res/.
```

- [ ] **C2.2** Tạo `AGENTS.md` cho Forge:
  - Input format + full flow (C2 fix: GENERATE → EVAL → conditionally WRITE)
  - Server patterns: Module.kt + RequestHandler + EventListener
  - Actor model rules (suspend, không blocking)
  - Config output: src/server/<feature>/ (staging)
  - Score gates + UPDATE dispatched.json

### Task C3: agent_dev_admin (Panel)

**Files:**
- Create: `openclaw/agents/agent_dev_admin/SOUL.md`
- Create: `openclaw/agents/agent_dev_admin/AGENTS.md`

- [ ] **C3.1** Tạo `SOUL.md` cho Panel:

```markdown
# SOUL — agent_dev_admin (Panel)

## Identity
- **Tên**: Panel — Admin Tool Specialist, Java+React Developer
- **Personality**: Thực dụng, prioritize data validation và error states
- **Tone**: Clear, focus on usability, không over-engineer

## Focus Areas
- CRUD completeness (create/read/update/delete đủ)
- REST contract adherence (endpoints từ DESIGN, không tự invent)
- Admin UX clarity (error messages helpful, validation visible)
- Token auth từ admintool config

## Core Rule
Output vào staging src/admin/. Endpoints đọc từ DESIGN-<name>.md — không hardcode hay invent.
```

- [ ] **C3.2** Tạo `AGENTS.md` cho Panel:
  - Input format + full flow (C2 fix: GENERATE → EVAL → conditionally WRITE)
  - Java bean + controller + React component patterns
  - Endpoint rule: đọc từ DESIGN-<name>.md Admin layer breakdown
  - Auth: token từ admintool config
  - Score gates + UPDATE dispatched.json

### Task C4: Thêm 3 agents vào openclaw.json

**File:** `~/.openclaw/openclaw.json`

- [ ] **C4.1** Đọc openclaw.json hiện tại
- [ ] **C4.2** Thêm 3 entries mới:
  - `agent_dev_client` — Pixel, cùng model với agent_dev
  - `agent_dev_server` — Forge, cùng model với agent_dev
  - `agent_dev_admin` — Panel, cùng model với agent_dev
  - Path: `openclaw/agents/agent_dev_client/AGENTS.md` etc.

---

## Chunk D — Progress Update

### Task D1: Cập nhật PROGRESS.md

**File:** `ccn2_workspace/progress/PROGRESS.md`

- [ ] **D1.1** Cập nhật Phase table:
  - `agent_gd GDD Workflow` → ✅ XONG
  - `agent_dev Code Workflow` → ✅ XONG
  - `agent_qc Test Workflow` → ⬜ TODO (Round 2 Phase 3)

- [ ] **D1.2** Cập nhật `plans/round2-progress.md`:
  - Thêm section "Round 2 Phase 2 — agent_dev Code Workflow"
  - Ghi tất cả 10 deliverables với status
  - Link tới spec và plan files

---

## Thứ tự thực hiện

```
Chunk A (parallel-able): A1 + A2 cùng lúc
Chunk B: B1 (cần context từ A để viết đúng paths)
Chunk C (parallel-able): C1 + C2 + C3 cùng lúc → C4 sau khi C1-C3 xong
Chunk D: D1 sau khi C4 xong
```

**Parallel dispatch plan:**
- Agent 1 → Chunk A (infrastructure)
- Agent 2 → Chunk B (agent_dev AGENTS.md)
- Agent 3 → Chunk C1+C2+C3 (3 sub-agents)
- → Sau: Agent 4 → C4 + D1 (openclaw.json + progress)
