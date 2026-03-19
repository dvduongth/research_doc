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

| File | Loại | Dài ~(lines) |
|------|------|--------------|
| `ARCHITECTURE.md` | Reference | ~220 |
| `HOWTO-add-agent.md` | Guide | ~90 |
| `HOWTO-create-concept.md` | Guide | ~80 |
| `RUNBOOK-stuck-pipeline.md` | Runbook | ~70 |
| `RUNBOOK-agent-errors.md` | Runbook | ~70 |
| `RUNBOOK-restart-agent.md` | Runbook | ~70 |

---

## File Specifications

### 1. ARCHITECTURE.md

**Table of Contents** (required at top):
- System Overview, Agent Roles, Cron Schedule, Shared State, GDD Pipeline, Error Handling, Smoke Test, Dashboard

**Sections**:

#### System Overview
ASCII diagram mô tả data flow:
```
concepts/ → [agent_gd] → eval/ → design/ → [agent_dev] → analysis/ + dispatched.json
                                                       ↓
                                          [agent_dev_client/server/admin] → src/
                                                       ↓
                                          [agent_qc] → reports/ + dashboard.html
```

#### Agent Roles
Bảng 6 agents:

| Agent ID | Name | Role | Cron | State File |
|----------|------|------|------|------------|
| agent_gd | Designia | GDD evaluation | */15 * * * * (offset :00,:30) | agent_gd_processed.json |
| agent_dev | Codera | Feature analysis + dispatch | */15 * * * * (offset :02,:32) | agent_dev_processed.json |
| agent_qc | Verita | Code review + smoke test | */15 * * * * (offset :04,:34) | agent_qc_processed.json |
| agent_dev_client | Pixel | Client implementation | */30 * * * * (offset :17,:47) | agent_dev_client_processed.json |
| agent_dev_server | Forge | Server implementation | */30 * * * * (offset :19,:49) | agent_dev_server_processed.json |
| agent_dev_admin | Panel | Admin implementation | */30 * * * * (offset :21,:51) | agent_dev_admin_processed.json |

#### Cron Schedule
- Main agents (gd/dev/qc): every 15 min, staggered 2-min offsets
- Impl agents (client/server/admin): every 30 min, staggered 2-min offsets
- Stagger prevents race conditions on shared state files
- Reference: `CRON_SETUP.md` for full job definitions and OpenClaw config

#### Shared State (`.state/` folder)
| File | Owner | Purpose |
|------|-------|---------|
| `agent_gd_processed.json` | agent_gd | Track processed concepts |
| `agent_dev_processed.json` | agent_dev | Track processed GDDs |
| `agent_qc_processed.json` | agent_qc | Track reviewed features |
| `agent_dev_client_processed.json` | agent_dev_client | Track dispatched features (client layer) |
| `agent_dev_server_processed.json` | agent_dev_server | Track dispatched features (server layer) |
| `agent_dev_admin_processed.json` | agent_dev_admin | Track dispatched features (admin layer) |
| `agent_dev_dispatched.json` | agent_dev | Dispatch status per feature (client/server/admin_status) |
| `agent_qc_meta.json` | agent_qc | Metadata: code_review + test_gen tracking |
| `pipeline-health.json` | agent_qc | Smoke test results + stuck GDDs |
| `error.log` | All agents (append); agent_qc (rotate) | Error log — see Error Handling section |
| `SCHEMA.md` | Reference | Full state schema contract |

#### GDD Pipeline
6 stages (Draft và Review là entry stages; Done và Flagged là 2 terminal stages riêng biệt):

```
Draft → Review → InDev → InQC → Done
                               ↘ Flagged
```

