# Runbook: Restart / Reset Agent

## Table of Contents
1. [Reset Full State File](#reset-full-state-file)
2. [Force Reprocess a Single File](#force-reprocess-a-single-file)
3. [Clear Error Log](#clear-error-log)
4. [Reset pipeline-health.json](#reset-pipeline-healthjson)
5. [Reset Dispatch State](#reset-dispatch-state)
6. [Verify After Reset](#verify-after-reset)

---

## Reset Full State File

WARNING: Agent will reprocess ALL files from scratch — including files already `Done`. This may overwrite existing reports. Only use when truly necessary.

    # Example: reset agent_dev
    echo '{}' > ccn2_workspace/.state/agent_dev_processed.json

    # Nuclear option: reset all 6 agents
    echo '{}' > ccn2_workspace/.state/agent_gd_processed.json
    echo '{}' > ccn2_workspace/.state/agent_dev_processed.json
    echo '{}' > ccn2_workspace/.state/agent_qc_processed.json
    echo '{}' > ccn2_workspace/.state/agent_dev_client_processed.json
    echo '{}' > ccn2_workspace/.state/agent_dev_server_processed.json
    echo '{}' > ccn2_workspace/.state/agent_dev_admin_processed.json

---

## Force Reprocess a Single File

Safe — only affects one file, all other state entries unchanged.

Edit `ccn2_workspace/.state/<agent_id>_processed.json`:
Find the file entry, change `"status"` to `"pending"`:

    {
      "elemental-hunter.md": {
        "hash": "a1b2c3d4...",
        "processedAt": "2026-03-19T14:30:00+07:00",
        "status": "pending",
        "notes": ""
      }
    }

---

## Clear Error Log

    # With backup first (recommended)
    cp ccn2_workspace/.state/error.log ccn2_workspace/.state/error.log.bak
    echo '' > ccn2_workspace/.state/error.log

---

## Reset pipeline-health.json

agent_qc will repopulate on next run:

    echo '{"overall":"UNKNOWN","checks":{"C1_concepts":"pending","C2_design":"pending","C3_gdd_header":"pending","C4_src":"pending","C5_quality_report":"pending","C6_state_json":"pending","C7_playtest":"SKIP"},"stuck_gdds":[],"last_updated":""}' > ccn2_workspace/.state/pipeline-health.json

**C7_playtest** default là `"SKIP"` (distribution chưa build). Forge sẽ update thành PASS/FAIL sau khi chạy smoke-test.ps1 -Mode full.

---

## Reset bug-tracker.json

WARNING: Reset sẽ xoá toàn bộ bug history. Chỉ dùng khi toàn bộ bugs đã closed hoặc cần debug.

    echo '{}' > ccn2_workspace/.state/bug-tracker.json

Nếu chỉ muốn reopen 1 bug cụ thể (để retriage):

1. Edit `bug-tracker.json`: set `"status": "open"` cho bug ID đó
2. Codera sẽ tự detect và retriage lần scan sau

---

## Reset Dispatch State

WARNING: Only reset if impl agents have NOT started processing.

**Safety check first** — verify none of the 3 impl agent state files have `"in_progress"` entries:

    grep "in_progress" ccn2_workspace/.state/agent_dev_client_processed.json
    grep "in_progress" ccn2_workspace/.state/agent_dev_server_processed.json
    grep "in_progress" ccn2_workspace/.state/agent_dev_admin_processed.json

If ANY returns output → DO NOT RESET. Wait for that agent to finish first.

If all return nothing → safe to reset:

    echo '{}' > ccn2_workspace/.state/agent_dev_dispatched.json

---

## Verify After Reset

After 1 full cron cycle (15-30 min):

- [ ] `dashboard.html` — "Last updated" timestamp is recent
- [ ] `error.log` — no new error entries from reset agent
- [ ] State file — entries changed from `"pending"` to `"done"` or `"skipped"`
- [ ] `pipeline-health.json` — smoke test verdict updated (not `UNKNOWN`)
- [ ] GDD header — `Trạng thái` progressed if appropriate
