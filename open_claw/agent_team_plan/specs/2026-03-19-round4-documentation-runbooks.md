# Spec 4.2 — Documentation & Runbooks
**Date**: 2026-03-19
**Round**: 4 — Production
**Status**: APPROVED
**Author**: William Đào 👌

---

## Overview

Full onboarding documentation cho CCN2 Multi-Agent System. Target audience:
- Người mới join project
- Anh sau 3 tháng không nhìn vào hệ thống
- Bất kỳ ai cần troubleshoot pipeline

---

## Output

**Folder**: `ccn2_workspace/docs/` (mới)
**6 files Markdown**:

| File | Loại | Mô tả |
|------|------|-------|
| `ARCHITECTURE.md` | Reference | Tổng quan hệ thống |
| `HOWTO-add-agent.md` | Guide | Thêm agent mới |
| `HOWTO-create-concept.md` | Guide | Workflow từ idea đến pipeline |
| `RUNBOOK-stuck-pipeline.md` | Runbook | Chẩn đoán + fix GDD bị stuck |
| `RUNBOOK-agent-errors.md` | Runbook | Đọc error.log, fix common errors |
| `RUNBOOK-restart-agent.md` | Runbook | Reset state, force reprocess |

---

## File Specifications

### 1. ARCHITECTURE.md
Sections:
- **System Overview**: Diagram ASCII của 6 agents + cron timing + data flow
- **Agent Roles**: Bảng 6 agents, role, cron schedule, state file
- **Shared State**: Mô tả `.state/` folder, từng file JSON
- **GDD Pipeline**: 6-stage flow (Draft→Review→InDev→InQC→Done|Flagged) với gate rules
- **Error Handling**: error.log location, rotation policy
- **Smoke Test**: 6 checks, verdicts, pipeline-health.json

### 2. HOWTO-add-agent.md
Step-by-step checklist:
```
[ ] 1. Tạo thư mục: openclaw/agents/<agent_id>/
[ ] 2. Tạo SOUL.md (identity, role)
[ ] 3. Tạo AGENTS.md (HEARTBEAT logic, parts A-F minimum)
[ ] 4. Tạo HEARTBEAT.md (hash computation, status enum, change detection, error handling)
[ ] 5. Thêm vào openclaw.json
[ ] 6. Init state file: ccn2_workspace/.state/<agent_id>_processed.json = {}
[ ] 7. Tạo cron job (OpenClaw UI hoặc CRON_SETUP.md)
[ ] 8. Smoke test: verify C1 (agents count) sau khi add
```

### 3. HOWTO-create-concept.md
Workflow từ idea → production:
```
Step 1: Tạo concept file
  → concepts/<name>.md (GDD_Overview format)
  → agent_gd sẽ pick up trong lần cron tiếp theo

Step 2: Wait for agent_gd evaluation
  → eval/GDD-EVAL-<name>-YYYY-MM-DD.md được tạo
  → Score < 70: concept cần revise → sửa concepts/<name>.md
  → Score ≥ 70: auto-promoted → design/GDD-FEATURE-<name>.md (status=Review)

Step 3: agent_dev picks up Review GDD
  → analysis/REQ-<name>.md + analysis/DESIGN-<name>.md
  → GDD → InDev
  → Dispatch to impl agents

Step 4: Impl agents work
  → src/<name>/ files created
  → agent_dev detects all done → GDD → InQC

Step 5: agent_qc reviews
  → reports/code-review-<name>-*.md
  → Pass → GDD → Done
  → Fail → GDD → Flagged (human review)
```

### 4. RUNBOOK-stuck-pipeline.md
**Symptom**: GDD ở InDev/InQC > 48h, pipeline-watch report có alert.

