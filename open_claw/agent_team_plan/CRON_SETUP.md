# Cron Jobs Setup — CCN2 Agent Team

> **Status**: Ready to add — manual step required via OpenClaw UI or API
> **Created**: 2026-03-18

## Cách thêm cron job trong OpenClaw

Mở OpenClaw web UI → Cron → Add Job, paste JSON sau vào từng job.

---

## Job 1: agent_gd — Workspace Scan

```json
{
  "id": "ccn2-gd-workspace-scan",
  "agentId": "agent_gd",
  "name": "CCN2 GD — Scan concepts/",
  "description": "Scan ccn2_workspace/concepts/ mỗi 15 phút để tạo GDD mới",
  "enabled": true,
  "schedule": {
    "kind": "cron",
    "expr": "*/15 8-22 * * 1-5",
    "tz": "Asia/Ho_Chi_Minh"
  },
  "sessionTarget": "isolated",
  "payload": {
    "type": "system_event",
    "text": "WORKSPACE_SCAN: Follow HEARTBEAT.md instructions exactly. Check D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace/concepts/ for new or changed .md files. For each changed file, generate a GDD in ccn2_workspace/design/. Update .state/agent_gd_processed.json. If nothing changed, output HEARTBEAT_OK."
  },
  "failureAlert": {
    "enabled": true,
    "after": 3
  }
}
```

**Runs**: Weekdays 8h–22h, mỗi 15 phút (`:00, :15, :30, :45`)

---

## Job 2: agent_dev — GDD Implementation

```json
{
  "id": "ccn2-dev-workspace-scan",
  "agentId": "agent_dev",
  "name": "CCN2 Dev — Implement from GDDs",
  "description": "Scan ccn2_workspace/design/ mỗi 15 phút để implement code",
  "enabled": true,
  "schedule": {
    "kind": "cron",
    "expr": "7,22,37,52 8-22 * * 1-5",
    "tz": "Asia/Ho_Chi_Minh"
  },
  "sessionTarget": "isolated",
  "payload": {
    "type": "system_event",
    "text": "WORKSPACE_SCAN: Follow HEARTBEAT.md instructions exactly. Check D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace/design/GDD-*.md for new or changed files. For each changed GDD, implement code in ccn2_workspace/src/. Create test skeleton in ccn2_workspace/src/tests/. Update .state/agent_dev_processed.json. If nothing changed, output HEARTBEAT_OK."
  },
  "failureAlert": {
    "enabled": true,
    "after": 3
  }
}
```

**Runs**: Weekdays 8h–22h, offset +7 phút (`:07, :22, :37, :52`)

---

## Job 3: agent_qc — Quality Check

```json
{
  "id": "ccn2-qc-workspace-scan",
  "agentId": "agent_qc",
  "name": "CCN2 QC — Test automation",
  "description": "Scan design/ + src/ mỗi 15 phút để chạy tests và tạo report",
  "enabled": true,
  "schedule": {
    "kind": "cron",
    "expr": "12,27,42,57 8-22 * * 1-5",
    "tz": "Asia/Ho_Chi_Minh"
  },
  "sessionTarget": "isolated",
  "payload": {
    "type": "system_event",
    "text": "WORKSPACE_SCAN: Follow HEARTBEAT.md instructions exactly. Part A: Check ccn2_workspace/design/GDD-*.md for new GDDs -> write testcases to reports/ and src/tests/. Part B: Check ccn2_workspace/src/**/*.js for changes (exclude src/tests/) -> run npm test, create quality report in reports/quality-<datetime>.md. Notify Telegram with results. Update .state/agent_qc_processed.json. If nothing changed, output HEARTBEAT_OK."
  },
  "failureAlert": {
    "enabled": true,
    "after": 2
  }
}
```

**Runs**: Weekdays 8h–22h, offset +12 phút (`:12, :27, :42, :57`)

---

## Job 4: Weekly Digest (Monday 9am)

```json
{
  "id": "ccn2-weekly-digest",
  "agentId": "agent_qc",
  "name": "CCN2 Weekly Quality Digest",
  "description": "Thu 2 9am: tong ket tuan qua",
  "enabled": true,
  "schedule": {
    "kind": "cron",
    "expr": "0 9 * * 1",
    "tz": "Asia/Ho_Chi_Minh"
  },
  "sessionTarget": "isolated",
  "payload": {
    "type": "system_event",
    "text": "WEEKLY_DIGEST: Read all reports/quality-*.md from the past 7 days in D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace/reports/. Summarize: total tests run, pass rate, features implemented, open issues. Post summary to Telegram."
  }
}
```

---

## Timing Overview

```
:00  agent_gd scans concepts/
:07  agent_dev scans design/
:12  agent_qc scans design/ + src/

:15  agent_gd (next cycle)
:22  agent_dev
:27  agent_qc
...
```

Offset giữa các agents đảm bảo GDD được tạo trước khi dev/qc chạy.
