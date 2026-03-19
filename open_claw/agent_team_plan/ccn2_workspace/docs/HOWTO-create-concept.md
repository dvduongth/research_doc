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

    Human creates concept → agent_gd evaluates → agent_dev designs →
    impl agents build → agent_qc reviews → Done ✅ or Flagged ⚠️

Total time (automated): 2-4 cron cycles (~30 min to several hours).

---

## Step 1 — Create Concept File

**Where**: `ccn2_workspace/concepts/<feature-name>.md`

**Reference example**: `ccn2_workspace/concepts/GDD_Overview_v2_ElementalHunter.md`

**Minimum required content**:
- Title
- Description (what is this feature?)
- Core mechanics (how does it work in game?)
- Win/success conditions
- Key interactions with existing systems

agent_gd picks up in next cron cycle (≤15 min).

---

## Step 2 — agent_gd Evaluation

**Automatic** — no human action needed.

agent_gd creates: `ccn2_workspace/eval/GDD-EVAL-<name>-YYYY-MM-DD.md`

**Scoring rubric** (100 points — source: `ccn2_workspace/eval/GDD-EVAL-RUBRIC.md`):

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
| 50–69 | Draft — eval saved, no promotion | Improve concept based on eval → Step 1 |
| ≥ 70 | Promoted → `design/GDD-FEATURE-<name>.md` (status=Review) | Wait for Step 3 |

---

## Step 3 — agent_dev Analysis

**Automatic** — triggers when GDD status = Review.

agent_dev creates:
- `ccn2_workspace/analysis/REQ-<name>.md` — requirements
- `ccn2_workspace/analysis/DESIGN-<name>.md` — technical design

GDD header: `Trạng thái → InDev`, `Cập nhật lần cuối lúc → now`

agent_dev populates `ccn2_workspace/.state/agent_dev_dispatched.json`:

    {
      "<feature-name>": {
        "dispatched_at": "ISO8601",
        "client_status": "pending",
        "server_status": "pending",
        "admin_status": "pending"
      }
    }

---

## Step 4 — Implementation (3 Layers)

**Automatic** — impl agents pick up dispatched features.

| Layer | Agent | Output Path | Format |
|-------|-------|-------------|--------|
| Client | agent_dev_client (Pixel) | `playtest/client/src/<feature>.js` | Vanilla JS, global object literal |
| Server | agent_dev_server (Forge) | `playtest/server/src/main/kotlin/playtest/` | Kotlin, `package playtest` |
| Admin | agent_dev_admin (Panel) | `ccn2_workspace/src/admin/<feature>/` | Java Bean + React TSX |

**Playtest = Single Source of Truth**: Client và Server agents ghi trực tiếp vào `playtest/` — đây là code chạy được, không phải staging.

When all 3 layers done → agent_dev detects → GDD `Trạng thái → InQC`

---

## Step 5 — QC Review

**Automatic** — triggers when GDD status = InQC.

agent_qc creates: `ccn2_workspace/reports/code-review-<name>-YYYY-MM-DD.md`

| Result | GDD Status | Meaning |
|--------|------------|---------|
| Pass | Done ✅ | Feature complete |
| Fail | Flagged ⚠️ | Human review required |

---

## When GDD is Flagged

`Flagged ≠ Done`. agent_qc will NOT auto-retry.

1. Read `reports/code-review-<name>-*.md` to understand failures
2. Fix issues in `src/<name>/` or revise `design/GDD-FEATURE-<name>.md`
3. Reset GDD to trigger reprocessing — see `RUNBOOK-restart-agent.md`
