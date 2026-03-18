# Design Spec: agent_qc Test Workflow — Round 2
**Date**: 2026-03-18
**Author**: William Đào 👌
**Status**: Approved (v2 — post spec-review fixes)
**Reference**:
- `plans/round2-agent-qc-workflow.md` — Full design (5 sections)
- `specs/2026-03-18-agent-dev-workflow-design.md` — Code Workflow (input source)
- `specs/2026-03-18-gdd-workflow-design.md` — GDD Workflow (Part C reference)

---

## Summary

Mở rộng agent_qc (Verita) từ 3 parts hiện tại (A/B/C) lên **5 parts** bằng cách thêm:
- **Part D**: Code Review độc lập — poll staged code từ agent_dev sub-agents, chấm điểm bằng CODE-EVAL-RUBRIC, flag khi diff ≥20pt vs self-eval
- **Part E**: Test Generation từ Analysis — đọc REQ + DESIGN docs, generate test scaffolding cho 3 layers (TypeScript/Kotlin/Java)

Trigger: poll-based (WORKSPACE_SCAN 15 phút). Architecture: Sequential Pipeline per feature.

---

## Section 1: Overall Architecture

### Parts Overview

| Part | Tên | Trigger | Status |
|------|-----|---------|--------|
| A | GDD → Test Cases | GDD hash changed | ✅ Đã có |
| B | Code Changes → Run Tests | src hash changed | ✅ Đã có |
| C | GDD Eval (independent) | GDD hash changed | ✅ Đã có |
| D | Code Review staged code | agent_dev_dispatched status=done\|done_warning + qc_reviewed=null | 🆕 Mới |
| E | Test Generation từ Analysis | analysis/REQ-* hoặc DESIGN-* hash changed | 🆕 Mới |

### Part D — Code Review Flow (tóm tắt)

```
Poll → feature done + chưa review
  → Phase 1: CODE-EVAL per layer (client → server → admin)
      → diff ≥20pt → flag + Telegram ngay
  → Phase 2: aggregate + Telegram batch
  → UPDATE dispatched.json + processed.json
```

### Part E — Test Generation Flow (tóm tắt)

```
Poll → REQ/DESIGN hash changed
  → READ REQ + DESIGN
  → GENERATE: .test.ts + .test.kt + Test.java
  → UPDATE processed.json
  → Telegram batch
```

### Eval Rubric (Part D)

Dùng `eval/CODE-EVAL-RUBRIC.md` (đã có từ Phase 2.2):

| Dimension | Weight |
|-----------|--------|
| GDD Alignment | 30pt |
| Pattern Compliance | 25pt |
| Type Safety | 20pt |
| Error Handling | 15pt |
| Testability | 10pt |
| **Pass** | **≥80** |

**Flag threshold**: diff ≥20pt (qc_score vs self_score) → flag human

---

## Section 2: File Architecture

```
ccn2_workspace/
├── src/
│   └── tests/
│       ├── *.test.js                           ← Part A output (hiện có)
│       ├── client/
│       │   └── <name>.test.ts                  ← Part E output 🆕
│       ├── server/
│       │   └── <name>.test.kt                  ← Part E output 🆕
│       └── admin/
│           └── <name>Test.java                 ← Part E output 🆕
│
├── eval/
│   ├── GDD-EVAL-RUBRIC.md                      ← (đã có)
│   ├── CODE-EVAL-RUBRIC.md                     ← (đã có, Phase 2.2)
│   ├── GDD-EVAL-<name>-<date>.md               ← Part C output (đã có)
│   └── CODE-EVAL-QC-<layer>-<name>-<date>.md   ← Part D output 🆕
│
└── .state/
    └── agent_qc_processed.json                 ← Mở rộng schema 🆕

openclaw/agents/agent_qc/
└── AGENTS.md                                   ← Upgrade: thêm Part D + E
```

**Naming conventions:**
- QC code eval: `CODE-EVAL-QC-<client|server|admin>-<name>-YYYY-MM-DD.md`
  *(phân biệt với sub-agent self-eval: `CODE-EVAL-<layer>-<name>-<date>.md`)*