Diagnosis flow:
```
1. Kiểm tra pipeline-watch report mới nhất
   → Xác định GDD nào bị stuck, stuck bao lâu

2. Nếu stuck ở InDev:
   a. Mở agent_dev_dispatched.json
      → Empty? → agent_dev chưa chạy hoặc bị error
      → Có entries? → Kiểm tra client_status/server_status/admin_status
   b. Kiểm tra error.log: tìm entries liên quan agent_dev
   c. Fix: Xem RUNBOOK-agent-errors.md

3. Nếu stuck ở InQC:
   a. Kiểm tra reports/ có code-review-*.md không
   b. Kiểm tra error.log: tìm entries liên quan agent_qc
   c. Fix: Xem RUNBOOK-agent-errors.md

4. Manual override (nếu cần):
   → Sửa trực tiếp GDD header "Trạng thái"
   → Reset entry trong state file: status="pending"
```

### 5. RUNBOOK-agent-errors.md
**Đọc error.log**:
```bash
# Xem 20 lỗi gần nhất
tail -20 ccn2_workspace/.state/error.log

# Lọc theo agent
grep "agent_dev" ccn2_workspace/.state/error.log

# Lọc theo file
grep "elemental-hunter" ccn2_workspace/.state/error.log
```

**Common errors**:
| Error | Nguyên nhân | Fix |
|-------|-------------|-----|
| `JSONParseError` | State file bị corrupt | Xem RUNBOOK-restart-agent.md → reset state file |
| `FileNotFound` | State file chưa tồn tại | Init file: `echo '{}' > .state/<agent>_processed.json` |
| `HashComputeError` | PowerShell/md5sum không available | Kiểm tra PATH; fallback pseudo-hash |
| `PermissionDenied` | File lock từ process khác | Wait 5 phút, cron sẽ retry tự nhiên |
| `HeaderParseError` | GDD header format sai | Sửa GDD file theo GDD-TEMPLATE-FEATURE.md |

### 6. RUNBOOK-restart-agent.md
**Reset state file** (force reprocess tất cả):
```bash
echo '{}' > ccn2_workspace/.state/<agent_id>_processed.json
```

**Force reprocess một GDD cụ thể**:
```bash
# Ví dụ: force agent_dev reprocess elemental-hunter.md
# Sửa entry trong agent_dev_processed.json:
# "elemental-hunter.md": { "status": "pending", ... }
```

**Clear error log**:
```bash
echo '' > ccn2_workspace/.state/error.log
```

**Reset pipeline-health.json**:
```bash
echo '{"overall": "UNKNOWN", "checks": {}}' > ccn2_workspace/.state/pipeline-health.json
```

**Verify sau khi restart**:
```
1. Chờ 1 cron cycle (15-30 phút)
2. Mở dashboard.html — kiểm tra agent last_run
3. Kiểm tra error.log — có lỗi mới không
4. Kiểm tra smoke test verdict
```

---

## Deliverables

| # | Artifact | Notes |
|---|----------|-------|
| D1 | `ccn2_workspace/docs/ARCHITECTURE.md` | Reference doc |
| D2 | `ccn2_workspace/docs/HOWTO-add-agent.md` | Checklist format |
| D3 | `ccn2_workspace/docs/HOWTO-create-concept.md` | Step-by-step workflow |
| D4 | `ccn2_workspace/docs/RUNBOOK-stuck-pipeline.md` | Diagnosis + fix |
| D5 | `ccn2_workspace/docs/RUNBOOK-agent-errors.md` | Error reference |
| D6 | `ccn2_workspace/docs/RUNBOOK-restart-agent.md` | Reset procedures |

---

## Constraints & Non-Goals

- **NOT**: Auto-generated từ code (written manually, kept up to date manually)
- **NOT**: Fancy formatting — Markdown only, readable trong text editor
- **NOT**: Covers non-agent topics (CCN2 game rules, Cocos2d-x, etc.) — chỉ focus pipeline
- **Format**: Mỗi file có Table of Contents ở đầu
- **Length**: ARCHITECTURE.md ~200 lines, HOWTOs ~80 lines, RUNBOOKs ~60 lines each
