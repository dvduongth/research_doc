# Round 2 — agent_qc Test Workflow: Implementation Plan
**Date**: 2026-03-18
**Spec**: `specs/2026-03-18-agent-qc-workflow-design.md` (v2 — APPROVED)
**Session**: William Đào 👌

---

## Deliverables (6 items)

| # | File/Folder | Chunk |
|---|-------------|-------|
| 1 | `ccn2_workspace/src/tests/client/` folder | A |
| 2 | `ccn2_workspace/src/tests/server/` folder | A |
| 3 | `ccn2_workspace/src/tests/admin/` folder | A |
| 4 | `openclaw/agents/agent_qc/AGENTS.md` upgraded (Part D + E) | B |
| 5 | `ccn2_workspace/.state/agent_qc_processed.json` schema updated | A |
| 6 | `ccn2_workspace/progress/PROGRESS.md` updated | C |

---

## Chunk A — Infrastructure (test folders + state schema)

### Task A1: Tạo 3 test layer folders

- [ ] **A1.1** Tạo `ccn2_workspace/src/tests/client/.gitkeep`
- [ ] **A1.2** Tạo `ccn2_workspace/src/tests/server/.gitkeep`
- [ ] **A1.3** Tạo `ccn2_workspace/src/tests/admin/.gitkeep`

### Task A2: Update agent_qc_processed.json schema

Đọc file hiện tại, thêm 2 groups mới vào (KHÔNG overwrite existing data):

```json
{
  // ... existing flat fields giữ nguyên ...
  "code_review": {},
  "test_gen": {}
}
```

Schema reference per entry:
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

## Chunk B — agent_qc AGENTS.md Upgrade (Part D + E)

### Task B1: Upgrade agent_qc AGENTS.md

**File**: `openclaw/agents/agent_qc/AGENTS.md` — full overwrite, giữ Part A + B + C + thêm D + E

- [ ] **B1.1** Đọc AGENTS.md hiện tại (giữ Part A + B + C nguyên vẹn)
- [ ] **B1.2** Thêm **Part D — Code Review** sau Part C:

```
## Part D — Code Review Staged Code

### Trigger
Mỗi WORKSPACE_SCAN: READ .state/agent_dev_dispatched.json
FOR EACH feature WHERE:
  - overall_status = "done" OR "done_warning"
  - agent_qc_processed.json["code_review"][feature] = null hoặc "pending"

### Phase 1 — Independent CODE-EVAL per layer
FOR EACH layer IN [client, server, admin]:
  1. CHECK src/<layer>/<feature>/ tồn tại → không có → skip layer
  2. READ staged code files
  3. READ eval/CODE-EVAL-RUBRIC.md (mode: Client | Server | Admin)
  4. READ self-eval: eval/CODE-EVAL-<layer>-<name>-<date>.md
     → Nhiều files → đọc date mới nhất (alphanumeric sort descending)
     → Không tồn tại → ghi "self-eval missing", vẫn chấm độc lập
  5. SCORE theo 5 dimensions (30+25+20+15+10 = 100pt)
  6. COMPARE: diff = |self_score - qc_score|
     diff ≥ 20pt → flag = true
     FLAG TELEGRAM NGAY (exception, không tính 1-per-scan limit):
     "[Verita] FLAG: <feature>/<layer> self=XX vs QC=YY (diff=ZZ) — human review"
  7. SAVE eval/CODE-EVAL-QC-<layer>-<name>-YYYY-MM-DD.md

### Phase 2 — Aggregate
Verdict (chỉ tính reviewed layers, skip layers không tính):
  - ALL reviewed ≥80, no flag → "PASS"
  - ANY reviewed 60-79, no flag → "WARNING"
  - ANY reviewed <60 → "FAIL"
  - ANY flag=true → thêm "FLAG"

UPDATE agent_qc_processed.json: code_review[feature] = { reviewed_at, layers, overall }
UPDATE agent_dev_dispatched.json: feature.qc_reviewed=true, feature.qc_overall

BATCH aggregate vào 1 Telegram cuối scan.

### Constraints
- READ-ONLY src/<layer>/<feature>/ — không modify staged code
- qc_score là authoritative
- FLAG alert: immediate exception (không batch)
- Aggregate summary: 1 message/scan gom tất cả features
```

- [ ] **B1.3** Thêm **Part E — Test Generation** sau Part D:

```
## Part E — Test Generation từ Analysis Docs

### Trigger
Mỗi WORKSPACE_SCAN: READ analysis/REQ-*.md + analysis/DESIGN-*.md
FOR EACH feature:
  - Tính MD5(REQ-<name>.md) + MD5(DESIGN-<name>.md)
  - So sánh với test_gen[feature] trong processed.json
  - Hash changed hoặc null → trigger generation
  - REQ hoặc DESIGN absent → skip TẤT CẢ 3 layers

### Generation Flow
1. READ analysis/REQ-<name>.md (actors, use cases, edge cases)
2. READ analysis/DESIGN-<name>.md (sequence/class/layer breakdown)

3. GENERATE src/tests/client/<name>.test.ts (TypeScript/Jest):
   - describe("<Feature>Layer") per component
   - it() cho happy path use cases + edge cases
   - Mock: EventEmitter3, SceneManager, Cocos2d nodes
   - Min: ≥5 tests, ≥1 error event, ≥1 edge case

4. GENERATE src/tests/server/<name>.test.kt (Kotlin/JUnit5):
   - @Test per use case, runTest { } cho coroutine
   - Mock: in-memory SQLite, Actor scope stub
   - Min: ≥5 tests, ≥1 suspend error, ≥1 null-safety

5. GENERATE src/tests/admin/<name>Test.java (Java/JUnit5+MockMvc):
   - @Test per REST endpoint
   - Cover: 200/201/400/404/500
   - Min: ≥5 tests, ≥1 validation 400, ≥1 not found 404

6. UPDATE processed.json: test_gen[feature] = { req_hash, design_hash, generated_at, files }
7. BATCH vào aggregate Telegram cuối scan.

### Constraints
- READ-ONLY analysis/, design/
- Cả REQ + DESIGN phải tồn tại → chỉ generate khi có cả 2
- Test files là scaffolding — dev fill assertions sau khi merge
- Overwrite khi hash thay đổi
- Vietnamese comments cho test intent
```

- [ ] **B1.4** Verify AGENTS.md có đủ 5 parts (A, B, C, D, E)

---

## Chunk C — Progress Update

### Task C1: Update PROGRESS.md + round2-progress.md

- [ ] **C1.1** Update `ccn2_workspace/progress/PROGRESS.md`:
  - Phase 2.3 → ✅ DONE
  - Liệt kê 6 deliverables

- [ ] **C1.2** Update `plans/round2-progress.md`:
  - Thêm Phase 2.3 section với 6 deliverables + status

---

## Thứ tự thực hiện

```
Chunk A + B parallel → Chunk C sau khi A+B xong
- Agent 1 → Chunk A (folders + state schema)
- Agent 2 → Chunk B (AGENTS.md upgrade)
→ Sau: Chunk C (progress update)
```
