# CCN2 Multi-Agent System — Architecture

## Table of Contents
1. [System Overview](#system-overview)
2. [Agent Roles](#agent-roles)
3. [Cron Schedule](#cron-schedule)
4. [Shared State](#shared-state)
5. [GDD Pipeline](#gdd-pipeline)
6. [Error Handling](#error-handling)
7. [Smoke Test](#smoke-test)
8. [Pipeline Watch](#pipeline-watch)
9. [Dashboard](#dashboard)

---

## System Overview

```
concepts/          → [agent_gd] → eval/
                                 ↓ (score ≥ 70)
                               design/GDD-FEATURE-*.md (status=Review)
                                 ↓
                             [agent_dev] → analysis/REQ-*.md + DESIGN-*.md
                                         → agent_dev_dispatched.json
                                         ↓
                    ┌────────────────────────────────┐
                    ↓                ↓               ↓
             [agent_dev_client] [agent_dev_server] [agent_dev_admin]
             src/<feature>/     src/<feature>/     src/<feature>/
                    └────────────────────────────────┘
                                    ↓ (all layers done)
                             GDD → InQC
                                    ↓
                             [agent_qc] → reports/code-review-*.md
                                        → dashboard.html (Part F)
                                        → pipeline-watch-*.md (Part G)
```

---

## Agent Roles

| Agent ID | Name | Role | Cron | State File |
|----------|------|------|------|------------|
| agent_gd | Designia | GDD evaluation + promotion | every 15min (offset :00,:30) | agent_gd_processed.json |
| agent_dev | Codera | Feature analysis + dispatch | every 15min (offset :02,:32) | agent_dev_processed.json |
| agent_qc | Verita | Code review + smoke test + pipeline watch | every 15min (offset :04,:34) | agent_qc_processed.json |
| agent_dev_client | Pixel | Client layer implementation | every 30min (offset :17,:47) | agent_dev_client_processed.json |
| agent_dev_server | Forge | Server layer implementation | every 30min (offset :19,:49) | agent_dev_server_processed.json |
| agent_dev_admin | Panel | Admin layer implementation | every 30min (offset :21,:51) | agent_dev_admin_processed.json |

---

## Cron Schedule

- **Main agents** (gd/dev/qc): every 15 minutes, staggered 2-min offsets
- **Impl agents** (client/server/admin): every 30 minutes, staggered 2-min offsets
- **Stagger rationale**: Prevents race conditions on shared `.state/` files
- **Full config**: See `CRON_SETUP.md` for complete job definitions

---

## Shared State

All state files live in `ccn2_workspace/.state/`:

| File | Owner | Purpose |
|------|-------|---------|
| `agent_gd_processed.json` | agent_gd | Tracks processed concept files + hash |
| `agent_dev_processed.json` | agent_dev | Tracks processed GDD files + hash |
| `agent_qc_processed.json` | agent_qc | Tracks reviewed features + hash |
| `agent_dev_client_processed.json` | agent_dev_client | Tracks dispatched features (client layer) |
| `agent_dev_server_processed.json` | agent_dev_server | Tracks dispatched features (server layer) |
| `agent_dev_admin_processed.json` | agent_dev_admin | Tracks dispatched features (admin layer) |
| `agent_dev_dispatched.json` | agent_dev | Dispatch status per feature: client/server/admin_status |
| `agent_qc_meta.json` | agent_qc | Metadata: code_review + test_gen tracking (separate from file tracking) |
| `pipeline-health.json` | agent_qc | Smoke test results (C1-C6) + stuck_gdds list |
| `error.log` | All agents (append); agent_qc (rotate) | Error log — see Error Handling section |
| `SCHEMA.md` | Reference | Full state schema contract — canonical source |

**Schema**: See `SCHEMA.md` for complete entry format, status enum, hash computation, and validation rules.

---

## GDD Pipeline

6 stages — Draft/Review are entry stages; Done/Flagged are separate terminal states:

```
Draft → Review → InDev → InQC → Done ✅
                               ↘ Flagged ⚠️ (human required)
```

| Stage | Meaning | Who Sets | Gate Rule |
|-------|---------|----------|-----------|
| Draft | Concept created, not yet evaluated | Human | — |
| Review | Evaluated score ≥ 70/100 | agent_gd | Score ≥ 70 |
| InDev | Analysis done, impl dispatched | agent_dev | GDD status = Review |
| InQC | All 3 impl layers completed | agent_dev | client + server + admin = done |
| Done | QC review passed | agent_qc | GDD status = InQC |
| Flagged | QC review failed, human action needed | agent_qc | GDD status = InQC |

**GDD Header Fields** (canonical source: `ccn2_workspace/design/GDD-TEMPLATE-FEATURE.md`):

    **Trạng thái**: Draft | Review | InDev | InQC | Done | Flagged
    **Pipeline agent**: <agent_id who last touched>
    **Cập nhật lần cuối bởi**: <agent_id>
    **Cập nhật lần cuối lúc**: ISO8601+07:00

---

## Error Handling

**Approach**: Log & Skip — each agent wraps HEARTBEAT logic in try/catch.

| Component | Detail |
|-----------|--------|
| Error log path | `ccn2_workspace/.state/error.log` |
| Format | `[ISO8601+07:00] <agent_id> \| file=<filename> \| error=<Type>: <msg>` |
| Rotation | Max 500 lines; agent_qc keeps 400 newest (sole rotator) |
| State on error | `status: "error"`, `notes: "<ErrorType>: <message>"` |
| Cron exit | Always 0 — avoids OpenClaw retry storm |

**Recovery**: Fix root cause → set state entry `status: "pending"` → wait next cron cycle.

---

## Smoke Test

agent_qc runs 6 checks every cron cycle (Part F). Check keys match pipeline-health.json format:

| Key | Description | BROKEN if fail? |
|-----|-------------|-----------------|
| C1_concepts | concepts/*.md files exist | Yes |
| C2_design | design/GDD-FEATURE-*.md files exist | Yes |
| C3_gdd_header | GDD headers are valid | Yes |
| C4_src | Impl agents have created src/ subfolders | Yes |
| C5_quality_report | Quality report exists in reports/ | **No — exempt** |
| C6_state_json | State JSON files are valid | Yes |

**Verdicts**:
- `HEALTHY`: All checks pass
- `DEGRADED`: 1-2 checks fail (or only C5 fails)
- `BROKEN`: 3+ checks fail (excluding C5)

Results stored in `ccn2_workspace/.state/pipeline-health.json`.

---

## Pipeline Watch

agent_qc Part G — runs after Smoke Test each cycle:

- Scans `design/GDD-FEATURE-*.md` for GDDs stuck in InDev/InQC > 48h
- "48h" measured from GDD header field **"Cập nhật lần cuối lúc"**
- If stuck found: creates `reports/pipeline-watch-YYYY-MM-DD-HH-mm.md` + Telegram alert
- Alert format: `⏰ [Pipeline Watch] GDD <name> stuck in <status> for <N>h`
- Max 14 pipeline-watch reports retained (rolling 2 weeks)
- Silent if no GDDs stuck

---

## Dashboard

| Property | Value |
|----------|-------|
| Path | `ccn2_workspace/reports/dashboard.html` |
| Generated by | agent_qc (end of Part F) |
| Update frequency | Every agent_qc cron run (≈15 min) |
| Data model | Snapshot at last agent_qc run (not real-time) |
| Auto-refresh | Browser reloads file every 15 min from disk |
| Stale indicator | Header shows "Last updated: HH:mm" |

Sections: Stats bar → GDD status flow → Agent cards (6) → Smoke checks grid → Recent errors (last 10).
