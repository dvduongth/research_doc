# Round 4 Spec 4.2 — Documentation & Runbooks Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tạo 6 Markdown docs trong `ccn2_workspace/docs/` — full onboarding documentation cho CCN2 Multi-Agent System.

**Architecture:** Static Markdown files, không generate từ code. Mỗi file độc lập, có TOC ở đầu. Canonical source cho cross-references là SCHEMA.md + GDD-TEMPLATE-FEATURE.md + CRON_SETUP.md.

**Tech Stack:** Markdown only. Không có dependencies.

**Spec:** `specs/2026-03-19-round4-documentation-runbooks.md`

---

## Chunk A: Reference Documentation

### Task 1: Tạo docs/ folder + ARCHITECTURE.md

**Files:**
- Create: `ccn2_workspace/docs/ARCHITECTURE.md`

- [ ] **Step 1: Tạo ARCHITECTURE.md**

Tạo file `ccn2_workspace/docs/ARCHITECTURE.md`:

```markdown
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
| agent_gd | Designia | GDD evaluation + promotion | */15 (offset :00,:30) | agent_gd_processed.json |
| agent_dev | Codera | Feature analysis + dispatch | */15 (offset :02,:32) | agent_dev_processed.json |
| agent_qc | Verita | Code review + smoke test + pipeline watch | */15 (offset :04,:34) | agent_qc_processed.json |
| agent_dev_client | Pixel | Client layer implementation | */30 (offset :17,:47) | agent_dev_client_processed.json |
| agent_dev_server | Forge | Server layer implementation | */30 (offset :19,:49) | agent_dev_server_processed.json |
| agent_dev_admin | Panel | Admin layer implementation | */30 (offset :21,:51) | agent_dev_admin_processed.json |

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
```
**Trạng thái**: Draft | Review | InDev | InQC | Done | Flagged
**Pipeline agent**: <agent_id who last touched>
**Cập nhật lần cuối bởi**: <agent_id>
**Cập nhật lần cuối lúc**: ISO8601+07:00
```

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

agent_qc runs 6 checks every cron cycle (Part F):

| Check | Description | BROKEN if fail? |
|-------|-------------|-----------------|
| C1 | ≥3 agent state files exist in .state/ | Yes |
| C2 | All state files are valid JSON | Yes |
| C3 | GDD files present in design/ | Yes |
| C4 | Impl agents have created src/ subfolders | Yes |
| C5 | Quality report exists in reports/ | **No — exempt** |
| C6 | pipeline-health.json is writable | Yes |

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
```

- [ ] **Step 2: Verify file tồn tại và có TOC**

Đọc lại file — confirm:
- TOC có đủ 9 mục
- Tất cả section headings khớp với TOC
- Table agent roles có đủ 6 rows

---

## Chunk B: How-To Guides

### Task 2: HOWTO-add-agent.md

**Files:**
- Create: `ccn2_workspace/docs/HOWTO-add-agent.md`

- [ ] **Step 1: Tạo HOWTO-add-agent.md**

Tạo file `ccn2_workspace/docs/HOWTO-add-agent.md`:

```markdown
# How To: Add a New Agent

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step 1 — Create Agent Folder](#step-1--create-agent-folder)
3. [Step 2 — Create Identity Files](#step-2--create-identity-files)
4. [Step 3 — AGENTS.md Parts (A-F)](#step-3--agentsmd-parts-a-f)
5. [Step 4 — Register in OpenClaw](#step-4--register-in-openclaw)
6. [Step 5 — Init State File](#step-5--init-state-file)
7. [Step 6 — Create Cron Job](#step-6--create-cron-job)
8. [Step 7 — Verify](#step-7--verify)

---

## Prerequisites

- OpenClaw installed and running
- Access to `openclaw.json` config
- Workspace path: `D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\`

---

## Step 1 — Create Agent Folder

```
openclaw/agents/<agent_id>/
```

Example: `openclaw/agents/agent_analytics/`

---

## Step 2 — Create Identity Files

Create 4 files in the agent folder:

| File | Purpose | Key Content |
|------|---------|-------------|
| `SOUL.md` | Agent identity & personality | Name, role description, working style, signature emoji |
| `USER.md` | Project context | What the agent needs to know about CCN2, workspace paths, key file locations |
| `AGENTS.md` | HEARTBEAT logic | Parts A-F (see Step 3) — what agent does each cron run |
| `HEARTBEAT.md` | Runtime instructions | Hash computation, status enum, change detection, error handling |

**HEARTBEAT.md must include these 4 sections**:
1. `## Hash Computation` — PowerShell → md5sum → pseudo-hash fallback chain
2. `## Status Enum` — pending/processing/done/skipped/error definitions
3. `## Change Detection Logic` — when to reprocess vs skip
4. `## Error Handling` — try/catch pattern, error.log append, exit 0