| Stage | Meaning | Who sets | Gate rule |
|-------|---------|----------|-----------|
| Draft | Concept mới, chưa đánh giá | Human | - |
| Review | agent_gd đánh giá ≥70/100 → promote | agent_gd | Score ≥ 70 |
| InDev | agent_dev đang xử lý | agent_dev | GDD status = Review |
| InQC | Impl agents xong cả 3 layers | agent_dev | All layers done |
| Done | agent_qc review pass | agent_qc | GDD status = InQC |
| Flagged | agent_qc review fail (human required) | agent_qc | GDD status = InQC |

**Key GDD header fields** (trong mỗi GDD-FEATURE-*.md — canonical source: `ccn2_workspace/design/GDD-TEMPLATE-FEATURE.md`):
```
**Trạng thái**: Draft | Review | InDev | InQC | Done | Flagged
**Pipeline agent**: agent_gd | agent_dev | agent_qc
**Cập nhật lần cuối bởi**: <agent_id>
**Cập nhật lần cuối lúc**: ISO8601+07:00
```
Note: Đây là bộ fields tiếng Việt từ `GDD-TEMPLATE-FEATURE.md` (updated Round 3/Spec 3.2). Dùng đúng tên field này trong runbooks và manual override.

#### Error Handling
- **Approach**: Log & Skip — mỗi agent wrap HEARTBEAT trong try/catch
- **Error log**: `ccn2_workspace/.state/error.log`
- **Format**: `[ISO8601+07:00] <agent_id> | file=<filename> | error=<Type>: <msg>`
- **Rotation**: Max 500 lines; agent_qc giữ 400 dòng cuối khi exceeded (sole rotator — tránh race condition)
- **State entry on error**: `status: "error"`, `notes: "<error message>"`
- **Cron exit**: Always 0 — failure tracked via log, không trigger OpenClaw retry storm

#### Smoke Test (agent_qc Part F)
6 checks, run mỗi cron cycle của agent_qc:

| Check | Description | Exempt from BROKEN? |
|-------|-------------|---------------------|
| C1 | Agents count (≥3 state files exist) | No |
| C2 | State files valid JSON | No |
| C3 | GDD files present in design/ | No |
| C4 | Impl agents have created src/ subfolders | No |
| C5 | Quality report exists in reports/ | **YES** |
| C6 | pipeline-health.json writable | No |

**Verdicts**: HEALTHY (all pass) / DEGRADED (1-2 fail, or C5 only) / BROKEN (3+ fail excluding C5)

#### Pipeline Watch (agent_qc Part G)
- Detects GDDs stuck in InDev/InQC > 48h
- Writes `reports/pipeline-watch-YYYY-MM-DD-HH-mm.md` when stuck found
- Alerts Telegram: `⏰ [Pipeline Watch] GDD <name> stuck in <status> for <N>h`
- Max 14 reports retained (rolling 2 weeks)

#### Dashboard
- **Path**: `ccn2_workspace/reports/dashboard.html`
- **Generated by**: agent_qc at end of Part F
- **Content**: Stats bar + GDD flow + agent cards + smoke checks + recent errors
- **Model**: Snapshot at last agent_qc run (not real-time). Auto-refresh 15min reloads file from disk.

---

### 2. HOWTO-add-agent.md

**Table of Contents** (required at top)

Step-by-step checklist để thêm agent mới:

