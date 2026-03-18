# Cron Jobs Setup — CCN2 Agent Team

> **Status**: Jobs 1-3 ✅ ACTIVE | Jobs 5-7 ⬜ TODO (thêm thủ công vào OpenClaw UI)
> **Created**: 2026-03-18 | **Updated**: 2026-03-18 (thêm 3 implementation agents)

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

## Job 5: agent_dev_client — Client Implementation

```json
{
  "id": "ccn2-dev-client-workspace-scan",
  "agentId": "agent_dev_client",
  "name": "CCN2 Dev Client — Implement TypeScript/Cocos2d",
  "description": "Scan dispatched.json mỗi 30 phút để implement client layer",
  "enabled": true,
  "schedule": {
    "kind": "cron",
    "expr": "17,47 8-22 * * 1-5",
    "tz": "Asia/Ho_Chi_Minh"
  },
  "sessionTarget": "isolated",
  "payload": {
    "type": "system_event",
    "text": "WORKSPACE_SCAN: Follow HEARTBEAT.md instructions exactly. Read D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace/.state/agent_dev_dispatched.json. For each feature WHERE client_status='dispatched': read analysis/REQ-<name>.md + analysis/DESIGN-<name>.md, implement TypeScript/Cocos2d code in src/client/<name>/, write self-eval to eval/CODE-EVAL-client-<name>-<date>.md, update dispatched.json client_status='done'. If nothing to do, output HEARTBEAT_OK."
  },
  "failureAlert": {
    "enabled": true,
    "after": 3
  }
}
```

**Runs**: Weekdays 8h–22h, mỗi 30 phút (`:17, :47`) — sau khi GD→Dev→QC cycle hoàn chỉnh

---

## Job 6: agent_dev_server — Server Implementation

```json
{
  "id": "ccn2-dev-server-workspace-scan",
  "agentId": "agent_dev_server",
  "name": "CCN2 Dev Server — Implement Kotlin/Ktor",
  "description": "Scan dispatched.json mỗi 30 phút để implement server layer",
  "enabled": true,
  "schedule": {
    "kind": "cron",
    "expr": "19,49 8-22 * * 1-5",
    "tz": "Asia/Ho_Chi_Minh"
  },
  "sessionTarget": "isolated",
  "payload": {
    "type": "system_event",
    "text": "WORKSPACE_SCAN: Follow HEARTBEAT.md instructions exactly. Read D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace/.state/agent_dev_dispatched.json. For each feature WHERE server_status='dispatched': read analysis/REQ-<name>.md + analysis/DESIGN-<name>.md, implement Kotlin/Ktor/Actor code in src/server/<name>/, write self-eval to eval/CODE-EVAL-server-<name>-<date>.md, update dispatched.json server_status='done'. If nothing to do, output HEARTBEAT_OK."
  },
  "failureAlert": {
    "enabled": true,
    "after": 3
  }
}
```

**Runs**: Weekdays 8h–22h, mỗi 30 phút (`:19, :49`) — offset +2 so với agent_dev_client

---

## Job 7: agent_dev_admin — Admin Implementation

```json
{
  "id": "ccn2-dev-admin-workspace-scan",
  "agentId": "agent_dev_admin",
  "name": "CCN2 Dev Admin — Implement Java+React/REST",
  "description": "Scan dispatched.json mỗi 30 phút để implement admin layer",
  "enabled": true,
  "schedule": {
    "kind": "cron",
    "expr": "21,51 8-22 * * 1-5",
    "tz": "Asia/Ho_Chi_Minh"
  },
  "sessionTarget": "isolated",
  "payload": {
    "type": "system_event",
    "text": "WORKSPACE_SCAN: Follow HEARTBEAT.md instructions exactly. Read D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace/.state/agent_dev_dispatched.json. For each feature WHERE admin_status='dispatched': read analysis/REQ-<name>.md + analysis/DESIGN-<name>.md, implement Java+React/REST code in src/admin/<name>/, write self-eval to eval/CODE-EVAL-admin-<name>-<date>.md, update dispatched.json admin_status='done'. If nothing to do, output HEARTBEAT_OK."
  },
  "failureAlert": {
    "enabled": true,
    "after": 3
  }
}
```

**Runs**: Weekdays 8h–22h, mỗi 30 phút (`:21, :51`) — offset +2 so với agent_dev_server

---

## Timing Overview

```
Cycle 15 phút (main agents):
:00  agent_gd       — scan concepts/ → tạo GDD
:07  agent_dev      — scan design/ → dispatch cho 3 implementation agents
:12  agent_qc       — scan design/ + src/ → test + code review

Cycle 30 phút (implementation agents):
:17  agent_dev_client  — scan dispatched.json → implement TypeScript/Cocos2d
:19  agent_dev_server  — scan dispatched.json → implement Kotlin/Ktor
:21  agent_dev_admin   — scan dispatched.json → implement Java+React

:32  (next GD cycle)
...

Mon 9am:
agent_qc — weekly digest
```

**Thiết kế offset:**
- Main agents chạy mỗi 15 phút, staggered đảm bảo GDD → Code → QC theo thứ tự
- Implementation agents chạy mỗi 30 phút, bắt đầu sau :12 (khi QC xong cycle đầu)
- 3 implementation agents cách nhau 2 phút để tránh race condition trên dispatched.json
