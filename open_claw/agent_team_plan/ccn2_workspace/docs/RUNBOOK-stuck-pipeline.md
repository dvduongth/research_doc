# Runbook: Stuck Pipeline

## Table of Contents
1. [Symptom](#symptom)
2. [Case A — Stuck in InDev](#case-a--stuck-in-indev)
3. [Case B — Stuck in InQC](#case-b--stuck-in-inqc)
4. [Case C — Manual Override](#case-c--manual-override)

---

## Symptom

GDD stays in `InDev` or `InQC` for more than 48 hours without progress.

**Signals**:
- Telegram alert: `⏰ [Pipeline Watch] GDD <name> stuck in <status> for <N>h`
- Report: `ccn2_workspace/reports/pipeline-watch-YYYY-MM-DD-HH-mm.md`
- Dashboard: stuck GDD count > 0 in stats bar

---

## Case A — Stuck in InDev

**Step 1**: Check dispatch file

    ccn2_workspace/.state/agent_dev_dispatched.json

- Empty `{}`? → agent_dev has not processed this GDD
- Feature entry present but statuses = "pending"? → Impl agents haven't started

**Step 2**: Check agent_dev state

    ccn2_workspace/.state/agent_dev_processed.json

Find the GDD entry — is `status: "error"`? → See RUNBOOK-agent-errors.md

**Step 3**: Check error log

    grep "agent_dev" ccn2_workspace/.state/error.log

**Step 4**: If no errors but dispatch still empty

Check if analysis files exist:

    ccn2_workspace/analysis/REQ-<name>.md
    ccn2_workspace/analysis/DESIGN-<name>.md

If missing: agent_dev hasn't run analysis yet → force reprocess via Case C.

---

## Case B — Stuck in InQC

**Step 1**: Check for review report

    ccn2_workspace/reports/code-review-<feature-name>-*.md

- File exists? → agent_qc wrote report but failed to update GDD header → apply verdict manually (Case C)
- File missing? → agent_qc has not processed this GDD yet

**Step 2**: Check agent_qc state

    ccn2_workspace/.state/agent_qc_processed.json

**Step 3**: Check error log

    grep "agent_qc" ccn2_workspace/.state/error.log

---

## Case D — Bug Stuck (không được fix sau 24h)

**Symptom**: Bug trong `bug-tracker.json` ở status `assigned` hoặc `in_progress` quá lâu mà không chuyển sang `fixed`.

**Step 1**: Xác định bug nào bị stuck

    # Xem toàn bộ bug-tracker
    cat ccn2_workspace/.state/bug-tracker.json

Tìm entries có `status: "assigned"` hoặc `"in_progress"` với `assigned_at` quá 24h.

**Step 2**: Check dispatched.json xem có entry bugfix không

    grep "bugfix" ccn2_workspace/.state/agent_dev_dispatched.json

- Không có entry → Codera chưa triage → kiểm tra `agent_dev` state file + error.log
- Có entry nhưng status = "in_progress" lâu → dev agent bị crash giữa chừng

**Step 3**: Recovery

    # Option A — Reset về open để Codera retriage
    # Edit bug-tracker.json: "status": "open"
    # Codera sẽ tự tạo lại dispatched.json entry lần scan sau

    # Option B — Tự dispatch thủ công
    # Edit agent_dev_dispatched.json:
    # - Thêm entry bugfix với domain đúng
    # - Set <layer>_status = "dispatched"
    # - Edit bug-tracker.json: "status": "assigned"

**Step 4**: Verify sau 1 cron cycle

    grep "<bug-id>" ccn2_workspace/.state/bug-tracker.json
    # Expect: "status": "fixed"

---

## Case C — Manual Override

Edit GDD header fields in `ccn2_workspace/design/GDD-FEATURE-<name>.md`:

To re-trigger agent_dev (back to InDev):

    **Trạng thái**: InDev
    **Cập nhật lần cuối bởi**: human
    **Cập nhật lần cuối lúc**: <now ISO8601+07:00>

To re-trigger agent_qc (stay InQC):

    **Trạng thái**: InQC
    **Cập nhật lần cuối bởi**: human
    **Cập nhật lần cuối lúc**: <now ISO8601+07:00>

Note: Updating "Cập nhật lần cuối lúc" resets the 48h stuck-detection clock.

Reset state entry for the relevant agent:
See `RUNBOOK-restart-agent.md` → "Force Reprocess a Single File"
