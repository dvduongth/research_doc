# Spec 4.1 — Error Handling + Monitoring
**Date**: 2026-03-19
**Round**: 4 — Production
**Status**: APPROVED
**Author**: William Đào 👌

---

## Overview

Spec này cover 2 subsystems liên quan chặt chẽ:
- **Error Handling**: Agent-level crash recovery + Pipeline-level timeout detection
- **Monitoring**: HTML Dashboard auto-generated từ state files

---

## Section 1: Agent-Level Error Handling

### Approach
Log & Skip — wrap toàn bộ HEARTBEAT logic trong try/catch. Khi catch error, ghi log và tiếp tục (không throw).

### Error State Entry
Khi agent bắt gặp lỗi xử lý một file:
```json
{
  "filename": {
    "hash": "last_known_or_empty",
    "processedAt": "2026-03-19T14:30:00+07:00",
    "status": "error",
    "notes": "JSONParseError: Unexpected token at line 3"
  }
}
```

### Error Log
**Path**: `ccn2_workspace/.state/error.log`
**Format** (append, 1 line per error):
```
[ISO8601+07:00] <agent_id> | file=<filename> | error=<ErrorType>: <message>
```
**Example**:
```
[2026-03-19T14:30:00+07:00] agent_dev | file=elemental-hunter.md | error=JSONParseError: Unexpected token
[2026-03-19T14:45:00+07:00] agent_qc | file=agent_dev_processed.json | error=FileNotFound: .state/agent_dev_processed.json
```
**Rotation**: Max 500 lines. Khi vượt quá, giữ lại 400 dòng cuối (xóa 100 dòng đầu). Rotation do **agent_qc** thực hiện mỗi lần chạy Part F — đây là agent duy nhất có rotation responsibility, tránh race condition multi-agent write.

**Race condition note**: Nhiều agents append đồng thời là acceptable (OS-level append atomicity đủ cho 1 line). Rotation chỉ do agent_qc thực hiện → không có concurrent rotation.

### Áp dụng cho
Tất cả 6 agents. Mỗi HEARTBEAT.md bổ sung section **"## Error Handling"** với:
- Try/catch pattern
- Error log path
- Status="error" instruction

### Cron exit code
Agent luôn exit 0 sau khi log error — không làm OpenClaw retry storm.

---

## Section 2: Pipeline-Level Timeout Detection

### Agent thực hiện
`agent_qc` (Verita) — thêm **Part G: Pipeline Watch** sau Part F Smoke Test.

### Trigger
Mỗi lần agent_qc cron chạy (mỗi 15 phút).

### Logic
```
For each GDD file in ccn2_workspace/design/ with extension .md:
  1. Đọc header field "Cập nhật lần cuối lúc" (ISO8601)
     → delta = now - "Cập nhật lần cuối lúc"
     → Ý nghĩa: thời điểm status thay đổi lần cuối (agent ghi khi transition)
  2. Nếu header "Trạng thái" ∈ {InDev, InQC} AND delta > 48h:
     a. Thêm vào stuck_list: {file, status, hours_stuck}
     b. Alert Telegram: ⏰ GDD <name> stuck in <status> for <N>h

If stuck_list non-empty:
  3. Ghi reports/pipeline-watch-YYYY-MM-DD-HH-mm.md
  4. Update .state/pipeline-health.json: thêm "stuck_gdds": [...]
```

**Delta definition**: `delta` tính từ field **"Cập nhật lần cuối lúc"** trong GDD header — field này được agent cập nhật mỗi khi status transition. Nếu field rỗng/missing → skip file, log warning vào error.log.

### Pipeline Watch Report Format
```markdown
# Pipeline Watch — 2026-03-19 14:30

## Stuck GDDs (>48h)
| GDD | Status | Hours Stuck | Last Updated By |
|-----|--------|-------------|-----------------|
| elemental-hunter.md | InDev | 52h | agent_dev |

## Action Required
- [ ] Manual check: elemental-hunter.md — tại sao dispatched.json vẫn empty?
```

