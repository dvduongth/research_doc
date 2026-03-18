# Design Spec: agent_dev Code Workflow — Round 2
**Date**: 2026-03-18
**Author**: William Đào 👌
**Status**: Approved (v3 — N1/N2/N3 minor fixes)
**Reference**:
- `D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\demo-main\` — TypeScript/Vite stack
- `D:\PROJECT\CCN2\research_doc\GDD_Overview_v2_ElementalHunter.md`
- `plans/round2-agent-dev-workflow.md` — Full design (5 sections)

---

## Fixes Applied (from spec review)

| ID | Severity | Fix |
|----|----------|-----|
| C1 | CRITICAL | **Path unification**: Tất cả orchestrator analysis artifacts (`REQ-`, `DESIGN-`, `DESIGN-EVAL-`) đều nằm trong `analysis/`. Code eval artifacts (`CODE-EVAL-`) nằm trong `eval/`. Đổi tên `EVAL-<name>-<date>.md` → `DESIGN-EVAL-<name>-<date>.md` để phân biệt rõ. |
| C2 | CRITICAL | **Sub-agent flow restructure**: Thêm bước "GENERATE to buffer" tường minh trước SELF-EVAL. Flow: GENERATE (in-memory content) → SELF-EVAL trên generated content → conditionally WRITE to disk. Score <60 → không write. |
| W1 | WARNING | **Hash tracking mechanism**: Ghi rõ agent đọc `gdd_hash` từ `agent_dev_processed.json`, tính MD5 file hiện tại, nếu khác → re-run Phase 1+2. |
| W2 | WARNING | **Stack clarification**: Xóa "SystemJS output" khỏi Pixel spec (Vite không pair với SystemJS by default). Giữ: Vite 7 + Cocos2d 3.10 + demo-main patterns. |
| W3 | WARNING | **Dispatch fallback rule**: Nếu GDD Section 8 absent/unclear → default dispatch tất cả 3 sub-agents. |
| W4 | WARNING | **WARNING state**: Thêm `[DONE_WARNING]` overall_status khi ≥1 sub-agent score 60–79. |
| W5 | WARNING | **SOUL.md persona hints**: Thêm mô tả ngắn personality cho 3 sub-agents mới. |
| W6 | WARNING | **Panel endpoint constraint**: Panel phải đọc server endpoints từ `DESIGN-<name>.md`, không tự invent. Admin REST API dùng token auth từ admintool config. |
| I1 | INFO | **GDD Coverage criterion**: Đổi "≥90% GDD sections" → "≥90% relevant GDD sections cho feature này" — agent phải identify relevant sections trước. |
| I2 | INFO | **Notification batching**: Sub-agent completion notifications được gom trong aggregation step của agent_dev, không notify individual completion. |
| I3 | INFO | **Rename**: `EVAL-` → `DESIGN-EVAL-` (đã apply trong C1). |

---

## Summary

Build a **Orchestrator + 3 Sub-agents** code workflow cho agent_dev (Codera). Agent tự động:
1. Nhận GDD-FEATURE-*.md (Status: Review) → phân tích yêu cầu + thiết kế hệ thống
2. Self-eval cả hai phases (score-gated) với Mermaid diagrams
3. Dispatch đồng thời đến 3 sub-agents (client/server/admin)
4. Sub-agents generate code vào staging area → self-eval → report kết quả
5. agent_qc chạy code review độc lập → authoritative

**3 specs riêng biệt** (client / server / admin) — agent_dev orchestrate cả 3.

---

## Section 1: Overall Architecture

### Agent Topology

| Agent | Tên | Role | Stack |
|-------|-----|------|-------|
| agent_dev | Codera | Orchestrator — Tech Lead | Phân tích + Design + Dispatch |
| agent_dev_client | Pixel | Sub-agent — Client | TypeScript + Vite 7 + Cocos2d 3.10 |
| agent_dev_server | Forge | Sub-agent — Server | Kotlin/Ktor + Exposed + Actor model |
| agent_dev_admin | Panel | Sub-agent — Admin | Java + React + REST |

### agent_dev 4-Phase Pipeline

```
Phase 1: Requirements Analysis
  READ GDD-FEATURE-<name>.md (Status: Review|Approved)
  EXTRACT actors, use cases, business rules, edge cases, constraints
  GENERATE analysis/REQ-<name>.md (Vietnamese + Mermaid UseCase)
  SELF-EVAL Requirements Rubric (pass ≥70, max 2 retries)