```markdown
## Checklist: Add New Agent

### Step 1 — Create agent folder
[ ] mkdir openclaw/agents/<agent_id>/

### Step 2 — Create identity files
[ ] SOUL.md     — identity, personality, role description
[ ] USER.md     — thông tin về user/project context mà agent cần biết
[ ] AGENTS.md   — HEARTBEAT logic (xem Parts A-F bên dưới)
[ ] HEARTBEAT.md — runtime instructions: hash computation, status enum,
                   change detection logic, error handling

### Step 3 — AGENTS.md Parts (minimum A-F)
Parts required trong AGENTS.md:
- Part A: Identity & Role
- Part B: Input Sources (files agent reads)
- Part C: Processing Logic (what agent does with each file)
- Part D: Gate Rules (conditions to skip/proceed)
- Part E: Constraints (what agent must NOT do)
- Part F: Output Format (what agent writes/creates)
Note: agent_qc cần thêm Part F (Smoke Test) và Part G (Pipeline Watch)

### Step 4 — Register in OpenClaw
[ ] Thêm vào ~/.openclaw/openclaw.json (hoặc config tương đương)
    Fields: agent_id, name, model, workspace_path, heartbeat_path

### Step 5 — Init state file
[ ] echo '{}' > ccn2_workspace/.state/<agent_id>_processed.json

### Step 6 — Create cron job
[ ] Tham khảo CRON_SETUP.md
[ ] Main agent: every 15min với offset (tránh :00, :02, :04, :15, :17, :19, :30, :32, :34, :45, :47, :49)
[ ] Impl agent: every 30min với offset tương tự
[ ] Add entry vào CRON_SETUP.md để track

### Step 7 — Verify
[ ] Chờ 1 cron cycle
[ ] Smoke test C1: verify new state file xuất hiện
[ ] Kiểm tra error.log: không có entry từ agent mới
[ ] Kiểm tra dashboard.html: agent card mới xuất hiện
[ ] Kiểm tra HEARTBEAT logic: state file có entries sau khi chạy
```

---

### 3. HOWTO-create-concept.md

**Table of Contents** (required at top)

Full workflow từ idea đến Done:

```markdown
## Workflow: Idea → Production

### Step 1 — Tạo concept file
Path: ccn2_workspace/concepts/<feature-name>.md
Format: GDD_Overview format (xem GDD_Overview_v2_ElementalHunter.md làm ví dụ)
Minimum required: title, description, core mechanics, win conditions

### Step 2 — agent_gd evaluation (tự động)
Thời gian: tối đa 15 phút (1 cron cycle)
agent_gd tạo: ccn2_workspace/eval/GDD-EVAL-<name>-YYYY-MM-DD.md

Scoring rubric (100 điểm — 6 criteria, source: `ccn2_workspace/eval/GDD-EVAL-RUBRIC.md`):
- Đầy đủ: 25pt
- Cụ thể: 25pt
- Khả năng triển khai: 20pt
- Trường hợp ngoại lệ: 15pt
- Kịch bản kiểm thử: 10pt
- Chỉ số đánh giá: 5pt

Kết quả (3 tiers):
- Score < 50  → concept bị reject, không tạo file gì → pipeline không tiến
- Score 50-69 → tạo eval file, concept giữ ở Draft, cần revise → quay lại Step 1
- Score ≥ 70  → auto-promoted → design/GDD-FEATURE-<name>.md (status=Review)

### Step 3 — agent_dev analysis (tự động)
Trigger: GDD status = Review
agent_dev tạo:
- ccn2_workspace/analysis/REQ-<name>.md (requirements)
- ccn2_workspace/analysis/DESIGN-<name>.md (technical design)
GDD → InDev, "Cập nhật lần cuối lúc" = now

### Step 4 — Implementation (tự động, 3 layers song song)
agent_dev_client/server/admin pick up từ agent_dev_dispatched.json
Tạo: ccn2_workspace/src/<feature-name>/ (mỗi layer)
Khi tất cả 3 layers done → agent_dev update GDD → InQC

### Step 5 — QC Review (tự động)
Trigger: GDD status = InQC
agent_qc tạo: ccn2_workspace/reports/code-review-<name>-YYYY-MM-DD.md
Kết quả:
- Pass → GDD → Done ✅
- Fail → GDD → Flagged ⚠️ (human review required)

### Khi GDD = Flagged
Flagged ≠ Done. agent_qc không retry tự động.
Human cần:
1. Đọc code-review report để hiểu vấn đề
2. Fix issues trong src/ hoặc revise design/GDD-FEATURE-<name>.md
3. Manually reset GDD status về InDev hoặc InQC để trigger lại
   (xem RUNBOOK-restart-agent.md)
```

