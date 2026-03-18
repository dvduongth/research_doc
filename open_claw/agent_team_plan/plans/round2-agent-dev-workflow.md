# Round 2 — agent_dev Code Workflow Plan
**Date**: 2026-03-18
**Approach**: Orchestrator + 3 Sub-agents (Parallel Fan-out)
**Reference**: `demo-main/` (TypeScript/Vite stack), GDD v2.0
**Status**: Approved (5/5 sections)

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
  → READ GDD-FEATURE-<name>.md
  → EXTRACT actors, use cases, business rules, constraints
  → GENERATE analysis/REQ-<name>.md (Vietnamese)
  → EVAL theo Requirements Rubric (pass ≥70, max 2 retries)

Phase 2: System Design
  → READ REQ-<name>.md + GDD
  → GENERATE analysis/DESIGN-<name>.md:
      - Mermaid UseCase diagram
      - Mermaid Sequence diagram (≥1 happy path + ≥1 error path)
      - Mermaid Class diagram (domain objects)
      - Mermaid State diagram (nếu có state machine)
  → EVAL theo Design Rubric (pass ≥70, max 2 retries)

Phase 3: Combined Eval
  → SAVE eval/EVAL-<name>-<date>.md
  → Combined score <70 → flag human, KHÔNG dispatch

Phase 4: Dispatch
  → READ GDD Section 8 (Dependencies)
  → BUILD dispatch messages cho từng sub-agent
  → BROADCAST simultaneously → agent_dev_client + agent_dev_server + agent_dev_admin
  → UPDATE agent_dev_dispatched.json
```

### Eval Rubrics

**Requirements Rubric (100pt — pass ≥70):**

| Dimension | Weight | Pass Criteria |
|-----------|--------|---------------|
| GDD Coverage | 35pt | ≥90% GDD sections được map vào requirements |
| Edge Case Capture | 25pt | ≥3 edge cases từ GDD Section 4 |
| Actor Completeness | 20pt | Tất cả actors (player, server, admin) được identify |
| Use Case Clarity | 20pt | Mỗi use case có: Actor, Pre/Post condition, Flow |

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
├── analysis/
│   ├── REQ-<feature>.md          ← Phase 1 output (Requirements)
│   ├── DESIGN-<feature>.md       ← Phase 2 output (System Design + Mermaid)
│   └── EVAL-<feature>-<date>.md  ← Phase 3 output (Combined eval)
│
├── src/
│   ├── client/                   ← TypeScript (demo-main patterns)
│   │   └── <feature>/
│   │       ├── <Feature>Layer.ts
│   │       ├── <Feature>Modal.ts (nếu có popup)
│   │       └── types.ts
│   ├── server/                   ← Kotlin/Ktor
│   │   └── <feature>/
│   │       ├── <Feature>Module.kt
│   │       ├── <Feature>RequestHandler.kt
│   │       └── <Feature>EventListener.kt
│   └── admin/                    ← Java + React
│       └── <feature>/
│           ├── <Feature>Bean.java
│           ├── <Feature>Controller.java
│           └── <Feature>Panel.tsx
│
├── eval/
│   ├── CODE-EVAL-RUBRIC.md       ← 3 modes: Client / Server / Admin
│   └── CODE-EVAL-<layer>-<name>-<date>.md
│
└── .state/
    ├── agent_dev_processed.json  ← REQ/DESIGN eval results per feature
    └── agent_dev_dispatched.json ← Dispatch state per sub-agent per feature

openclaw/agents/
├── agent_dev/AGENTS.md           ← Upgraded (Phase 1-4 + eval workflow)
├── agent_dev_client/             ← New agent (Pixel)
│   ├── AGENTS.md
│   └── SOUL.md
├── agent_dev_server/             ← New agent (Forge)
│   ├── AGENTS.md
│   └── SOUL.md
└── agent_dev_admin/              ← New agent (Panel)
    ├── AGENTS.md
    └── SOUL.md
```

**Naming conventions:**
- Requirements: `REQ-<kebab-case>.md`
- Design: `DESIGN-<kebab-case>.md`
- Eval: `EVAL-<kebab-case>-YYYY-MM-DD.md`
- Code eval: `CODE-EVAL-<client|server|admin>-<name>-YYYY-MM-DD.md`