Phase 2: System Design
  READ REQ-<name>.md + GDD
  GENERATE analysis/DESIGN-<name>.md (4 Mermaid diagrams + layer breakdown)
  SELF-EVAL Design Rubric (pass ≥70, max 2 retries)

Phase 3: Combined Eval
  combined = (req_score × 0.4) + (design_score × 0.6)
  SAVE analysis/DESIGN-EVAL-<name>-<date>.md
  combined <70 → flag human, KHÔNG dispatch

Phase 4: Dispatch
  READ GDD Section 8 (Dependencies) — fallback: dispatch all 3 nếu absent
  BUILD + BROADCAST dispatch messages simultaneously
  UPDATE agent_dev_dispatched.json
```

### Eval Rubrics

**Requirements Rubric (100pt — pass ≥70):**

| Dimension | Weight | Pass Criteria |
|-----------|--------|---------------|
| GDD Coverage | 35pt | ≥90% relevant GDD sections cho feature này được map (agent phải identify relevant sections trước) |
| Edge Case Capture | 25pt | ≥3 edge cases từ GDD Section 4, format "If X then Y" |
| Actor Completeness | 20pt | Tất cả actors (Player, Server, AdminUser nếu liên quan) được identify |
| Use Case Clarity | 20pt | Mỗi use case: Actor + Pre/Post condition + Main Flow |

**Design Rubric (100pt — pass ≥70):**

| Dimension | Weight | Pass Criteria |
|-----------|--------|---------------|
| GDD Alignment | 35pt | Design map đúng GDD mechanics, không contradictions |
| Diagram Completeness | 25pt | UseCase + Sequence đủ, Class diagram cho domain objects |
| Cross-layer Consistency | 25pt | Client ↔ Server ↔ Admin interfaces align |
| Implementability | 15pt | Dev đọc diagram → implement không cần hỏi thêm |

---

## Section 2: File Architecture

```
ccn2_workspace/
├── design/                             ← GDD input files (read-only by agent_dev)
│   ├── GDD-TEMPLATE-FEATURE.md
│   ├── GDD-TEMPLATE-GAME.md
│   └── GDD-FEATURE-<name>.md           ← output của agent_gd, input cho agent_dev
│
├── analysis/                           ← orchestrator artifacts (read/write by agent_dev)
│   ├── REQ-<feature>.md                ← Phase 1: Requirements + UseCase diagram
│   ├── DESIGN-<feature>.md             ← Phase 2: System Design + 4 Mermaid diagrams
│   └── DESIGN-EVAL-<feature>-<date>.md ← Phase 3: Combined eval report
│
├── src/                                ← staging area (write by sub-agents only)
│   ├── client/                         ← TypeScript, demo-main patterns
│   │   └── <feature>/
│   │       ├── <Feature>Layer.ts
│   │       ├── <Feature>Modal.ts       (nếu có popup)
│   │       └── types.ts
│   ├── server/                         ← Kotlin/Ktor, Actor model
│   │   └── <feature>/
│   │       ├── <Feature>Module.kt
│   │       ├── <Feature>RequestHandler.kt
│   │       └── <Feature>EventListener.kt
│   └── admin/                          ← Java + React
│       └── <feature>/
│           ├── <Feature>Bean.java
│           ├── <Feature>Controller.java
│           └── <Feature>Panel.tsx
│
├── eval/                               ← code eval artifacts (write by sub-agents)
│   ├── CODE-EVAL-RUBRIC.md             ← 3 modes: Client / Server / Admin
│   └── CODE-EVAL-<layer>-<name>-<date>.md
│
└── .state/
    ├── agent_dev_processed.json        ← per feature: req_score, design_score, hash
    └── agent_dev_dispatched.json       ← per feature per sub-agent: status, score, output

