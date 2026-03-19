# .state/ — Agent State Files

**Không edit thủ công** — trừ khi làm theo RUNBOOK.

## Files

| File | Owner | Mục đích |
|------|-------|---------|
| `agent_gd_processed.json` | agent_gd | Hash map các concept files đã xử lý |
| `agent_dev_processed.json` | agent_dev | Hash map các GDD files đã phân tích |
| `agent_qc_processed.json` | agent_qc | Hash map các features đã review |
| `agent_dev_client_processed.json` | agent_dev_client | Hash của dispatched.json lần scan trước |
| `agent_dev_server_processed.json` | agent_dev_server | Hash của dispatched.json lần scan trước |
| `agent_dev_admin_processed.json` | agent_dev_admin | Hash của dispatched.json lần scan trước |
| `agent_dev_dispatched.json` | agent_dev | Dispatch status: features + bugfixes cho 3 impl agents |
| `agent_qc_meta.json` | agent_qc | Metadata: code_review + test_gen tracking |
| `pipeline-health.json` | agent_qc | Smoke checks C1–C7 + verdict + stuck_gdds |
| `bug-tracker.json` | All agents | Central bug registry (status, domain, timestamps) |
| `error.log` | All agents | Lỗi runtime — agent_qc rotate khi >500 lines |
| `SCHEMA.md` | Reference | Schema đầy đủ — nguồn chính xác cho tất cả formats |

## State File Format (processed.json)

```json
{
  "elemental-hunter.md": {
    "hash": "A1B2C3D4E5F6...",
    "processedAt": "2026-03-19T09:15:00+07:00",
    "status": "done",
    "notes": ""
  }
}
```

## dispatched.json — Feature entry

```json
{
  "elemental-hunter": {
    "type": "feature",
    "dispatched_at": "ISO8601",
    "gdd_path": "design/GDD-FEATURE-elemental-hunter.md",
    "client_status": "done",
    "server_status": "done",
    "admin_status": "done"
  }
}
```

## dispatched.json — Bugfix entry

```json
{
  "bugfix-playtest-client-token-render-2026-03-19": {
    "type": "bugfix",
    "bug_id": "BUG-playtest-client-token-render-2026-03-19",
    "bug_file": "bugs/BUG-playtest-client-token-render-2026-03-19.md",
    "domain": "playtest-client",
    "client_status": "done",
    "server_status": "skipped",
    "admin_status": "skipped"
  }
}
```

## bug-tracker.json

```json
{
  "BUG-playtest-client-token-render-2026-03-19": {
    "domain": "playtest-client",
    "severity": "high",
    "status": "closed",
    "bug_file": "bugs/BUG-playtest-client-token-render-2026-03-19.md",
    "assigned_to": "agent_dev_client",
    "fixed_at": "2026-03-19T15:00:00+07:00",
    "closed_at": "2026-03-19T15:30:00+07:00"
  }
}
```

## Reset thủ công

Xem `docs/RUNBOOK-restart-agent.md` — đừng tự reset nếu không chắc.

**Safe reset** (force reprocess 1 file):
```
Edit <agent>_processed.json → "status": "pending" cho file đó
```

**Nuclear reset** (toàn bộ agent):
```powershell
echo '{}' > agent_gd_processed.json
# Chỉ dùng khi thực sự cần — agent sẽ reprocess tất cả từ đầu
```
