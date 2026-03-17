# .state/ — Agent State Files

Each agent maintains its own state file. DO NOT edit manually.

## Files
| File | Owner | Purpose |
|------|-------|---------|
| `agent_gd_processed.json` | agent_gd | Hash map of processed concepts/ files |
| `agent_dev_processed.json` | agent_dev | Hash map of processed design/GDD-*.md files |
| `agent_qc_processed.json` | agent_qc | Hash map of processed design/ + src/ files |
| `metrics.json` | agent_qc | Daily metrics (tests run, pass rate, features) |
| `errors.log` | Any agent | Error log (agent skips file and logs here) |

## State File Format
```json
{
  "D:/workspace/CCN2/ccn2_workspace/concepts/ladder-mechanic.md": {
    "hash": "A1B2C3D4E5F6...",
    "processedAt": "2026-03-18T09:15:00.000Z"
  }
}
```

## Reset
To force re-processing all files: delete the relevant `.json` file.
Agent will re-initialize to `{}` on next run.