---

## Section 3: agent_dev Orchestrator Workflow

### Trigger Map

| Trigger | Action |
|---------|--------|
| `WORKSPACE_SCAN` (cron 15 phút) | Scan design/ → detect GDD-FEATURE-*.md với Status: Review |
| GDD hash changed | Re-run Phase 1+2+3 (nếu đã dispatch trước) |
| `game-overview.md` in concepts/ | Không dispatch code — chỉ theo dõi Game GDD synthesis |
| Telegram từ Daniel | Respond + WORKSPACE_SCAN ngay |
| Sub-agent flag done | Check all sub-agents → nếu all done → notify tổng kết |

### Phase 1 — Requirements Analysis

```
1. READ GDD-FEATURE-<name>.md (Status: Review|Approved)
2. EXTRACT:
   - Actors: Player, Server, AdminUser (nếu liên quan)
   - Use Cases: từng action player/server có thể thực hiện
   - Business Rules: từ Section 2 (Core Mechanics) + Section 3 (Win/Lose)
   - Edge Cases: từ Section 4 (min 3)
   - Constraints: từ Section 6 (Balance & Config)
3. GENERATE analysis/REQ-<name>.md:
   - Mermaid UseCase diagram
   - Table: Actor | Use Case | Pre-condition | Post-condition | Main Flow
   - Edge Case list (If X then Y format)
   - Non-functional requirements (performance, security)
4. SELF-EVAL theo Requirements Rubric
   - <70 → revise + re-eval (max 2 lần)
   - Lần 3 fail → BLOCKED_REQ, Telegram flag human
   - ≥70 → proceed Phase 2
5. UPDATE agent_dev_processed.json: { req_score, req_status }
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
      - Client: components cần tạo/sửa, events, state
      - Server: modules/abilities/config cần tạo/sửa
      - Admin: data models, endpoints, UI panels
3. SELF-EVAL theo Design Rubric
   - <70 → revise + re-eval (max 2 lần)
   - Lần 3 fail → BLOCKED_DESIGN, Telegram flag human
   - ≥70 → proceed Phase 3
4. UPDATE agent_dev_processed.json: { design_score, design_status }
```

### Phase 3 — Combined Eval

```
1. CALCULATE combined score:
   combined = (req_score * 0.4) + (design_score * 0.6)
2. SAVE eval/EVAL-<name>-<date>.md:
   - REQ score + Design score + Combined score
   - Issues found per phase
   - Recommendation: DISPATCH | BLOCK
3. combined <70 → KHÔNG dispatch, Telegram flag human
4. combined ≥70 → proceed Phase 4
```

### Phase 4 — Dispatch

```
1. READ GDD Section 8 (Dependencies):
   - Server changes needed: yes/no
   - Client changes needed: yes/no
   - Config keys needed: list
2. BUILD dispatch messages:
   {
     feature, gdd_path, req_path, design_path,
     layer: "client"|"server"|"admin",
     output_path: "src/client/"|"src/server/"|"src/admin/",
     priority_files: [...],  // từ Section 8
     constraints: [...]      // layer-specific rules
   }
3. BROADCAST simultaneously:
   - agent_dev_client (nếu client changes needed)
   - agent_dev_server (nếu server changes needed)
   - agent_dev_admin (nếu admin data model needed)
4. UPDATE agent_dev_dispatched.json:
   { feature: { dispatched_at, sub_agents: { client/server/admin: { status: "pending" } } } }
5. NOTIFY: "[agent_dev] Dispatched: <name> → client+server+admin"
```

### Constraints

- KHÔNG dispatch nếu DESIGN eval score < 70
- Max 2 re-eval iterations per phase → lần 3 fail = BLOCKED
- Max 1 Telegram batch/WORKSPACE_SCAN
- NEVER modify `concepts/`, `src/` trong serverccn2/ hoặc clientccn2/
- Vietnamese cho tất cả analysis docs

---

## Section 4: Sub-agent Workflows

### agent_dev_client (Pixel) — TypeScript/demo-main

