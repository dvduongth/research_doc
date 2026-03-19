# Spec 006 — Round 3 Smoke Test Script

> **Feature**: `round3-smoke-test`
> **Status**: APPROVED — Clarification resolved (C1=A)
> **Created**: 2026-03-19
> **Author**: William Đào 👌
> **Depends on**: Spec 3.1 ✅, Spec 3.2 ✅

---

## 1. Overview

### Problem Statement
Không có cách tự động phát hiện khi pipeline bị broken (agent không chạy, output không sinh ra, state file corrupt). Anh chỉ biết khi check thủ công hoặc khi nhận được fail notification đã muộn.

### Goal
agent_qc tự động chạy **smoke test** ở cuối mỗi WORKSPACE_SCAN — kiểm tra sức khỏe toàn bộ pipeline, lưu kết quả vào `reports/smoke-test-<datetime>.md`, persist trạng thái vào `.state/pipeline-health.json`. Alert Telegram ngay nếu pipeline DEGRADED hoặc BROKEN.

### Out of Scope
- Deep content validation (kiểm tra nội dung GDD đúng hay không)
- Cross-agent live monitoring
- Auto-recovery (chỉ alert, không tự fix)

---

## 2. Users / Agents

| Actor | Role |
|-------|------|
| agent_qc (Verita) | Chạy smoke test, ghi report, alert Telegram |
| Daniel (human) | Nhận alert, xử lý khi DEGRADED/BROKEN |

---

## 3. Functional Requirements

### FR1 — 6 Health Checks

agent_qc chạy **6 checks** theo thứ tự:

| # | Check | Expected | Cách kiểm tra |
|---|-------|----------|--------------|
| C1 | `concepts/` có ≥ 1 .md file (không tính README.md) | ≥ 1 | List files, đếm .md non-README |
| C2 | `design/` có ≥ 1 `GDD-FEATURE-*.md` | ≥ 1 | List GDD-FEATURE-*.md |
| C3 | Tất cả GDD-FEATURE-*.md có `**Trạng thái**:` header | 100% | Grep header trong mỗi file |
| C4 | `src/` có ≥ 1 subfolder có file (không tính tests/) | ≥ 1 | List src/ subfolders non-empty |
| C5 | `reports/quality-*.md` có ít nhất 1 file trong 24h qua | ≥ 1 | Check file mtime ≤ 24h |
| C6 | `.state/*.json` (4 files cốt lõi) đều tồn tại và valid JSON | 4/4 | Parse JSON, catch error |

**4 state files cốt lõi cần check (C6):**
- `agent_gd_processed.json`
- `agent_dev_processed.json`
- `agent_dev_dispatched.json`
- `agent_qc_processed.json`

### FR2 — Verdict Logic

```
passed = số checks pass
failed = số checks fail  (= 6 - passed)

IF failed = 0           → HEALTHY
IF failed = 1           → DEGRADED (minor)
IF failed ≥ 2           → DEGRADED
IF failed ≥ 4 OR C6 fail → BROKEN
```

**Alert rule:**
- `HEALTHY` → không gửi Telegram (silent)
- `DEGRADED` → gửi Telegram: `⚠️ [Verita] PIPELINE DEGRADED — N/6 checks failed`
- `BROKEN`   → gửi Telegram: `🔴 [Verita] PIPELINE BROKEN — N/6 checks failed. Check reports/`

**C5 exempt rule (C1=A):** C5 FAIL **không bao giờ** góp vào BROKEN threshold.
- C5 FAIL chỉ tính DEGRADED (tối đa)
- BROKEN chỉ trigger khi: (failed ≥ 4 trong C1-C4+C6) HOẶC (C6 fail)
- C5 vẫn hiển thị trong report — chỉ exempt khỏi BROKEN verdict

### FR3 — Smoke Test Report

Mỗi lần chạy, tạo file `reports/smoke-test-<YYYY-MM-DD-HH-mm>.md`:

```markdown
# Smoke Test — YYYY-MM-DD HH:mm

**Overall**: HEALTHY | DEGRADED | BROKEN
**Checks passed**: N/6
**Run by**: agent_qc (Verita)

## Health Checks

| # | Check | Expected | Actual | Status |
|---|-------|----------|--------|--------|
| C1 | concepts/ có ≥1 .md | ≥1 | 3 | ✅ PASS |
| C2 | design/ có ≥1 GDD-FEATURE-*.md | ≥1 | 2 | ✅ PASS |
| C3 | GDDs có Trạng thái header | 100% | 100% (2/2) | ✅ PASS |
| C4 | src/ có ≥1 non-empty subfolder | ≥1 | 0 | ❌ FAIL |
| C5 | quality report trong 24h | ≥1 | 0 | ❌ FAIL |
| C6 | .state/ JSONs valid | 4/4 | 4/4 | ✅ PASS |

## Ghi chú
- C4 FAIL: src/ chưa có implementation nào — pipeline mới khởi động
- C5 FAIL: chưa có code change nào trigger npm test
```

