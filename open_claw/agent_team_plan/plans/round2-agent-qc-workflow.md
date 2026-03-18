# Round 2 — agent_qc Test Workflow Plan
**Date**: 2026-03-18
**Approach**: Sequential Pipeline (2 phases per feature)
**Status**: Approved (5/5 sections)

---

## Decisions Made

| Question | Choice | Lý do |
|----------|--------|-------|
| Scope | C) Code Review + Test Generation | Khép kín pipeline: design→code→test→eval |
| Trigger | A) Poll-based | Loose coupling, consistent với Part A/B/C |
| Test output | C) Generate test files 3 layers | Dev nhận code + test cùng lúc |
| Flag threshold | B) ≥20pt | Nhất quán với GDD Workflow (Part C) |
| Architecture | A) Sequential Pipeline | Simple, consistent, dễ debug |

---

## Section 1: Overall Architecture

### Parts Overview

| Part | Tên | Trigger | Status |
|------|-----|---------|--------|
| A | GDD → Test Cases | GDD hash changed | ✅ Đã có |
| B | Code Changes → Run Tests | src hash changed | ✅ Đã có |
| C | GDD Eval (independent) | GDD hash changed | ✅ Đã có (Round 2.1) |
| D | Code Review staged code | agent_dev_dispatched.json status=done\|done_warning | 🆕 Mới |
| E | Test Generation từ Analysis | analysis/REQ-* hoặc analysis/DESIGN-* hash changed | 🆕 Mới |

### Part D — Code Review Flow

```
Poll .state/agent_dev_dispatched.json
  → Feature overall_status = done|done_warning AND qc_reviewed = null?
      → Phase 1: CODE-EVAL độc lập từng layer (client → server → admin)
          → Compare với sub-agent self-score
          → Chênh ≥20pt → flag human
      → Phase 2: Ghi eval/CODE-EVAL-QC-<layer>-<name>-<date>.md
      → Aggregate report → Telegram notify
      → UPDATE dispatched.json: qc_reviewed = true
```

### Part E — Test Generation Flow

```
Poll analysis/ folder
  → REQ-<name>.md hoặc DESIGN-<name>.md hash changed?
      → READ REQ + DESIGN
      → GENERATE test files:
          src/tests/client/<name>.test.ts   (TypeScript/Jest)
          src/tests/server/<name>.test.kt   (Kotlin/JUnit5)
          src/tests/admin/<name>Test.java   (Java/MockMvc)
      → UPDATE agent_qc_processed.json
      → Telegram: "[Verita] Tests generated: <name> (3 layers)"
```

---

## Section 2: File Architecture

```
ccn2_workspace/
├── src/
│   └── tests/
│       ├── *.test.js                          ← Part A output (hiện có)
│       ├── client/
│       │   └── <name>.test.ts                 ← Part E output 🆕
│       ├── server/
│       │   └── <name>.test.kt                 ← Part E output 🆕
│       └── admin/
│           └── <name>Test.java                ← Part E output 🆕
│
├── eval/
│   ├── GDD-EVAL-RUBRIC.md                     ← (đã có)
│   ├── CODE-EVAL-RUBRIC.md                    ← (đã có từ Phase 2.2)
│   ├── GDD-EVAL-<name>-<date>.md              ← Part C output (đã có)
│   └── CODE-EVAL-QC-<layer>-<name>-<date>.md  ← Part D output 🆕
│
└── .state/
    └── agent_qc_processed.json                ← Mở rộng schema 🆕

openclaw/agents/agent_qc/
└── AGENTS.md                                  ← Upgrade: thêm Part D + E
```

**Naming conventions:**
- QC code eval: `CODE-EVAL-QC-<client|server|admin>-<name>-YYYY-MM-DD.md`
- Test files: `<name>.test.ts` / `<name>.test.kt` / `<name>Test.java`

**agent_qc_processed.json schema mới (2 groups thêm vào):**
```json
{
  "code_review": {
    "<feature>": {
      "reviewed_at": null,
      "layers": {
        "client": { "qc_score": null, "self_score": null, "flag": false, "eval_file": null },
        "server": { "qc_score": null, "self_score": null, "flag": false, "eval_file": null },
        "admin":  { "qc_score": null, "self_score": null, "flag": false, "eval_file": null }
      },
      "overall": "pending"
    }
  },
  "test_gen": {
    "<feature>": {
      "req_hash": null,
      "design_hash": null,
      "generated_at": null,
      "files": []
    }
  }
}
```

---

## Section 3: Part D — Code Review Workflow

### Trigger & Poll Logic

```
Mỗi WORKSPACE_SCAN:
1. READ .state/agent_dev_dispatched.json
2. FOR EACH feature WHERE:
   - overall_status = "done" OR "done_warning"
   - agent_qc_processed.json["code_review"][feature] = null hoặc "pending"
   → Bắt đầu Code Review flow
```

### Phase 1 — Independent CODE-EVAL (per layer)

```
FOR EACH layer IN [client, server, admin]:
  1. CHECK src/<layer>/<feature>/ tồn tại
     → Không tồn tại → skip layer
  2. READ staged code files
  3. READ eval/CODE-EVAL-RUBRIC.md (mode tương ứng)
  4. READ self-eval: eval/CODE-EVAL-<layer>-<name>-<date>.md
     → Không tồn tại → ghi note "self-eval missing", vẫn chấm độc lập
  5. SCORE độc lập (5 dimensions: 30+25+20+15+10 = 100pt)
  6. COMPARE: diff = |self_score - qc_score|
     diff ≥ 20pt → flag = true
     Telegram ngay: "[Verita] FLAG: <feature>/<layer> self=XX vs QC=YY (diff=ZZ)"
  7. SAVE eval/CODE-EVAL-QC-<layer>-<name>-<date>.md
```