- Test files: `<name>.test.ts` / `<name>.test.kt` / `<name>Test.java`

**agent_qc_processed.json — 2 schema groups mới:**
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
   → Start Code Review
```

### Phase 1 — Independent CODE-EVAL (per layer)

```
FOR EACH layer IN [client, server, admin]:
  1. CHECK src/<layer>/<feature>/ tồn tại
     → Không tồn tại → skip, ghi note "layer not dispatched"
  2. READ staged code files
  3. READ eval/CODE-EVAL-RUBRIC.md (mode tương ứng)
  4. READ self-eval: eval/CODE-EVAL-<layer>-<name>-<date>.md
     → Nếu có nhiều files (re-runs) → đọc file date mới nhất (alphanumeric sort descending)
     → Không tồn tại → ghi note "self-eval missing", vẫn chấm độc lập
  5. SCORE độc lập theo 5 dimensions (100pt)
  6. COMPARE: diff = |self_score - qc_score|
     diff ≥ 20pt → flag = true
     Telegram ngay: "[Verita] FLAG: <feature>/<layer>
                     self=XX vs QC=YY (diff=ZZ) — human review cần thiết"
  7. SAVE eval/CODE-EVAL-QC-<layer>-<name>-YYYY-MM-DD.md
```

### Phase 2 — Aggregate & Notify

```
1. CALCULATE overall verdict (chỉ tính layers đã được review — skip layers không tính):
   - ALL reviewed layers ≥80, no flag → "PASS"
   - ANY reviewed layer 60-79, no flag → "WARNING"
   - ANY reviewed layer <60             → "FAIL"
   - ANY flag = true                    → thêm "FLAG" (kết hợp được: "WARNING+FLAG", "FAIL+FLAG")

2. UPDATE agent_qc_processed.json:
   code_review[feature] = { reviewed_at, layers, overall }

3. UPDATE agent_dev_dispatched.json:
   feature.qc_reviewed = true
   feature.qc_overall = "<verdict>"

4. TELEGRAM batch (1 message per feature):
   "[Verita] Code Review: <feature>
     ✅ client QC=85 (self=82, diff=3)
     ⚠️ server QC=71 (self=88, diff=17) — WARNING
     🚩 admin QC=60 (self=83, diff=23) — FLAG"
   overall: <verdict>
```

### Constraints Part D

- READ-ONLY `src/<layer>/<feature>/` — KHÔNG modify staged code
- qc_score là **authoritative** (ghi vào dispatched.json)
- FLAG alert Telegram ngay khi diff ≥20pt — đây là **exception**, không tính vào 1-per-scan limit
- Aggregate summary (Phase 2): gom tất cả features hoàn thành trong scan → 1 Telegram duy nhất
- Staged code absent → SKIPPED (không block workflow)
- "ALL layers" trong verdict = tất cả layers được review; skipped layers không ảnh hưởng verdict

---

## Section 4: Part E — Test Generation Workflow

### Trigger & Poll Logic

```
Mỗi WORKSPACE_SCAN:
1. READ tất cả analysis/REQ-*.md + analysis/DESIGN-*.md
2. FOR EACH feature:
   - MD5(REQ-<name>.md) + MD5(DESIGN-<name>.md)
   - So sánh với test_gen[feature] trong processed.json
   - Hash changed hoặc entry null → trigger generation
```

### Generation Flow

```
1. READ analysis/REQ-<name>.md:
   - Actors, use cases, edge cases, pre/post conditions

2. READ analysis/DESIGN-<name>.md:
   - Sequence diagrams (happy + error path)
   - Class diagram (domain objects)
   - Layer breakdown: components, endpoints, events

3. GENERATE src/tests/client/<name>.test.ts (TypeScript/Jest):
   - describe("<Feature>Layer") per component
   - it() test cases từ use cases (happy path)
   - it() test cases từ edge cases (error path)
   - Mock: EventEmitter3, SceneManager, Cocos2d nodes
   - Format: describe/it/expect

4. GENERATE src/tests/server/<name>.test.kt (Kotlin/JUnit5):
   - @Test per use case
   - runTest { } cho coroutine tests
   - Mock: in-memory SQLite (Exposed), Actor scope stub
   - Cover: happy path + suspend error path + null-safety

