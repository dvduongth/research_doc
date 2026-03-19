# Runbook: Agent Errors

## Table of Contents
1. [Reading the Error Log](#reading-the-error-log)
2. [Common Errors](#common-errors)
3. [Recovery Flow](#recovery-flow)

---

## Reading the Error Log

    # View last 20 errors
    tail -20 ccn2_workspace/.state/error.log

    # Filter by agent
    grep "agent_dev" ccn2_workspace/.state/error.log

    # Filter by feature file
    grep "elemental-hunter" ccn2_workspace/.state/error.log

    # Filter by error type
    grep "JSONParseError" ccn2_workspace/.state/error.log

    # Count errors per agent
    grep -o "agent_[a-z_]*" ccn2_workspace/.state/error.log | sort | uniq -c

**Log format**:

    [ISO8601+07:00] <agent_id> | file=<filename> | error=<ErrorType>: <message>

---

## Common Errors

| Error | Root Cause | Fix |
|-------|------------|-----|
| `JSONParseError` | State file truncated during concurrent write | Reset state file → RUNBOOK-restart-agent.md |
| `FileNotFound: .state/<agent>_processed.json` | State file deleted or never created | `echo '{}' > ccn2_workspace/.state/<agent>_processed.json` |
| `HashComputeError` | PowerShell/md5sum not on PATH | Verify PATH; fallback (SIZE<N>-HEAD<chars>) should auto-activate — see HEARTBEAT.md |
| `PermissionDenied` | File locked by another process | Wait 1 cron cycle (15-30 min); natural retry |
| `HeaderParseError` | GDD header field missing or malformed | Fix GDD vs `ccn2_workspace/design/GDD-TEMPLATE-FEATURE.md` |
| `TimeoutError` | LLM response timeout | OpenClaw auto-retries after N failures; check SOUL.md timeout config |

---

## Recovery Flow

When a state entry has `status: "error"`:

1. Read error from state entry `notes` field OR `error.log`
2. Apply fix from table above
3. Set state entry back to `"pending"`:
   - Edit `ccn2_workspace/.state/<agent>_processed.json`
   - Change `"status": "error"` → `"status": "pending"`
4. Wait for next cron cycle (15-30 min)
5. Verify: status changed to `"done"` or `"skipped"`
6. If error persists: check `error.log` for new entry with same file
