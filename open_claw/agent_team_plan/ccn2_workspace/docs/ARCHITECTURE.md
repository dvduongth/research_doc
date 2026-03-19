# CCN2 Multi-Agent System — Architecture

**Last updated**: 2026-03-19

## Table of Contents
1. [System Overview](#system-overview)
2. [Agent Roles](#agent-roles)
3. [Cron Schedule](#cron-schedule)
4. [Shared State](#shared-state)
5. [GDD Pipeline](#gdd-pipeline)
6. [Implementation Output Paths](#implementation-output-paths)
7. [Bug Flow](#bug-flow)
8. [Playtest Pipeline](#playtest-pipeline)
9. [Error Handling](#error-handling)
10. [Smoke Test](#smoke-test)
11. [Pipeline Watch](#pipeline-watch)
12. [Dashboard](#dashboard)

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
             playtest/client/   playtest/server/   src/admin/
             src/<feature>.js   kotlin/playtest/   <feature>/
                    └────────────────────────────────┘
                                    ↓ (all layers done)
                             GDD → InQC
                                    ↓
                             [agent_qc] → reports/code-review-*.md
                                        → Part F: dashboard.html
                                        → Part G: pipeline-watch-*.md
                                        → Part I: playtest smoke test
                                        → Part J: bug detection + verify

Human spots bug → bugs/BUG-*.md
                    ↓
              [agent_dev] Bug Triage → dispatched.json (type=bugfix)
                    ↓
              [dev agent] Bug Fix → mark fixed
                    ↓
              [agent_qc] Part J Verify → closed ✅ / reopen ⚠️
```

---

## Agent Roles

| Agent ID | Name | Role | Cron | State File |
|----------|------|------|------|------------|
| agent_gd | Designia | GDD evaluation + promotion | every 15min (:00/:30) | agent_gd_processed.json |
| agent_dev | Codera | Feature analysis + dispatch + bug triage | every 15min (:02/:32) | agent_dev_processed.json |
| agent_qc | Verita | Code review + smoke + pipeline watch + bug verify | every 15min (:04/:34) | agent_qc_processed.json |
| agent_dev_client | Pixel | Client layer (vanilla JS → playtest/client/src/) | every 30min (:17/:47) | agent_dev_client_processed.json |
| agent_dev_server | Forge | Server layer (Kotlin → playtest/server/) | every 30min (:19/:49) | agent_dev_server_processed.json |
| agent_dev_admin | Panel | Admin layer (Java+React → src/admin/) | every 30min (:21/:51) | agent_dev_admin_processed.json |

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
| `agent_dev_dispatched.json` | agent_dev | Dispatch status per feature/bugfix: client/server/admin_status |
| `agent_qc_meta.json` | agent_qc | Metadata: code_review + test_gen tracking |
| `pipeline-health.json` | agent_qc | Smoke test results (C1-C7) + stuck_gdds list |
| `bug-tracker.json` | All agents | Central bug registry: status, domain, timestamps |
| `error.log` | All agents (append); agent_qc (rotate) | Error log |
| `SCHEMA.md` | Reference | Full state schema contract — canonical source |

**Schema**: See `SCHEMA.md` for complete entry format, status enum, hash computation, and validation rules.

---

## GDD Pipeline

6 stages — Draft/Review are entry stages; Done/Flagged are terminal states:

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

**GDD Header Fields**:

    **Trạng thái**: Draft | Review | InDev | InQC | Done | Flagged
    **Pipeline agent**: <agent_id who last touched>
    **Cập nhật lần cuối bởi**: <agent_id>
    **Cập nhật lần cuối lúc**: ISO8601+07:00

---

## Implementation Output Paths

**Single Source of Truth** — agents ghi thẳng vào playtest, không qua staging:

| Layer | Output Path | Format | Protected Files |
|-------|-------------|--------|-----------------|
| Server | `playtest/server/src/main/kotlin/playtest/` | Kotlin, `package playtest` | Types.kt, WsMessage.kt, Main.kt, GameRoom.kt, GameRoomManager.kt |
| Client | `playtest/client/src/<feature>.js` | Vanilla JS, global object literal | core/ws-client.js, core/board-renderer.js, core/game-ui.js |
| Admin | `src/admin/<feature>/` | Java Bean + React TSX | — |

**Deprecated** (không dùng nữa):
- `ccn2_workspace/src/server/` — thay bởi `playtest/server/`
- `ccn2_workspace/src/client/` — thay bởi `playtest/client/src/`

**Client module format**:
```javascript
// <feature>.js — <description> — generated by agent_dev_client
var FeatureName = {
  init: function() { ... },
  render: function() { ... }
};
```
Sau khi write file: thêm `<script src="src/<feature>.js">` vào `playtest/client/index.html`.

**Playtest Client Structure**:
```
playtest/client/
├── index.html                 ← loader (HTML + CSS + script tags)   [PROTECTED]
├── core/
│   ├── ws-client.js           ← WebSocket protocol + game state      [PROTECTED]
│   ├── board-renderer.js      ← Canvas 61-tile board                 [PROTECTED]
│   └── game-ui.js             ← Players panel, controls, log         [PROTECTED]
└── src/
    └── <feature>.js           ← agent_dev_client writes here
```

---

## Bug Flow

Bug lifecycle: `open → assigned → in_progress → fixed → verified → closed` (hoặc `reopen`).

**Tạo bug report** (human hoặc agent_qc):
- File: `ccn2_workspace/bugs/BUG-<domain>-<slug>-<YYYY-MM-DD>.md`
- Template: `ccn2_workspace/bugs/BUG-TEMPLATE.md`
- Guide: `docs/RUNBOOK-bugs.md`

**Domain → Agent mapping**:

| Domain | Agent fix |
|--------|-----------|
| `gd` | agent_gd (Designia) — self-scans bugs/, không qua dispatched.json |
| `client` / `playtest-client` | agent_dev_client (Pixel) — via dispatched.json |
| `server` / `playtest-server` | agent_dev_server (Forge) — via dispatched.json |
| `admin` | agent_dev_admin (Panel) — via dispatched.json |

**Triage** (agent_dev/Codera): Sau Phase 4 mỗi WORKSPACE_SCAN, scan `bugs/BUG-*.md`, tạo dispatched.json entry với `type: "bugfix"`.

**Verify** (agent_qc/Verita): Part J — scan bug-tracker.json cho bugs `fixed` → verify → close hoặc reopen.

**Auto-detect** (agent_qc): C7_playtest FAIL → tự tạo `BUG-playtest-server-smoke-*.md` nếu chưa có open bug cùng domain.

---

## Playtest Pipeline

**Playtest server**: Standalone Ktor 3.4.0, port 8181, package `playtest`.

```
playtest/
├── server/         ← Kotlin/Ktor server (single source of truth)
│   ├── build.gradle.kts
│   └── src/main/kotlin/playtest/
├── client/         ← Web client (single source of truth)
│   ├── index.html
│   ├── core/       ← protected infrastructure
│   └── src/        ← agent-generated feature modules
└── scripts/
    ├── smoke-test.ps1  ← -Mode quick (Verita) / full (Forge)
    ├── build.bat
    └── run-smoke.bat
```

**Smoke test modes**:
- `-Mode quick`: dùng distribution đã build sẵn, ~30s, chạy bởi Verita Part I
- `-Mode full`: rebuild từ đầu (gradlew assemble), chạy bởi Forge sau mỗi feature/bugfix

**4 smoke checks**: GET /health → 200 OK, GET /game/rooms → 200, POST /game/rooms/smoke-room → 201, GET rooms verify smoke-room.

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

agent_qc runs 7 checks every cron cycle (Part F). Check keys match pipeline-health.json format:

| Key | Description | BROKEN if fail? |
|-----|-------------|-----------------|
| C1_concepts | concepts/*.md files exist | Yes |
| C2_design | design/GDD-FEATURE-*.md files exist | Yes |
| C3_gdd_header | GDD headers are valid | Yes |
| C4_src | Impl agents have created output dirs | Yes |
| C5_quality_report | Quality report exists in reports/ | **No — exempt** |
| C6_state_json | State JSON files are valid | Yes |
| C7_playtest | Playtest server 4 endpoint checks | **No — SKIP exempt** |

**C7_playtest rules**:
- `PASS` → contributes to HEALTHY
- `FAIL` → DEGRADED (không BROKEN)
- `SKIP` → exempt (distribution chưa build)

**Verdicts**:
- `HEALTHY`: All non-exempt checks pass
- `DEGRADED`: 1-2 checks fail
- `BROKEN`: 3+ checks fail (excluding C5, C7)

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

Sections: Stats bar → GDD status flow → Agent cards (6) → Smoke checks grid (C1-C7) → Bug summary → Recent errors (last 10).

**C7_playtest label**: `"C7_playtest": "Playtest HTTP"` trong CHECK_LABELS.