---

### 4. RUNBOOK-stuck-pipeline.md

**Table of Contents** (required at top)

```markdown
## Symptom
GDD ở InDev hoặc InQC > 48h không có tiến triển.
Signal: pipeline-watch report trong reports/pipeline-watch-*.md, hoặc Telegram alert ⏰

## Diagnosis

### Case A: Stuck in InDev

1. Mở ccn2_workspace/.state/agent_dev_dispatched.json
   Path: ccn2_workspace/.state/agent_dev_dispatched.json
   → Empty ({}) hoặc feature không có entry?
     → agent_dev chưa chạy hoặc bị error
     → Kiểm tra: ccn2_workspace/.state/agent_dev_processed.json
                 entry có status="error"?
     → Fix: xem RUNBOOK-agent-errors.md

   → Feature có entry nhưng client/server/admin_status vẫn "pending"?
     → Impl agents chưa nhận hoặc bị error
     → Kiểm tra: agent_dev_client/server/admin_processed.json

2. Kiểm tra error.log:
   grep "agent_dev" ccn2_workspace/.state/error.log

### Case B: Stuck in InQC

1. Kiểm tra reports/ có code-review-<feature>-*.md không
   → Không có: agent_qc chưa chạy hoặc bị error
   → Kiểm tra: agent_qc_processed.json entry status
   → Kiểm tra: error.log | grep agent_qc

2. Nếu có report nhưng GDD không chuyển trạng thái:
   → agent_qc bị crash sau khi write report, trước khi update GDD header
   → Fix: Manual override (Step C)

### Case C: Manual Override

Edit GDD header fields trực tiếp:
- Sửa **Trạng thái**: đặt về InDev hoặc Review nếu cần reprocess
- Sửa **Cập nhật lần cuối lúc**: đặt về now (ISO8601+07:00) để reset 48h clock
- Reset state entry: đặt status="pending" trong processed.json tương ứng
  (xem RUNBOOK-restart-agent.md để biết cách reset state)
```

---

### 5. RUNBOOK-agent-errors.md

**Table of Contents** (required at top)

```markdown
## Đọc error.log

# Xem 20 lỗi gần nhất
tail -20 ccn2_workspace/.state/error.log

# Lọc theo agent
grep "agent_dev" ccn2_workspace/.state/error.log

# Lọc theo feature file
grep "elemental-hunter" ccn2_workspace/.state/error.log

# Lọc theo loại lỗi
grep "JSONParseError" ccn2_workspace/.state/error.log

## Common Errors

| Error | Nguyên nhân | Fix |
|-------|-------------|-----|
| `JSONParseError` | State file bị corrupt (truncated write) | Reset state file → RUNBOOK-restart-agent.md |
| `FileNotFound` | State file chưa tồn tại | `echo '{}' > .state/<agent>_processed.json` |
| `HashComputeError` | PowerShell/md5sum không available trên PATH | Verify PATH; hash fallback: `SIZE<N>-HEAD<chars>` (xem SCHEMA.md) |
| `PermissionDenied` | File locked bởi process khác | Wait 1 cron cycle (15-30 min); cron sẽ retry tự nhiên |
| `HeaderParseError` | GDD header field thiếu hoặc sai format | Sửa GDD file theo GDD-TEMPLATE-FEATURE.md |
| `TimeoutError` | Agent process quá lâu (LLM timeout) | OpenClaw auto-retry sau N failures; check SOUL.md timeout config |

## State file bị "error" status

Nếu state entry có status="error":
1. Fix nguyên nhân (bảng trên)
2. Đặt status="pending" để trigger reprocess:
   Edit .state/<agent>_processed.json: "status": "pending"
3. Chờ cron cycle tiếp theo
```

---

### 6. RUNBOOK-restart-agent.md

**Table of Contents** (required at top)

