# How To: Add a New Agent

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step 1 — Create Agent Folder](#step-1--create-agent-folder)
3. [Step 2 — Create Identity Files](#step-2--create-identity-files)
4. [Step 3 — AGENTS.md Parts A-F](#step-3--agentsmd-parts-a-f)
5. [Step 4 — Register in OpenClaw](#step-4--register-in-openclaw)
6. [Step 5 — Init State File](#step-5--init-state-file)
7. [Step 6 — Create Cron Job](#step-6--create-cron-job)
8. [Step 7 — Verify](#step-7--verify)

---

## Prerequisites

- OpenClaw installed and running
- Access to `openclaw.json` config
- Workspace: `D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\`

---

## Step 1 — Create Agent Folder

    openclaw/agents/<agent_id>/

Example: `openclaw/agents/agent_analytics/`

---

## Step 2 — Create Identity Files

Create 4 files in the agent folder:

| File | Purpose | Key Content |
|------|---------|-------------|
| `SOUL.md` | Agent identity & personality | Name, role description, working style, signature emoji |
| `USER.md` | Project context | What the agent needs to know about CCN2, workspace paths, key file locations |
| `AGENTS.md` | HEARTBEAT logic | Parts A-F (see Step 3) |
| `HEARTBEAT.md` | Runtime instructions | Hash computation, status enum, change detection, error handling |

**HEARTBEAT.md must include these 4 sections**:
1. `## Hash Computation` — PowerShell → md5sum → pseudo-hash fallback chain
2. `## Status Enum` — pending/processing/done/skipped/error definitions
3. `## Change Detection Logic` — when to reprocess vs skip
4. `## Error Handling` — try/catch pattern, error.log append, exit 0

---

## Step 3 — AGENTS.md Parts A-F

Minimum 6 parts required:

| Part | Name | Content |
|------|------|---------|
| A | Identity & Role | Who the agent is, what it does, when it runs |
| B | Input Sources | Which files/folders it reads; what triggers processing |
| C | Processing Logic | Step-by-step what it does with each input |
| D | Gate Rules | Conditions to skip (already processed, wrong status, etc.) |
| E | Constraints | What agent must NOT do |
| F | Output Format | What files it creates/modifies; exact formats |

**Special agents**: `agent_qc` also needs **Part F: Smoke Test** (6 checks) and **Part G: Pipeline Watch** (48h stuck detection)

---

## Step 4 — Register in OpenClaw

Add entry to `~/.openclaw/openclaw.json`:

    {
      "agent_id": "agent_analytics",
      "name": "Analytics Agent",
      "model": "openrouter/<model>",
      "workspace_path": "D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace",
      "heartbeat_path": "D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/openclaw/agents/agent_analytics/HEARTBEAT.md"
    }

---

## Step 5 — Init State File

    echo '{}' > ccn2_workspace/.state/agent_analytics_processed.json

Verify: file exists with content `{}`.

---

## Step 6 — Create Cron Job

Reference: `CRON_SETUP.md` for full syntax and existing jobs.

**Offset rules** (avoid conflicts with existing jobs):
- Main agent every 15min — used offsets: :00/:30, :02/:32, :04/:34
- Impl agent every 30min — used offsets: :17/:47, :19/:49, :21/:51

Pick an unused offset pair and add entry to `CRON_SETUP.md`.

---

## Step 7 — Verify

After 1 cron cycle (15-30 min):

- [ ] State file has entries (not empty `{}`)
- [ ] Smoke test C1_concepts passes (state files count up)
- [ ] No errors: `grep "agent_analytics" ccn2_workspace/.state/error.log`
- [ ] Dashboard updated: agent card appears in `reports/dashboard.html`
- [ ] HEARTBEAT logic working: state entries have correct schema