**Input nhận từ agent_dev:**
```json
{
  "feature": "ladder-mechanic",
  "gdd_path": "design/GDD-FEATURE-mechanic.md",
  "req_path": "analysis/REQ-mechanic.md",
  "design_path": "analysis/DESIGN-mechanic.md",
  "layer": "client",
  "output_path": "src/client/"
}
```

**Flow:**
```
1. READ GDD + REQ + DESIGN (read-only, không modify)
2. IDENTIFY files cần tạo/sửa:
   - New feature → tạo src/client/<feature>/
   - UI component → extends BaseLayer hoặc BaseModal
   - Game logic → integrate vào SceneManager / EventEmitter3
3. GENERATE TypeScript files theo demo-main patterns:
   - Strict typing (interfaces cho state/event)
   - Vite 7 + SystemJS output
   - EventEmitter3 cho communication (KHÔNG global state)
   - Tách BaseLayer (game) / BaseModal (popup)
4. SELF-EVAL theo CODE-EVAL-RUBRIC.md (Client mode)
   - <60 → không save, Telegram FAIL
   - 60-79 → save, Telegram WARNING
   - ≥80 → save, Telegram ready
5. WRITE files vào src/client/ (staging area)
6. UPDATE agent_dev_dispatched.json: status → done | failed
7. NOTIFY agent_dev qua .state/ flag (agent_dev sẽ poll)
```

**Demo-main patterns bắt buộc:**
- Collision system: `CollisionGroup` enum + `checkCollision()`
- Drag-drop: extend `DraggableLayer`
- Scene transition: `SceneManager.getInstance().loadScene()`
- Events: `this.events.emit(EventKeys.X, payload)` — không dùng window events

---

### agent_dev_server (Forge) — Kotlin/Ktor

**Flow:**
```
1. READ GDD + REQ + DESIGN (read-only)
2. IDENTIFY server components:
   - New module → Module.kt + RequestHandler + EventListener
   - New ability → abilities/execute/<Type>Executor.kt
   - New config → config/<domain>/<Name>Cfg.kt + res/*.json
   - DB change → sql/ table + SqlVersioning update
3. GENERATE Kotlin files theo server patterns:
   - Actor model cho game room logic
   - Exposed ORM (không raw SQL)
   - KSP serialization cho packets mới
   - Không sửa trực tiếp src/ trong serverccn2/ — output vào staging
4. SELF-EVAL theo CODE-EVAL-RUBRIC.md (Server mode)
   - <60 → không save, Telegram FAIL
   - 60-79 → save, Telegram WARNING
   - ≥80 → save, Telegram ready
5. WRITE files vào src/server/ (staging)
6. UPDATE agent_dev_dispatched.json + notify agent_dev
```