### Phase 2 — Aggregate & Notify

```
1. CALCULATE overall:
   - ALL layers ≥80 → "PASS"
   - ANY layer 60-79 → "WARNING"
   - ANY layer <60  → "FAIL"
   - ANY flag=true  → thêm "FLAG"

2. UPDATE agent_qc_processed.json: code_review[feature]
3. UPDATE agent_dev_dispatched.json: qc_reviewed=true, qc_overall

4. TELEGRAM (1 message per feature):
   "[Verita] Code Review: <feature>
     ✅ client QC=85 (self=82, diff=3)
     ⚠️ server QC=71 (self=88, diff=17) — WARNING
     🚩 admin QC=60 (self=83, diff=23) — FLAG human"
```

### Constraints Part D

- Chỉ READ `src/<layer>/<feature>/` — KHÔNG modify staged code
- qc_score là **authoritative**
- Max 1 Telegram per feature per review cycle
- Flag ngay khi diff ≥20pt (không đợi aggregate)

---

## Section 4: Part E — Test Generation Workflow

### Trigger & Poll Logic

```
Mỗi WORKSPACE_SCAN:
1. READ tất cả analysis/REQ-*.md + analysis/DESIGN-*.md
2. FOR EACH feature:
   - Tính MD5 của REQ + DESIGN
   - So sánh với test_gen[feature] trong processed.json
   - Hash changed hoặc null → trigger generation
```

### Generation Flow

```
1. READ analysis/REQ-<name>.md:
   - Extract: actors, use cases, edge cases, pre/post conditions

2. READ analysis/DESIGN-<name>.md:
   - Extract: Sequence diagrams (happy + error path)
   - Extract: Class diagram (domain objects)
   - Extract: Layer breakdown (interfaces, endpoints, events)

3. GENERATE src/tests/client/<name>.test.ts (TypeScript/Jest):
   - describe("<Feature>Layer") per component
   - test cases từ use cases (happy path)
   - test cases từ edge cases
   - Mock: EventEmitter3, SceneManager, Cocos2d nodes

4. GENERATE src/tests/server/<name>.test.kt (Kotlin/JUnit5):
   - @Test functions per use case
   - runTest { } cho coroutine
   - Mock: in-memory SQLite, Actor scope

5. GENERATE src/tests/admin/<name>Test.java (Java/JUnit5+MockMvc):
   - @Test per REST endpoint
   - MockMvc: GET/POST/PUT/DELETE
   - Cover: 200/201/400/404/500

6. UPDATE agent_qc_processed.json: test_gen[feature]
7. TELEGRAM: "[Verita] Tests generated: <name> (client + server + admin)"
```

### Test Quality Rules

| Layer | Framework | Min tests | Bắt buộc cover |
|-------|-----------|-----------|----------------|
| Client | Jest/TypeScript | ≥5 | ≥1 error event, ≥1 edge case |
| Server | JUnit5/Kotlin | ≥5 | ≥1 suspend error, ≥1 null-safety |
| Admin | JUnit5/MockMvc | ≥5 | ≥1 validation error (400), ≥1 not found (404) |

### Constraints Part E

- KHÔNG modify `analysis/`, `design/` — read-only
- REQ hoặc DESIGN chưa tồn tại → skip layer tương ứng
- Test files là scaffolding — dev fill assertions sau khi merge
- Overwrite nếu hash thay đổi

---

## Section 5: Constraints & State Machine

### Feature Review Lifecycle (Part D)

```
[PENDING]
    ↓ overall_status = done|done_warning
[REVIEWING]
    ↓ All layers scored
[PASS]        ← all layers QC ≥80, no flag
[WARNING]     ← ≥1 layer 60-79, no flag
[FAIL]        ← ≥1 layer <60
[FLAG]        ← ≥1 layer diff ≥20pt

Nhánh đặc biệt:
[REVIEWING] → staged code không tồn tại → [SKIPPED] → log + notify
```

### Test Generation Lifecycle (Part E)

```
[PENDING]
    ↓ REQ hoặc DESIGN hash changed
[GENERATING]
    ↓ 3 files written
[GENERATED]

Regenerate: hash changes → overwrite
```

### Global Constraints

- **Read-only**: `design/`, `analysis/`, `src/client/`, `src/server/`, `src/admin/`
- **Write**: `src/tests/client|server|admin/`, `eval/CODE-EVAL-QC-*.md`, `.state/agent_qc_processed.json`
- **UPDATE only**: `.state/agent_dev_dispatched.json` (chỉ ghi qc_reviewed + qc_overall)
- Max 1 Telegram batch per WORKSPACE_SCAN (gom tất cả Part D + E notifications)
- NEVER modify `concepts/`, `openclaw/`, `serverccn2/`, `clientccn2/`
- AGENTS.md = full overwrite, giữ Part A + B + C + thêm D + E

---

## Deliverables Checklist

| # | File | Status |
|---|------|--------|
| 1 | `src/tests/client/` folder | ⬜ |
| 2 | `src/tests/server/` folder | ⬜ |
| 3 | `src/tests/admin/` folder | ⬜ |
| 4 | `openclaw/agents/agent_qc/AGENTS.md` upgraded (Part D + E) | ⬜ |
| 5 | `.state/agent_qc_processed.json` schema updated | ⬜ |
| 6 | `progress/PROGRESS.md` updated | ⬜ |