openclaw/agents/
├── agent_dev/AGENTS.md                 ← Upgraded: Phase 1-4 + eval + hash tracking
├── agent_dev_client/                   ← New (Pixel)
│   ├── AGENTS.md
│   └── SOUL.md
├── agent_dev_server/                   ← New (Forge)
│   ├── AGENTS.md
│   └── SOUL.md
└── agent_dev_admin/                    ← New (Panel)
    ├── AGENTS.md
    └── SOUL.md
```

**Naming conventions:**
- Requirements: `REQ-<kebab-case>.md`
- Design: `DESIGN-<kebab-case>.md`
- Combined eval: `DESIGN-EVAL-<kebab-case>-YYYY-MM-DD.md`
- Code eval: `CODE-EVAL-<client|server|admin>-<name>-YYYY-MM-DD.md`

---

## Section 3: agent_dev Orchestrator Workflow

### Trigger Map

| Trigger | Action |
|---------|--------|
| `WORKSPACE_SCAN` (cron 15 phút) | Scan design/ → GDD-FEATURE-*.md có Status: Review |
| GDD hash changed | Re-run Phase 1+2+3 (so sánh MD5 vs gdd_hash trong processed.json) |
| Telegram từ Daniel | Respond + WORKSPACE_SCAN ngay |
| Sub-agent status update | Poll .state/ → aggregate → batch notify khi all done |

### Hash Tracking Mechanism (W1)

```
1. READ agent_dev_processed.json → lấy gdd_hash["<feature>"]
2. CALCULATE MD5 của GDD-FEATURE-<name>.md hiện tại
3. IF hash khác → re-run Phase 1+2+3 (overwrite REQ + DESIGN + DESIGN-EVAL)
4. IF hash same → skip (đã process)
5. UPDATE gdd_hash sau khi process xong
```

### Phase 1 — Requirements Analysis

```
1. READ GDD-FEATURE-<name>.md
2. IDENTIFY relevant sections cho feature này
3. EXTRACT:
   - Actors: Player, Server, AdminUser (nếu liên quan)
   - Use Cases: từng action có thể thực hiện
   - Business Rules: Section 2 (Core Mechanics) + Section 3 (Win/Lose)
   - Edge Cases: Section 4 (min 3, "If X then Y")
   - Constraints: Section 6 (Balance & Config)
4. GENERATE analysis/REQ-<name>.md:
   - Mermaid UseCase diagram
   - Table: Actor | Use Case | Pre-condition | Post-condition | Main Flow
   - Edge Case list
   - Non-functional requirements (performance, security)
5. SELF-EVAL Requirements Rubric
   - <70 → revise + re-eval (max 2 lần)
   - Lần 3 fail → BLOCKED_REQ + Telegram flag human
   - ≥70 → proceed Phase 2
6. UPDATE agent_dev_processed.json: { gdd_hash, req_score, req_status }
```

### Phase 2 — System Design

```
1. READ REQ-<name>.md + GDD-FEATURE-<name>.md
2. GENERATE analysis/DESIGN-<name>.md:
   a. Mermaid UseCase (refined từ REQ)
   b. Mermaid Sequence (≥1 happy path + ≥1 error path)
   c. Mermaid Class (domain objects + relationships)
   d. Mermaid State (nếu feature có state machine)
   e. Layer breakdown:
      - Client: components, events, state
      - Server: modules/abilities/config
      - Admin: data models, endpoints, UI panels
3. SELF-EVAL Design Rubric
   - <70 → revise + re-eval (max 2 lần)
   - Lần 3 fail → BLOCKED_DESIGN + Telegram flag human
   - ≥70 → proceed Phase 3
4. UPDATE agent_dev_processed.json: { design_score, design_status }
```

### Phase 3 — Combined Eval

```
combined = (req_score × 0.4) + (design_score × 0.6)
SAVE analysis/DESIGN-EVAL-<name>-YYYY-MM-DD.md:
  - req_score, design_score, combined_score
  - Issues per phase
  - Recommendation: DISPATCH | BLOCK