5. GENERATE src/tests/admin/<name>Test.java (Java/JUnit5 + MockMvc):
   - @Test per REST endpoint
   - MockMvc: GET/POST/PUT/DELETE với expected status
   - Cover: 200/201 success, 400 validation error, 404 not found, 500 server error

6. UPDATE agent_qc_processed.json:
   test_gen[feature] = { req_hash, design_hash, generated_at, files: [...] }

7. TELEGRAM: "[Verita] Tests generated: <name>
     📝 src/tests/client/<name>.test.ts
     📝 src/tests/server/<name>.test.kt
     📝 src/tests/admin/<name>Test.java"
```

### Test Quality Rules

| Layer | Framework | Min tests | Bắt buộc cover |
|-------|-----------|-----------|----------------|
| Client | Jest/TypeScript | ≥5 | ≥1 error event, ≥1 edge case |
| Server | JUnit5/Kotlin | ≥5 | ≥1 suspend error, ≥1 null-safety |
| Admin | JUnit5/MockMvc | ≥5 | ≥1 validation 400, ≥1 not found 404 |

### Constraints Part E

- READ-ONLY `analysis/`, `design/`
- REQ absent → skip tất cả 3 layers. DESIGN absent → skip tất cả 3 layers.
  Chỉ generate khi **cả REQ lẫn DESIGN đều tồn tại** (test generation cần cả 2 docs)
- Test files là **scaffolding** — dev fill assertions sau khi merge
- Overwrite khi hash thay đổi (REQ/DESIGN updated)
- Tiếng Việt cho comments giải thích test intent

---

## Section 5: Constraints & State Machine

### Part D Lifecycle

```
[PENDING]
    ↓ overall_status=done|done_warning + qc_reviewed=null
[REVIEWING]
    ↓ All layers scored
[PASS]         ← all ≥80, no flag
[WARNING]      ← ≥1 layer 60-79
[FAIL]         ← ≥1 layer <60
[FLAG]         ← ≥1 diff ≥20pt (có thể kết hợp với WARNING/FAIL)
[SKIPPED]      ← staged code không tồn tại
```

### Part E Lifecycle

```
[PENDING]
    ↓ REQ/DESIGN hash changed
[GENERATING]
    ↓ 3 files written
[GENERATED]

Regenerate: hash thay đổi → [GENERATING] → overwrite
```

### Global Constraints

| Zone | Permission |
|------|-----------|
| `design/`, `analysis/` | READ-ONLY |
| `src/client/`, `src/server/`, `src/admin/` | READ-ONLY (staged code) |
| `src/tests/client|server|admin/` | WRITE (test files) |
| `eval/CODE-EVAL-QC-*.md` | WRITE (QC eval reports) |
| `.state/agent_qc_processed.json` | WRITE |
| `.state/agent_dev_dispatched.json` | UPDATE only (qc_reviewed, qc_overall) |
| `concepts/`, `openclaw/`, `serverccn2/`, `clientccn2/` | NEVER MODIFY |

**Telegram batching**:
- FLAG alerts (Part D diff ≥20pt): **immediate exception** — gửi ngay, không batch
- Aggregate summaries (Part D + E): gom tất cả features trong scan → **1 message duy nhất/scan**

**AGENTS.md upgrade**: full overwrite, giữ nguyên Part A + B + C + thêm D + E.

---

## Deliverables Checklist

| # | File | Status |
|---|------|--------|
| 1 | `ccn2_workspace/src/tests/client/` folder | ⬜ |
| 2 | `ccn2_workspace/src/tests/server/` folder | ⬜ |
| 3 | `ccn2_workspace/src/tests/admin/` folder | ⬜ |
| 4 | `openclaw/agents/agent_qc/AGENTS.md` upgraded (Part D + E) | ⬜ |
| 5 | `ccn2_workspace/.state/agent_qc_processed.json` schema updated | ⬜ |
| 6 | `ccn2_workspace/progress/PROGRESS.md` updated | ⬜ |
