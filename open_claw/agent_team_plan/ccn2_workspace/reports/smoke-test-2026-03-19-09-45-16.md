# Smoke Test — YYYY-MM-DD HH:mm

**Overall**: HEALTHY | DEGRADED | BROKEN
**Checks passed**: N/6
**Run by**: agent_qc (Verita)
**Report file**: reports/smoke-test-YYYY-MM-DD-HH-mm.md

---

## Health Checks

| # | Check | Expected | Actual | Status |
|---|-------|----------|--------|--------|
| C1 | `concepts/` có ≥1 .md (non-README) | ≥1 | N | ✅ PASS / ❌ FAIL |
| C2 | `design/` có ≥1 `GDD-FEATURE-*.md` | ≥1 | N | ✅ PASS / ❌ FAIL |
| C3 | GDD-FEATURE-*.md đều có `**Trạng thái**:` header | 100% | N/total | ✅ PASS / ❌ FAIL |
| C4 | `src/` có ≥1 subfolder non-empty (không tính tests/) | ≥1 | N | ✅ PASS / ❌ FAIL |
| C5 | `reports/quality-*.md` có file trong 24h qua | ≥1 | N | ✅ PASS / ❌ FAIL |
| C6 | `.state/` 4 core JSON files tồn tại và valid | 4/4 | N/4 | ✅ PASS / ❌ FAIL |

> ⚠️ **C5 exempt note**: C5 FAIL chỉ tính tối đa DEGRADED — không góp vào BROKEN verdict.

---

## Verdict Rules

```
failed_core = C1+C2+C3+C4+C6 fail count   (C5 excluded from BROKEN)
failed_total = tất cả 6 checks fail count

HEALTHY  : failed_total = 0
DEGRADED : failed_total ≥ 1 (nhưng không đủ điều kiện BROKEN)
BROKEN   : failed_core ≥ 4  OR  C6 fail
```

---

## 4 Core State Files (C6)

- `.state/agent_gd_processed.json`
- `.state/agent_dev_processed.json`
- `.state/agent_dev_dispatched.json`
- `.state/agent_qc_processed.json`

---

## Ghi chú

<!-- Ghi rõ lý do FAIL của từng check. Ví dụ: -->
<!-- - C4 FAIL: src/ chưa có implementation nào — pipeline mới khởi động -->
<!-- - C5 FAIL: chưa có code change nào trigger npm test (expected khi mới boot) -->
<!-- - C6 FAIL: agent_dev_dispatched.json — invalid JSON (SyntaxError line 12) -->

---

## Alert Sent

- HEALTHY → (không gửi)
- DEGRADED → `⚠️ [Verita] PIPELINE DEGRADED — N/6 checks failed`
- BROKEN   → `🔴 [Verita] PIPELINE BROKEN — N/6 checks failed. Check reports/`