### Constraints
- **Không tự change GDD status** — chỉ report, không action. Human decides.
- **Retain**: Max 14 pipeline-watch reports (rolling 2 weeks). agent_qc xóa oldest file (theo timestamp trong filename) khi vượt quá 14 — cùng lúc rotation error.log để tránh thêm I/O cycle.
- **Silent mode**: Nếu không có GDD stuck → không tạo report, không alert.
- **Alert channel**: Telegram (same bot/channel đã dùng cho smoke test alerts). Format: `⏰ [Pipeline Watch] GDD <name> stuck in <status> for <N>h — check pipeline-watch report`.

---

## Section 3: HTML Dashboard

### File
`ccn2_workspace/reports/dashboard.html`

### Update Trigger
Cuối Part F (Smoke Test), `agent_qc` overwrite toàn bộ `dashboard.html`.

### Data Source
agent_qc đọc:
- `.state/agent_*_processed.json` — per-agent stats
- `.state/agent_dev_dispatched.json` — dispatch status
- `.state/pipeline-health.json` — smoke test results
- `.state/error.log` — last 10 errors
- `design/GDD-FEATURE-*.md` — GDD header fields

Inject vào HTML template dưới dạng inline `<script>const DASHBOARD_DATA = {...};</script>`

### Layout
```
┌─────────────────────────────────────────────────┐
│  CCN2 Pipeline Dashboard    Last: 2026-03-19 T  │
├─────────────┬──────────────┬────────────────────┤
│ 6 Agents    │ 7 Cron Jobs  │ Smoke: DEGRADED    │
│ ACTIVE      │ ACTIVE       │ Pipeline: InDev    │
├─────────────┴──────────────┴────────────────────┤
│ GDD Status Flow                                 │
│  elemental-hunter → [InDev] ← 2h ago           │
├─────────────────────────────────────────────────┤
│ Agent Cards (6x)                                │
│  [Designia] last: 14:30 | files: 3 | ✅        │
│  [Codera]   last: 14:29 | files: 1 | ⚠️        │
│  ...                                            │
├─────────────────────────────────────────────────┤
│ Smoke Test Checks C1-C6 (grid)                 │
│  C1 ✅  C2 ✅  C3 ✅  C4 ⚠️  C5 ⬜  C6 ✅    │
├─────────────────────────────────────────────────┤
│ Recent Errors (last 10)                         │
│  [14:30] agent_dev | JSONParseError...          │
└─────────────────────────────────────────────────┘
```

### Design
- **Dark theme**: `#0f172a` background, Indigo primary (match existing reports)
- **Static HTML**: Không cần server, mở trực tiếp bằng browser
- **Self-contained**: CSS và JS inline, không có external dependency
- **Auto-refresh**: `<meta http-equiv="refresh" content="900">` (15 phút) — browser reload lại file từ disk. Data luôn là snapshot tại lần agent_qc chạy gần nhất (không fetch live). Đây là intentional: dashboard hiển thị "last known state", không phải real-time.
- **Stale indicator**: Header hiển thị "Last updated: HH:mm" để người dùng biết data cũ bao lâu.

---

## Deliverables

| # | Artifact | Responsible |
|---|----------|-------------|
| D1 | `ccn2_workspace/.state/error.log` (created empty) | agent_qc init |
| D2 | 6 HEARTBEAT.md files — thêm "Error Handling" section | manual update |
| D3 | `agent_qc/AGENTS.md` — thêm Part G: Pipeline Watch | manual update |
| D4 | `ccn2_workspace/.state/SCHEMA.md` — update với error.log spec | manual update |
| D5 | `ccn2_workspace/reports/dashboard.html` (template + generated) | agent_qc generates |
| D6 | `ccn2_workspace/.state/pipeline-health.json` — thêm field `stuck_gdds` | schema update |

---

## Constraints & Non-Goals

- **NOT**: Agent tự fix lỗi của agent khác
- **NOT**: Real-time WebSocket dashboard (static HTML only)
- **NOT**: Email alerts (Telegram only)
- **NOT**: Auto-retry failed tasks (cron-based natural retry is sufficient)
- **Cron exit**: Luôn exit 0 sau error handling