### FR4 — Pipeline Health Persist

Sau mỗi smoke test, ghi vào `.state/pipeline-health.json`:

```json
{
  "last_run": "2026-03-19T10:12:00+07:00",
  "overall": "HEALTHY | DEGRADED | BROKEN",
  "passed": 6,
  "failed": 0,
  "checks": {
    "C1_concepts": "pass",
    "C2_design": "pass",
    "C3_gdd_header": "pass",
    "C4_src": "pass",
    "C5_quality_report": "pass",
    "C6_state_json": "pass"
  },
  "last_report": "reports/smoke-test-2026-03-19-10-12.md"
}
```

### FR5 — Part F trong agent_qc AGENTS.md

Smoke test là **Part F** — chạy SAU Parts A-E, cuối mỗi WORKSPACE_SCAN:

```
Part A: GDD → Testcases
Part B: Code → Run Tests
Part C: GDD Evaluation
Part D: Code Review
Part E: Test Generation
Part F: Smoke Test  ← NEW
```

### FR6 — Smoke Test Template

Tạo `reports/smoke-test-TEMPLATE.md` làm reference template cho agent_qc generate report.

---

## 4. Non-Functional Requirements

| NFR | Mô tả |
|-----|-------|
| NFR1 — Fast | Smoke test không chạy npm test, không đọc nội dung sâu — chỉ check existence + JSON parse |
| NFR2 — Non-blocking | Nếu smoke test fail vì lý do gì → log error, không block Parts A-E |
| NFR3 — Idempotent | Chạy nhiều lần cùng minute → overwrite report cũ, không tạo duplicate |
| NFR4 — No false positives | C4 check `src/` có subfolder có file — không count empty folder |
| NFR5 — Report retention | Giữ tối đa 30 smoke test reports (xóa cũ nhất nếu > 30) |

---

## 5. Edge Cases

| Case | Xử lý |
|------|-------|
| Pipeline mới khởi động, src/ chưa có gì | C4 FAIL = expected — overall DEGRADED, không alert BROKEN |
| `pipeline-health.json` missing | Tạo mới sau smoke test đầu tiên |
| Smoke test chính nó fail (exception) | Ghi `overall: "ERROR"` vào pipeline-health.json, Telegram: `🔴 [Verita] Smoke test ERROR` |
| C5: file 24h — timezone mismatch | Dùng UTC so sánh để nhất quán |
| C6: 1 state file corrupt JSON | Báo cụ thể file nào corrupt trong report, count là FAIL |
| > 30 smoke test reports | Xóa file cũ nhất (sort by mtime asc, delete index 0) |

---

## 6. Dependencies

| Dependency | Loại | Ghi chú |
|-----------|------|---------|
| Spec 3.1 — `.state/SCHEMA.md` | ✅ DONE | C6 check 4 state files |
| Spec 3.2 — GDD header `**Trạng thái**:` | ✅ DONE | C3 check |
| `agent_qc/AGENTS.md` Parts A-E | ✅ DONE | Part F append sau |
| `reports/` folder | ✅ Đã có | C5 check + report output |

---

## 7. Acceptance Criteria

- [ ] AC1: `reports/smoke-test-TEMPLATE.md` tồn tại với 6 checks đầy đủ
- [ ] AC2: `agent_qc/AGENTS.md` có Part F với FR1 (6 checks) + FR2 (verdict) + FR3 (report) + FR4 (persist)
- [ ] AC3: `.state/pipeline-health.json` schema được định nghĩa (file tạo khi agent_qc chạy lần đầu)
- [ ] AC4: Alert logic: HEALTHY=silent, DEGRADED=⚠️, BROKEN=🔴
- [ ] AC5: C6 kiểm tra đúng 4 state files cốt lõi
- [ ] AC6: Report có timestamp format `smoke-test-YYYY-MM-DD-HH-mm.md`

---

## 8. CLARIFICATION RESOLVED

| ID | Câu hỏi | Quyết định |
|----|---------|-----------|
| C1 | C5 FAIL khi pipeline mới boot → BROKEN false positive? | **A) Exempt C5 khỏi BROKEN** — C5 FAIL chỉ tính DEGRADED tối đa. BROKEN chỉ từ C1-C4+C6. |

---

## 9. Quality Checklist

- [x] Problem Statement rõ ràng
- [x] Out of Scope được liệt kê
- [x] 6 checks được định nghĩa rõ ràng với cách kiểm tra cụ thể
- [x] Verdict logic có threshold rõ ràng
- [x] Edge cases bao gồm startup scenario + corruption
- [x] Dependencies liệt kê đủ
- [x] NEEDS CLARIFICATION markers đã resolve (C1=A — C5 exempt khỏi BROKEN)