---

## Step 3 — AGENTS.md Parts (A-F)

Minimum 6 parts required in AGENTS.md:

| Part | Name | Content |
|------|------|---------|
| A | Identity & Role | Who the agent is, what it does, when it runs |
| B | Input Sources | Which files/folders it reads; what triggers processing |
| C | Processing Logic | Step-by-step what it does with each input |
| D | Gate Rules | Conditions to skip (already processed, wrong status, etc.) |
| E | Constraints | What agent must NOT do (no auto-delete, no GDD status change without rules, etc.) |
| F | Output Format | What files it creates/modifies; exact formats |

**Special agents**:
- `agent_qc` also needs **Part F: Smoke Test** (6 checks C1-C6) and **Part G: Pipeline Watch** (48h stuck detection)

---

## Step 4 — Register in OpenClaw

Add entry to `~/.openclaw/openclaw.json`:

```json
{
  "agent_id": "agent_analytics",
  "name": "Analytics Agent",
  "model": "openrouter/<model>",
  "workspace_path": "D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace",
  "heartbeat_path": "D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/openclaw/agents/agent_analytics/HEARTBEAT.md"
}
```

---

## Step 5 — Init State File

```bash
echo '{}' > ccn2_workspace/.state/agent_analytics_processed.json
```

Verify: file exists with content `{}`.

---

## Step 6 — Create Cron Job

Reference: `CRON_SETUP.md` for full syntax and existing jobs.

**Rules**:
- Main agent (reads GDDs): every 15 min, pick unused offset pair
  - Used: :00/:30, :02/:32, :04/:34
  - Available: :06/:36, :08/:38, :10/:40...
- Impl agent (dispatched work): every 30 min
  - Used: :17/:47, :19/:49, :21/:51
  - Available: :23/:53, :25/:55...

**Add entry to CRON_SETUP.md** to track the new job.

---

## Step 7 — Verify

After 1 cron cycle (15-30 min):

- [ ] State file has entries: `ccn2_workspace/.state/agent_analytics_processed.json` not empty `{}`
- [ ] Smoke test C1 passes: agent_qc counts ≥3 state files (your new file added)
- [ ] No errors: `grep "agent_analytics" ccn2_workspace/.state/error.log` returns nothing
- [ ] Dashboard updated: `reports/dashboard.html` shows new agent card
- [ ] HEARTBEAT logic working: check state file entries have correct schema (hash + status)
```

- [ ] **Step 2: Verify TOC và content**

Đọc lại — confirm 8 sections, table Parts A-F có đủ 6 rows.

### Task 3: HOWTO-create-concept.md

**Files:**
- Create: `ccn2_workspace/docs/HOWTO-create-concept.md`

- [ ] **Step 1: Tạo HOWTO-create-concept.md**

Tạo file `ccn2_workspace/docs/HOWTO-create-concept.md`:

```markdown
# How To: Create a New Concept (Idea → Production)