combined <70 → KHÔNG dispatch, Telegram flag human
combined ≥70 → proceed Phase 4
UPDATE agent_dev_processed.json: { combined_score, overall_status: "ready_to_dispatch" }
```

### Phase 4 — Dispatch

```
1. READ GDD Section 8 (Dependencies):
   - "Server changes needed: yes/no" → dispatch agent_dev_server nếu yes
   - "Client changes needed: yes/no" → dispatch agent_dev_client nếu yes
   - Config keys needed → dispatch agent_dev_admin nếu admin data model cần
   FALLBACK: nếu Section 8 absent/unclear → dispatch cả 3 sub-agents

2. BUILD dispatch messages per sub-agent:
   {
     feature, gdd_path, req_path, design_path,
     layer: "client"|"server"|"admin",
     output_path: "src/client/"|"src/server/"|"src/admin/",
     priority_files: [...],     // từ DESIGN.md layer breakdown
     constraints: [...]         // layer-specific rules
   }

3. BROADCAST simultaneously đến sub-agents cần thiết

4. UPDATE agent_dev_dispatched.json:
   { feature: { dispatched_at, sub_agents: { <layer>: { status: "pending" } } } }

5. NOTIFY (batch): "[agent_dev] Dispatched: <name> → <layers>"
```

### Aggregation & Notification

```
Sau mỗi WORKSPACE_SCAN, agent_dev poll .state/agent_dev_dispatched.json:
- Nếu all assigned sub-agents = done|done_warning → aggregate report
- Gom tất cả sub-agent completions thành 1 Telegram message (không notify individual)
- Max 1 Telegram per WORKSPACE_SCAN
```

### Orchestrator Constraints

- READ từ `design/` (GDD input), `eval/`, `.state/`; WRITE vào `analysis/` và `.state/` — KHÔNG write vào `src/`
- Max 2 re-eval iterations per phase — lần 3 = BLOCKED + flag human
- Max 1 Telegram batch/WORKSPACE_SCAN
- KHÔNG dispatch nếu combined eval score < 70
- Mermaid: UseCase + Sequence bắt buộc; Class + State nếu phù hợp
- NEVER modify `concepts/` hay source code trong serverccn2/ hoặc clientccn2/
- Vietnamese cho tất cả analysis docs

---

## Section 4: Sub-agent Workflows

### agent_dev_client (Pixel) — TypeScript/Vite/Cocos2d

**Persona (SOUL.md):**
- Tên: Pixel — Frontend specialist, cẩn thận với type safety
- Tone: Chi tiết, hỏi lại khi interface không rõ
- Focus: UX flow, event-driven communication, render performance

**Input nhận:**
```json
{
  "feature": "<name>",
  "gdd_path": "design/GDD-FEATURE-<name>.md",
  "req_path": "analysis/REQ-<name>.md",
  "design_path": "analysis/DESIGN-<name>.md",
  "layer": "client",
  "output_path": "src/client/"
}
```

**Flow (C2 fix — GENERATE trước EVAL):**
```
1. READ GDD + REQ + DESIGN (read-only)
2. IDENTIFY: files cần tạo theo DESIGN.md Client layer breakdown
3. GENERATE TypeScript content (in-memory):
   - Strict typing — interfaces cho state/event
   - Vite 7 + Cocos2d 3.10 patterns (demo-main)
   - EventEmitter3 cho communication (KHÔNG global state)
   - BaseLayer cho game components / BaseModal cho popups
4. SELF-EVAL CODE-EVAL-RUBRIC.md (Client mode) trên generated content:
   - <60 → KHÔNG write, Telegram FAIL
   - 60-79 → WRITE to src/client/<feature>/, Telegram WARNING
   - ≥80 → WRITE to src/client/<feature>/, Telegram ready
5. SAVE eval/CODE-EVAL-client-<name>-<date>.md
6. UPDATE agent_dev_dispatched.json: status → done | done_warning | failed
   (agent_dev sẽ aggregate, không notify individual)