```markdown
## Reset toàn bộ state (force reprocess tất cả files)

⚠️ WARNING: Agent sẽ reprocess tất cả files từ đầu — kể cả files đã Done.
Nếu GDD đã Done bị reprocess, agent có thể overwrite reports.
Chỉ dùng khi cần thiết.

# Reset state file của agent cụ thể
echo '{}' > ccn2_workspace/.state/<agent_id>_processed.json
# Ví dụ: reset agent_dev
echo '{}' > ccn2_workspace/.state/agent_dev_processed.json

## Force reprocess một file cụ thể (safe — không ảnh hưởng files khác)

Edit .state/<agent_id>_processed.json:
Tìm entry của file cần reprocess, đổi "status" → "pending"

Ví dụ — force agent_dev reprocess elemental-hunter.md:
{
  "elemental-hunter.md": {
    "hash": "...",
    "processedAt": "...",
    "status": "pending",   ← đổi thành pending
    "notes": ""
  }
}

## Clear error log

echo '' > ccn2_workspace/.state/error.log

## Reset pipeline-health.json

Path: ccn2_workspace/.state/pipeline-health.json
echo '{"overall": "UNKNOWN", "checks": {}, "stuck_gdds": []}' > ccn2_workspace/.state/pipeline-health.json

## Reset dispatch state

Path: ccn2_workspace/.state/agent_dev_dispatched.json
⚠️ WARNING: Chỉ reset khi impl agents chưa bắt đầu xử lý.
Điều kiện an toàn để reset: kiểm tra 3 state files sau — tất cả đều KHÔNG có entry
nào với status="in_progress":
  - ccn2_workspace/.state/agent_dev_client_processed.json
  - ccn2_workspace/.state/agent_dev_server_processed.json
  - ccn2_workspace/.state/agent_dev_admin_processed.json

Nếu bất kỳ file nào có status="in_progress" → KHÔNG reset, chờ impl agent hoàn thành
(status → "done" hoặc "error") rồi mới reset.

echo '{}' > ccn2_workspace/.state/agent_dev_dispatched.json

## Verify sau khi restart

1. Chờ 1 cron cycle (15-30 phút tùy agent)
2. Mở dashboard.html trong browser — kiểm tra "Last updated" timestamp
3. Kiểm tra error.log: có lỗi mới từ agent vừa restart không?
4. Kiểm tra smoke test verdict trong pipeline-health.json
5. Kiểm tra state file: entries có chuyển từ "pending" → "done" không?
```

---

## Non-Goals

- **NOT**: Auto-generated từ code — maintained manually; **owner**: William Đào (update khi AGENTS.md/HEARTBEAT.md thay đổi)
- **NOT**: Fancy formatting — Markdown only, readable trong bất kỳ text editor nào
- **NOT**: Covers non-agent topics — CCN2 game rules → `GameDesignDocument.md`; Cocos2d-x client → `clientccn2/CLAUDE.md`; Server → `serverccn2/` docs
- **NOT**: Migration/upgrade guide (nằm ngoài scope Round 4)
- **NOT**: Covers agent crash do OOM/process-kill (OS-level issue, nằm ngoài OpenClaw scope)
- Each file has Table of Contents at top

---

## Deliverables

| # | Artifact | Notes |
|---|----------|-------|
| D1 | `ccn2_workspace/docs/ARCHITECTURE.md` | Full reference, ~220 lines |
| D2 | `ccn2_workspace/docs/HOWTO-add-agent.md` | Checklist + Parts A-F definition |
| D3 | `ccn2_workspace/docs/HOWTO-create-concept.md` | Full pipeline walkthrough |
| D4 | `ccn2_workspace/docs/RUNBOOK-stuck-pipeline.md` | Cases A/B/C with file paths |
| D5 | `ccn2_workspace/docs/RUNBOOK-agent-errors.md` | Error table + grep commands |
| D6 | `ccn2_workspace/docs/RUNBOOK-restart-agent.md` | Reset commands with warnings |