## Table of Contents
1. [Overview](#overview)
2. [Step 1 — Create Concept File](#step-1--create-concept-file)
3. [Step 2 — agent_gd Evaluation](#step-2--agent_gd-evaluation)
4. [Step 3 — agent_dev Analysis](#step-3--agent_dev-analysis)
5. [Step 4 — Implementation (3 Layers)](#step-4--implementation-3-layers)
6. [Step 5 — QC Review](#step-5--qc-review)
7. [When GDD is Flagged](#when-gdd-is-flagged)

---

## Overview

```
Human creates concept → agent_gd evaluates → agent_dev designs →
impl agents build → agent_qc reviews → Done ✅ or Flagged ⚠️
```

Total time (fully automated): 2-4 cron cycles (~30 min to several hours depending on LLM speed).

---

## Step 1 — Create Concept File

**Where**: `ccn2_workspace/concepts/<feature-name>.md`

**Example**: `ccn2_workspace/concepts/elemental-hunter.md`

**Format**: GDD Overview format. Reference example: `ccn2_workspace/concepts/GDD_Overview_v2_ElementalHunter.md`

**Minimum required content**:
- Title
- Description (what is this feature?)
- Core mechanics (how does it work in game?)
- Win/success conditions
- Key interactions with existing systems

After creating the file, agent_gd will pick it up in the next cron cycle (≤15 min).

---

## Step 2 — agent_gd Evaluation

**Automatic** — no human action needed.

agent_gd creates: `ccn2_workspace/eval/GDD-EVAL-<name>-YYYY-MM-DD.md`

**Scoring rubric** (100 points, 6 criteria — source: `ccn2_workspace/eval/GDD-EVAL-RUBRIC.md`):
| Criterion | Points |
|-----------|--------|
| Đầy đủ (Completeness) | 25 |
| Cụ thể (Specificity) | 25 |
| Khả năng triển khai (Feasibility) | 20 |
| Trường hợp ngoại lệ (Edge cases) | 15 |
| Kịch bản kiểm thử (Test scenarios) | 10 |
| Chỉ số đánh giá (Metrics) | 5 |

**3 outcome tiers**:
| Score | Outcome | Next action |
|-------|---------|-------------|
| < 50 | Rejected — no GDD file created | Revise concept significantly → Step 1 |
| 50–69 | Draft — eval file saved, no promotion | Improve concept based on eval → Step 1 |
| ≥ 70 | Promoted → `design/GDD-FEATURE-<name>.md` (status=Review) | Wait for Step 3 |

---

## Step 3 — agent_dev Analysis

**Automatic** — triggers when GDD status = Review.

agent_dev creates:
- `ccn2_workspace/analysis/REQ-<name>.md` — requirements analysis
- `ccn2_workspace/analysis/DESIGN-<name>.md` — technical design

GDD header updated: `Trạng thái → InDev`, `Cập nhật lần cuối lúc → now`

agent_dev also populates `ccn2_workspace/.state/agent_dev_dispatched.json`:
```json
{
  "<feature-name>": {
    "dispatched_at": "ISO8601",
    "client_status": "pending",
    "server_status": "pending",
    "admin_status": "pending"
  }
}
```

---

## Step 4 — Implementation (3 Layers)

**Automatic** — impl agents pick up dispatched features.

Each agent works independently:
- `agent_dev_client` → `ccn2_workspace/src/<name>/client/`
- `agent_dev_server` → `ccn2_workspace/src/<name>/server/`
- `agent_dev_admin` → `ccn2_workspace/src/<name>/admin/`

When all 3 layers have `status: "done"` in dispatched.json:
- agent_dev detects completion → GDD `Trạng thái → InQC`

---

## Step 5 — QC Review

**Automatic** — triggers when GDD status = InQC.

agent_qc creates: `ccn2_workspace/reports/code-review-<name>-YYYY-MM-DD.md`

**Outcomes**:
| Result | GDD Status | Meaning |
|--------|------------|---------|
| Pass | Done ✅ | Feature complete, pipeline closed |
| Fail | Flagged ⚠️ | Human review required |

---

## When GDD is Flagged

`Flagged ≠ Done`. agent_qc will NOT auto-retry.

**Human action required**:
1. Read `reports/code-review-<name>-*.md` to understand failures
2. Fix issues:
   - Code issues → fix files in `src/<name>/`
   - Design issues → revise `design/GDD-FEATURE-<name>.md`
3. Reset GDD to trigger reprocessing:
   - For code fixes: set GDD `Trạng thái → InQC`, reset state entry
   - For design fixes: set GDD `Trạng thái → InDev`, reset dispatched.json entry
   - See `RUNBOOK-restart-agent.md` for exact commands
```

- [ ] **Step 2: Verify TOC và scoring table**

Đọc lại — confirm: 3-tier scoring table đúng (<50/50-69/≥70), 5 steps, Flagged section có hướng dẫn.

---

## Chunk C: Runbooks

### Task 4: RUNBOOK-stuck-pipeline.md

**Files:**
- Create: `ccn2_workspace/docs/RUNBOOK-stuck-pipeline.md`

- [ ] **Step 1: Tạo RUNBOOK-stuck-pipeline.md**

Tạo file `ccn2_workspace/docs/RUNBOOK-stuck-pipeline.md`:

```markdown
# Runbook: Stuck Pipeline

## Table of Contents
1. [Symptom](#symptom)
2. [Case A — Stuck in InDev](#case-a--stuck-in-indev)
3. [Case B — Stuck in InQC](#case-b--stuck-in-inqc)
4. [Case C — Manual Override](#case-c--manual-override)

---

## Symptom

GDD stays in `InDev` or `InQC` for more than 48 hours without progress.

**Signals**:
- Telegram alert: `⏰ [Pipeline Watch] GDD <name> stuck in <status> for <N>h`
- Report file: `ccn2_workspace/reports/pipeline-watch-YYYY-MM-DD-HH-mm.md`
- Dashboard: stuck GDD count > 0 in stats bar

---

## Case A — Stuck in InDev

InDev means agent_dev should be analyzing + dispatching. If stuck:

**Step 1**: Check dispatch file
```
ccn2_workspace/.state/agent_dev_dispatched.json
```
- Empty `{}`? → agent_dev has not processed this GDD
- Feature entry missing? → Same as above
- Feature entry present but client/server/admin_status = "pending"? → Impl agents haven't started

**Step 2**: Check agent_dev state
```
ccn2_workspace/.state/agent_dev_processed.json
```
→ Find the GDD entry. Is `status: "error"`? → See RUNBOOK-agent-errors.md

**Step 3**: Check error log
```
grep "agent_dev" ccn2_workspace/.state/error.log
```
→ Recent error entries? → See RUNBOOK-agent-errors.md for fix

**Step 4**: If no errors but dispatch still empty
→ Check if analysis files exist:
  `ccn2_workspace/analysis/REQ-<name>.md`
  `ccn2_workspace/analysis/DESIGN-<name>.md`
→ If missing: agent_dev hasn't run analysis yet. Force reprocess (Case C).

---

## Case B — Stuck in InQC

InQC means agent_qc should be reviewing. If stuck:

**Step 1**: Check for review report
```
ccn2_workspace/reports/code-review-<feature-name>-*.md
```
→ File exists? → agent_qc completed review but failed to update GDD header (crash between write + update)
→ File missing? → agent_qc has not processed this GDD

**Step 2**: Check agent_qc state
```
ccn2_workspace/.state/agent_qc_processed.json
```
→ Entry for feature with `status: "error"`? → See RUNBOOK-agent-errors.md

**Step 3**: Check error log
```
grep "agent_qc" ccn2_workspace/.state/error.log
```

**Step 4**: If review report exists but GDD not updated
→ Review report is the ground truth. Manually apply the verdict (Case C).

---

## Case C — Manual Override

Use when automated recovery is not working. All edits are human-initiated.

**Edit GDD header** (`ccn2_workspace/design/GDD-FEATURE-<name>.md`):

To re-trigger agent_dev (go back to InDev):
```
**Trạng thái**: InDev
**Cập nhật lần cuối bởi**: human
**Cập nhật lần cuối lúc**: <now in ISO8601+07:00>
```

To re-trigger agent_qc (stay in InQC):
```
**Trạng thái**: InQC
**Cập nhật lần cuối bởi**: human
**Cập nhật lần cuối lúc**: <now in ISO8601+07:00>
```

Note: Updating "Cập nhật lần cuối lúc" resets the 48h stuck-detection clock.

**Reset state entry** for the relevant agent:
See `RUNBOOK-restart-agent.md` → "Force reprocess a single file"
```

- [ ] **Step 2: Verify Cases A/B/C có đủ file paths**

Đọc lại — confirm mỗi case có ít nhất 1 file path cụ thể và 1 grep command.

### Task 5: RUNBOOK-agent-errors.md

**Files:**
- Create: `ccn2_workspace/docs/RUNBOOK-agent-errors.md`

- [ ] **Step 1: Tạo RUNBOOK-agent-errors.md**

Tạo file `ccn2_workspace/docs/RUNBOOK-agent-errors.md`:

```markdown
# Runbook: Agent Errors

## Table of Contents
1. [Reading the Error Log](#reading-the-error-log)
2. [Common Errors](#common-errors)
3. [Recovery Flow](#recovery-flow)

---

## Reading the Error Log

```bash
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
```

**Log format**:
```
[ISO8601+07:00] <agent_id> | file=<filename> | error=<ErrorType>: <message>
```

---

## Common Errors

| Error | Root Cause | Fix |
|-------|------------|-----|
| `JSONParseError` | State file truncated during concurrent write | Reset state file → see RUNBOOK-restart-agent.md |
| `FileNotFound: .state/<agent>_processed.json` | State file deleted or never created | `echo '{}' > ccn2_workspace/.state/<agent>_processed.json` |
| `HashComputeError` | PowerShell/md5sum not on PATH | Verify PATH; hash fallback should auto-activate (SIZE<N>-HEAD<chars>) — check HEARTBEAT.md Hash Computation section |
| `PermissionDenied` | File locked by another process | Wait 1 cron cycle (15-30 min); natural retry will succeed |
| `HeaderParseError` | GDD header field missing or malformed | Fix GDD file — compare against `ccn2_workspace/design/GDD-TEMPLATE-FEATURE.md` |
| `TimeoutError` | LLM response timeout | OpenClaw auto-retries after N consecutive failures; check agent SOUL.md for timeout config |

---

## Recovery Flow

When a state entry has `status: "error"`:

1. Read error message from state entry `notes` field OR `error.log`
2. Apply fix from table above
3. Set state entry back to `pending`:
   - Edit `ccn2_workspace/.state/<agent>_processed.json`
   - Find the file entry, change `"status": "error"` → `"status": "pending"`
4. Wait for next cron cycle (15-30 min)
5. Verify: check state entry status changed to `"done"` or `"skipped"`
6. If error persists: check `error.log` for new entry with same file
```

- [ ] **Step 2: Verify error table có 6 rows và grep commands**

### Task 6: RUNBOOK-restart-agent.md

**Files:**
- Create: `ccn2_workspace/docs/RUNBOOK-restart-agent.md`

- [ ] **Step 1: Tạo RUNBOOK-restart-agent.md**

Tạo file `ccn2_workspace/docs/RUNBOOK-restart-agent.md`:

```markdown
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

⚠️ **WARNING**: Agent will reprocess ALL files from scratch — including files already `Done`.
This may overwrite existing reports. Only use when truly necessary.

```bash
# Reset agent_dev (example)
echo '{}' > ccn2_workspace/.state/agent_dev_processed.json

# Reset all 6 agents (nuclear option)
echo '{}' > ccn2_workspace/.state/agent_gd_processed.json
echo '{}' > ccn2_workspace/.state/agent_dev_processed.json
echo '{}' > ccn2_workspace/.state/agent_qc_processed.json
echo '{}' > ccn2_workspace/.state/agent_dev_client_processed.json
echo '{}' > ccn2_workspace/.state/agent_dev_server_processed.json
echo '{}' > ccn2_workspace/.state/agent_dev_admin_processed.json
```

---

## Force Reprocess a Single File

✅ **Safe** — only affects the one file, all other state entries unchanged.

Edit `ccn2_workspace/.state/<agent_id>_processed.json`:

Find the entry for the file you want to reprocess, change `status` to `"pending"`:

```json
{
  "elemental-hunter.md": {
    "hash": "a1b2c3d4...",
    "processedAt": "2026-03-19T14:30:00+07:00",
    "status": "pending",
    "notes": ""
  }
}
```

The agent will detect hash mismatch (or pending status) and reprocess on next cron run.

---

## Clear Error Log

```bash
echo '' > ccn2_workspace/.state/error.log
```

Or to keep a backup first:
```bash
cp ccn2_workspace/.state/error.log ccn2_workspace/.state/error.log.bak
echo '' > ccn2_workspace/.state/error.log
```

---

## Reset pipeline-health.json

```bash
echo '{"overall": "UNKNOWN", "checks": {"C1":"pending","C2":"pending","C3":"pending","C4":"pending","C5":"pending","C6":"pending"}, "stuck_gdds": [], "last_updated": ""}' > ccn2_workspace/.state/pipeline-health.json
```

agent_qc will repopulate on next run.

---

## Reset Dispatch State

⚠️ **WARNING**: Only reset if impl agents have NOT started processing dispatched work.

**Safety check before resetting** — verify none of the 3 impl agent state files have `status: "in_progress"` entries:

```bash
# Check each impl agent state file
grep "in_progress" ccn2_workspace/.state/agent_dev_client_processed.json
grep "in_progress" ccn2_workspace/.state/agent_dev_server_processed.json
grep "in_progress" ccn2_workspace/.state/agent_dev_admin_processed.json
```

If ANY command returns output → **DO NOT RESET**. Wait for that agent to complete (status → "done" or "error").

If all commands return nothing → safe to reset:

```bash
echo '{}' > ccn2_workspace/.state/agent_dev_dispatched.json
```

---

## Verify After Reset

After any reset, wait 1 full cron cycle (15-30 min for main agents, up to 30 min for impl agents), then verify:

- [ ] `dashboard.html` — check "Last updated" timestamp is recent
- [ ] `error.log` — no new error entries from the reset agent
- [ ] State file — entries changed from `"pending"` to `"done"` or `"skipped"`
- [ ] `pipeline-health.json` — smoke test verdict updated (not `UNKNOWN`)
- [ ] GDD header — `Trạng thái` progressed if appropriate
```

- [ ] **Step 2: Verify safety warnings và file paths**

Đọc lại — confirm: ⚠️ warnings trên reset full + dispatched.json reset, safety check steps có grep commands.

---

## Chunk D: Final Verification

### Task 7: Verify toàn bộ docs folder

- [ ] **Step 1: List docs/ folder**

Verify `ccn2_workspace/docs/` có đủ 6 files:
- `ARCHITECTURE.md`
- `HOWTO-add-agent.md`
- `HOWTO-create-concept.md`
- `RUNBOOK-stuck-pipeline.md`
- `RUNBOOK-agent-errors.md`
- `RUNBOOK-restart-agent.md`

- [ ] **Step 2: Verify mỗi file có TOC**

Đọc heading đầu mỗi file — confirm có "## Table of Contents" section.

- [ ] **Step 3: Verify cross-references**

Check các cross-references:
- RUNBOOK-stuck-pipeline.md → RUNBOOK-agent-errors.md ✓
- RUNBOOK-stuck-pipeline.md → RUNBOOK-restart-agent.md ✓
- HOWTO-create-concept.md → RUNBOOK-restart-agent.md ✓
- ARCHITECTURE.md → SCHEMA.md, CRON_SETUP.md, GDD-TEMPLATE-FEATURE.md ✓

- [ ] **Step 4: Tạo progress file**

Tạo `plans/round4-spec42-progress.md`:

```markdown
# Round 4 Spec 4.2 — Progress

## Status: IN PROGRESS
Date started: 2026-03-19

## Deliverables
- [ ] D1: ccn2_workspace/docs/ARCHITECTURE.md
- [ ] D2: ccn2_workspace/docs/HOWTO-add-agent.md
- [ ] D3: ccn2_workspace/docs/HOWTO-create-concept.md
- [ ] D4: ccn2_workspace/docs/RUNBOOK-stuck-pipeline.md
- [ ] D5: ccn2_workspace/docs/RUNBOOK-agent-errors.md
- [ ] D6: ccn2_workspace/docs/RUNBOOK-restart-agent.md

## Verification Checklist
- [ ] All 6 files exist in ccn2_workspace/docs/
- [ ] All 6 files have TOC section
- [ ] ARCHITECTURE.md has all 9 sections
- [ ] HOWTO-add-agent.md has Parts A-F table
- [ ] HOWTO-create-concept.md has 3-tier scoring table
- [ ] RUNBOOK-stuck-pipeline.md has Cases A/B/C with file paths
- [ ] RUNBOOK-agent-errors.md has 6-error table
- [ ] RUNBOOK-restart-agent.md has safety warnings on destructive operations
- [ ] Cross-references between runbooks are correct
```