```

**Demo-main patterns bắt buộc:**
- `SceneManager.getInstance().loadScene()` cho scene transition
- `this.events.emit(EventKeys.X, payload)` — không dùng window events
- `CollisionGroup` enum + `checkCollision()` cho collision
- Extend `DraggableLayer` cho drag-drop features

---

### agent_dev_server (Forge) — Kotlin/Ktor

**Persona (SOUL.md):**
- Tên: Forge — Backend architect, ưu tiên correctness và thread-safety
- Tone: Chính xác, không ambiguous, flag khi spec mâu thuẫn
- Focus: Actor model integrity, null-safety, DB schema consistency

**Flow (C2 fix):**
```
1. READ GDD + REQ + DESIGN (read-only)
2. IDENTIFY server components từ DESIGN.md Server layer breakdown:
   - New module → Module.kt + RequestHandler + EventListener
   - New ability → abilities/execute/<Type>Executor.kt
   - New config → config/<domain>/<Name>Cfg.kt + staging res JSON
   - DB change → sql/ table + SqlVersioning update
3. GENERATE Kotlin content (in-memory):
   - Actor model (suspend function + coroutine scope, không blocking)
   - Exposed ORM (không raw SQL)
   - KSP serialization cho packets mới
4. SELF-EVAL CODE-EVAL-RUBRIC.md (Server mode) trên generated content:
   - <60 → KHÔNG write, Telegram FAIL
   - 60-79 → WRITE to src/server/<feature>/, Telegram WARNING
   - ≥80 → WRITE to src/server/<feature>/, Telegram ready
5. SAVE eval/CODE-EVAL-server-<name>-<date>.md
6. UPDATE agent_dev_dispatched.json
```

**Server constraints:**
- KHÔNG modify `concepts/`, workspace root `res/` — config JSON output vào `src/server/<feature>/` (staging)
- Config thay đổi → ghi cả Kotlin loader lẫn JSON vào staging folder
- Actor model: không blocking call trong coroutine scope

---

### agent_dev_admin (Panel) — Java + React

**Persona (SOUL.md):**
- Tên: Panel — Admin tool specialist, focus data integrity và usability
- Tone: Thực dụng, prioritize data validation và error states
- Focus: CRUD completeness, REST contract adherence, admin UX clarity

**Flow (C2 fix):**
```
1. READ GDD + REQ + DESIGN (read-only)
   → Endpoints phải đọc từ DESIGN-<name>.md, KHÔNG tự invent