**Constraints bắt buộc:**
- KHÔNG modify `concepts/`, `res/`, `reports/` trong workspace
- Config thay đổi → ghi cả res/*.json lẫn Kotlin loader
- Actor model: suspend function + coroutine scope, không blocking call

---

### agent_dev_admin (Panel) — Java + React

**Flow:**
```
1. READ GDD + REQ + DESIGN (read-only)
2. IDENTIFY admin components:
   - Data model mới → Java bean + REST endpoint
   - UI view → React component (functional, hooks)
   - Config management → CRUD panel cho res/*.json
3. GENERATE files theo admintool patterns:
   - Java: bean + service + controller (REST)
   - React: TypeScript functional components + Tailwind
   - Kết nối với server DB qua REST API (không direct DB)
4. SELF-EVAL theo CODE-EVAL-RUBRIC.md (Admin mode)
5. WRITE files vào src/admin/ (staging)
6. UPDATE agent_dev_dispatched.json + notify agent_dev
```

---

### CODE-EVAL-RUBRIC.md — 3 modes

| Dimension | Client | Server | Admin | Weight |
|-----------|--------|--------|-------|--------|
| GDD Alignment | ✅ | ✅ | ✅ | 30pt |
| Pattern Compliance | demo-main | Actor/Exposed | REST/React | 25pt |
| Type Safety | TS strict | Kotlin null-safe | Java+TS | 20pt |
| Error Handling | try/catch + EventEmitter | suspend + Result | HTTP status | 15pt |
| Testability | Jest-able | Unit-testable | Mockable | 10pt |
| **Pass threshold** | **≥80** | **≥80** | **≥80** | — |

---

## Section 5: Constraints & State Machine

### Constraints Tổng thể

**agent_dev (Orchestrator):**
- Chỉ được READ `design/`, `eval/`, `.state/` — KHÔNG write vào `src/`
- Max 2 re-eval iterations per artifact (REQ hoặc DESIGN) → lần 3 fail thì flag human
- Max 1 Telegram batch/WORKSPACE_SCAN (gom tất cả notifications thành 1 message)
- KHÔNG dispatch nếu DESIGN eval score < 70 — block tại gate
- Mermaid diagrams bắt buộc có đủ: UseCase + Sequence + ít nhất 1 trong (Class / State)

**agent_dev_client / agent_dev_server / agent_dev_admin:**
- Output LUÔN vào staging area (`src/client/`, `src/server/`, `src/admin/`) — KHÔNG write thẳng vào `clientccn2/` hay `serverccn2/`
- KHÔNG modify `concepts/`, `design/` (GDD read-only)
- Self-eval bắt buộc trước khi save — score < 60 → không save file
- Chỉ được đọc dispatch message từ `agent_dev_dispatched.json` (không poll Telegram trực tiếp)

---

### State Machine — Feature Lifecycle

```
[PENDING]
    ↓ agent_dev WORKSPACE_SCAN detect GDD mới
[ANALYZING]
    ↓ Phase 1 pass (REQ eval ≥70)
[DESIGNING]
    ↓ Phase 2 pass (DESIGN eval ≥70)
[DISPATCHED]
    ↓ Sub-agents nhận message
[IN_PROGRESS]  ← per sub-agent: client / server / admin
    ↓ All sub-agents done (score ≥80)
[DONE]

Nhánh lỗi:
[ANALYZING] → 2 lần fail → [BLOCKED_REQ] → Telegram flag human
[DESIGNING] → 2 lần fail → [BLOCKED_DESIGN] → Telegram flag human
[IN_PROGRESS] → sub-agent score <60 → [FAILED_<layer>] → Telegram WARNING + notify agent_dev
```

**agent_dev_dispatched.json schema:**
```json
{
  "ladder-mechanic": {
    "dispatched_at": "2026-03-18T10:00:00Z",
    "gdd_path": "design/GDD-FEATURE-mechanic.md",
    "sub_agents": {
      "client": { "status": "done", "score": 85, "output": "src/client/ladder/" },
      "server": { "status": "in_progress", "score": null, "output": null },
      "admin":  { "status": "pending", "score": null, "output": null }
    },
    "overall_status": "in_progress"
  }
}
```

---

### Telegram Notification Format

```
[agent_dev] Feature dispatched: ladder-mechanic
  → client (Pixel): pending
  → server (Forge): pending
  → admin (Panel): pending

[agent_dev] Feature update: ladder-mechanic
  ✅ client score=85 → src/client/ladder/ ready
  🔄 server: in_progress
  ⬜ admin: pending

[agent_dev] BLOCKED: ladder-mechanic REQ eval failed 2x
  → score=58/100, issues: GDD Coverage thiếu Section 3
  → Cần human review: analysis/REQ-ladder-mechanic.md
```

---

## Deliverables Checklist

| # | File | Status |
|---|------|--------|
| 1 | `analysis/` folder | ⬜ |
| 2 | `eval/CODE-EVAL-RUBRIC.md` | ⬜ |
| 3 | `openclaw/agents/agent_dev/AGENTS.md` upgraded | ⬜ |
| 4 | `openclaw/agents/agent_dev_client/AGENTS.md` + SOUL.md | ⬜ |
| 5 | `openclaw/agents/agent_dev_server/AGENTS.md` + SOUL.md | ⬜ |
| 6 | `openclaw/agents/agent_dev_admin/AGENTS.md` + SOUL.md | ⬜ |
| 7 | `.state/agent_dev_processed.json` | ⬜ |
| 8 | `.state/agent_dev_dispatched.json` | ⬜ |
| 9 | `openclaw.json` — thêm 3 agents mới | ⬜ |
| 10 | `progress/PROGRESS.md` updated | ⬜ |