2. IDENTIFY admin components từ DESIGN.md Admin layer breakdown:
   - Data model mới → Java bean + REST endpoint
   - UI view → React functional component + hooks
   - Config panel → CRUD UI cho res/*.json entries
3. GENERATE Java + TypeScript content (in-memory):
   - Java: bean + service + controller (REST)
   - React: TypeScript functional + Tailwind
   - Auth: token từ admintool config (không hardcode)
   - Kết nối server DB qua REST API (không direct DB)
4. SELF-EVAL CODE-EVAL-RUBRIC.md (Admin mode) trên generated content:
   - <60 → KHÔNG write, Telegram FAIL
   - 60-79 → WRITE to src/admin/<feature>/, Telegram WARNING
   - ≥80 → WRITE to src/admin/<feature>/, Telegram ready
5. SAVE eval/CODE-EVAL-admin-<name>-<date>.md
6. UPDATE agent_dev_dispatched.json
```

---

### CODE-EVAL-RUBRIC — 3 Modes (100pt — pass ≥80)

| Dimension | Client | Server | Admin | Weight |
|-----------|--------|--------|-------|--------|
| GDD Alignment | TS features map GDD | Kotlin logic map GDD | CRUD covers data model | 30pt |
| Pattern Compliance | demo-main patterns | Actor/Exposed patterns | REST/React patterns | 25pt |
| Type Safety | TS strict mode | Kotlin null-safe | Java+TS strict | 20pt |
| Error Handling | try/catch + EventEmitter | suspend + Result type | HTTP status + validation | 15pt |
| Testability | Jest-able units | Unit-testable functions | Mockable services | 10pt |

---

## Section 5: Constraints & State Machine

### Feature Lifecycle States

```
[PENDING]
    ↓ WORKSPACE_SCAN detect GDD (hash changed or new)
[ANALYZING]   ← Phase 1 đang chạy
    ↓ REQ eval ≥70
[DESIGNING]   ← Phase 2 đang chạy
    ↓ combined eval ≥70
[DISPATCHED]  ← Phase 4 broadcast xong
    ↓ Sub-agents nhận message
[IN_PROGRESS] ← per sub-agent: client / server / admin
    ↓ All sub-agents = done (score ≥80)
[DONE]
    ↓ (nếu ≥1 sub-agent score 60–79)
[DONE_WARNING]  ← done nhưng cần human review code quality

── Error branches ──
[ANALYZING]   → 2× fail → [BLOCKED_REQ]     → Telegram flag human
[DESIGNING]   → 2× fail → [BLOCKED_DESIGN]  → Telegram flag human
[IN_PROGRESS] → score <60 → [FAILED_<layer>] → Telegram WARNING
```

### State JSON Schemas

**agent_dev_processed.json:**
```json
{
  "<feature-name>": {
    "gdd_hash": "<md5>",
    "req_score": 78,
    "req_status": "pass",
    "design_score": 82,
    "design_status": "pass",
    "combined_score": 80.4,
    "processedAt": "2026-03-18T10:00:00Z",
    "overall_status": "dispatched"
  }
}
```

**agent_dev_dispatched.json:**
```json
{
  "<feature-name>": {
    "dispatched_at": "2026-03-18T10:05:00Z",
    "gdd_path": "design/GDD-FEATURE-<name>.md",
    "sub_agents": {
      "client": { "status": "done",         "score": 85, "output": "src/client/<name>/" },
      "server": { "status": "done_warning",  "score": 72, "output": "src/server/<name>/" },
      "admin":  { "status": "pending",       "score": null, "output": null }
    },
    "overall_status": "in_progress"
  }
}
```

**overall_status values:**
- `"pending"` — chưa dispatch
- `"in_progress"` — ≥1 sub-agent pending/in_progress
- `"done"` — tất cả sub-agents score ≥80
- `"done_warning"` — tất cả done nhưng ≥1 sub-agent score 60–79
- `"failed"` — ≥1 sub-agent score <60

### Telegram Notification Format (batched — max 1/WORKSPACE_SCAN)

```
[agent_dev] Dispatched: ladder-mechanic → client + server + admin

[agent_dev] Update: ladder-mechanic — all done
  ✅ client (Pixel) score=85 → src/client/ladder/ ready
  ⚠️ server (Forge) score=72 → src/server/ladder/ saved (WARNING)
  ✅ admin (Panel) score=83 → src/admin/ladder/ ready
  overall_status: done_warning → human review recommended

[agent_dev] BLOCKED: ladder-mechanic REQ eval failed 2×
  score=58/100 | GDD Coverage thiếu Section 3
  → Human review: analysis/REQ-ladder-mechanic.md
```

---

## Deliverables Checklist

| # | File/Folder | Status |
|---|-------------|--------|
| 1 | `ccn2_workspace/analysis/` folder | ⬜ |
| 2 | `ccn2_workspace/eval/CODE-EVAL-RUBRIC.md` | ⬜ |
| 3 | `openclaw/agents/agent_dev/AGENTS.md` upgraded | ⬜ |
| 4 | `openclaw/agents/agent_dev_client/AGENTS.md` + `SOUL.md` | ⬜ |
| 5 | `openclaw/agents/agent_dev_server/AGENTS.md` + `SOUL.md` | ⬜ |
| 6 | `openclaw/agents/agent_dev_admin/AGENTS.md` + `SOUL.md` | ⬜ |
| 7 | `ccn2_workspace/.state/agent_dev_processed.json` | ⬜ |
| 8 | `ccn2_workspace/.state/agent_dev_dispatched.json` | ⬜ |
| 9 | `~/.openclaw/openclaw.json` — thêm 3 agents mới | ⬜ |
| 10 | `ccn2_workspace/progress/PROGRESS.md` updated | ⬜ |
